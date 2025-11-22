import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Image,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import NotificationToast from '../components/NotificationToast';
import StorageService from "../services/storage";
import localAuth from "../services/localAuth";
import localDatabase from "../services/localDatabase";
import { analyzePlantDisease } from "../services/geminiService";
import scanRateLimiter from "../utils/scanRateLimiter";

const { width, height } = Dimensions.get('window');

const TERMINAL_STATUSES = new Set(['complete', 'error', 'inference_done']);

const ScanScreen = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [notification, setNotification] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const [curUploadId, setCurUploadId] = useState(null);
  const [curStatus, setCurStatus] = useState('—');
  const [rateLimitInfo, setRateLimitInfo] = useState({ remaining: 10, used: 0, limit: 10 });

  const scanAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);
  const borderRadius = useSharedValue(20);

  const animatedScanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanAnimation.value }],
  }));
  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));
  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderRadius: borderRadius.value,
  }));

  useEffect(() => {
    if (isScanning && !isNavigating && !TERMINAL_STATUSES.has(curStatus)) {
      console.log('Starting animations');
      scanAnimation.value = withRepeat(withTiming(200, { duration: 2000 }), -1, true);
      pulseAnimation.value = withRepeat(withSpring(1.1, { damping: 2, stiffness: 100 }), -1, true);
    } else {
      console.log('Stopping animations - isScanning:', isScanning, 'isNavigating:', isNavigating, 'status:', curStatus);
      scanAnimation.value = 0;
      pulseAnimation.value = 1;
    }
  }, [isScanning, isNavigating, curStatus]);

  useEffect(() => {
    (async () => {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!cameraPerm.granted || !mediaPerm.granted) {
        Alert.alert('Permissions required', 'Please allow camera and gallery access in your settings.');
      }
    })();
  }, []);

  // Check rate limit on mount and when screen comes into focus
  useEffect(() => {
    const checkRateLimit = async () => {
      const info = await scanRateLimiter.getUsageInfo();
      setRateLimitInfo(info);
    };
    checkRateLimit();

    // Also check when navigation focuses this screen
    const unsubscribe = navigation.addListener('focus', checkRateLimit);
    return unsubscribe;
  }, [navigation]);

  // Save to history function using local database
  const saveToHistory = async (predictions, status = 'complete') => {
    try {
      const timestamp = new Date().toISOString();
      const newEntry = {
        id: Date.now().toString(),
        predictions: Array.isArray(predictions) ? predictions : [],
        imageUri,
        timestamp,
        status,
        uploadId: curUploadId,
      };

      // Use StorageService for scan history
      const existing = await StorageService.getItem("scan_history");
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(newEntry);

      // Keep only last 50 entries
      if (history.length > 50) {
        history.splice(50);
      }

      await StorageService.setItem("scan_history", JSON.stringify(history));
      console.log('Saved to history:', newEntry);

      // Update user document with detected diseases using local database
      if (status === 'complete' || status === 'inference_done') {
        await updateUserDocument(predictions);
      }
    } catch (err) {
      console.error("Error saving to history:", err);
    }
  };

  // Update user document with detected diseases using local database
  const updateUserDocument = async (predictions) => {
    try {
      const user = localAuth.getCurrentUser();
      if (!user || !predictions || predictions.length === 0) return;

      const userData = await localDatabase.getUserData();
      const currentCount = userData?.total_scans || 0;
      const currentDiseases = userData?.detected_diseases || [];

      // Extract unique disease names from predictions
      const newDiseases = predictions.map(p => ({
        disease_name: p.class_name,
        confidence: p.confidence,
        detected_at: new Date().toISOString()
      }));

      // Get unique disease names to add
      const existingDiseaseNames = currentDiseases.map(d => d.disease_name);
      const uniqueNewDiseases = newDiseases.filter(d =>
        !existingDiseaseNames.includes(d.disease_name)
      );

      await localDatabase.updateUserData({
        total_scans: currentCount + 1,
        detected_diseases: [...currentDiseases, ...uniqueNewDiseases],
        last_scan_at: new Date().toISOString(),
      });

      console.log('Updated user document with scan data');
    } catch (error) {
      console.error('Error updating user document:', error);
    }
  };

  // FORCE STOP all animations immediately
  const forceStopAnimations = () => {
    console.log('FORCE STOPPING all animations');
    scanAnimation.value = 0;
    pulseAnimation.value = 1;
    setIsScanning(false);
  };

  // Enhanced scan result handler
  useEffect(() => {
    if (!scanResult) return;

    console.log('Scan result updated:', scanResult.status);

    // IMMEDIATELY stop animations for any terminal status
    if (TERMINAL_STATUSES.has(scanResult.status)) {
      forceStopAnimations();
      saveToHistory(scanResult.prediction || [], scanResult.status);
    }

    // Handle successful inference
    if (scanResult.status === "inference_done" && !isNavigating) {
      console.log('Analysis complete detected');

      forceStopAnimations();
      setIsNavigating(true);

      const predictions = scanResult.prediction || [];

      console.log('Parsed predictions:', predictions.length);

      if (predictions.length > 0 || scanResult.health_status) {
        setNotification({
          type: 'success',
          title: scanResult.health_status === 'healthy' ? 'Plant Looks Healthy!' : 'Disease Detected!',
          message: predictions.length > 0 ?
            `Found ${predictions.length} possible condition(s)` :
            scanResult.overall_assessment || 'Analysis completed'
        });

        // Navigate to results
        const delay = Platform.OS === 'web' ? 1000 : 2000;
        setTimeout(() => {
          if (predictions.length > 0) {
            navigateToResults(predictions);
          } else {
            setIsNavigating(false);
          }
        }, delay);
      }
    }

    // Handle error cases
    if (scanResult.status === 'error') {
      console.log('Scan error detected');
      forceStopAnimations();
      setNotification({
        type: 'error',
        title: 'Scan Failed',
        message: scanResult.message || 'Analysis could not be completed',
      });
    }
  }, [scanResult, isNavigating]);

  // Navigate to results screen
  const navigateToResults = (predictions) => {
    if (!predictions || predictions.length === 0) return;

    try {
      const topPrediction = predictions.reduce((prev, current) =>
        (prev.confidence || 0) > (current.confidence || 0) ? prev : current
      );

      navigation.navigate("ScanResults", {
        predictions,
        topPrediction,
        imageUri,
        timestamp: new Date().toISOString(),
      });

      resetScanScreen();
    } catch (error) {
      console.error('Navigation error:', error);
      setIsNavigating(false);
    }
  };

  // Reset scan screen to initial state
  const resetScanScreen = () => {
    forceStopAnimations();
    setScanResult(null);
    setImageUri(null);
    setUploadProgress(0);
    setCurUploadId(null);
    setCurStatus('—');
    setIsScanning(false);
    setIsNavigating(false);
    setNotification(null);
    borderRadius.value = withTiming(20, { duration: 500 });
  };

  // Analyze plant image using Gemini API
  const analyzeWithGemini = async (uri) => {
    try {
      console.log('Starting Gemini analysis...');
      setCurStatus('analyzing');

      // Progress callback for real-time updates
      const onProgress = (message, progress) => {
        setCurStatus(message);
        setUploadProgress(progress);
      };

      // Call Gemini API with progress callback
      const result = await analyzePlantDisease(uri, onProgress);

      console.log('Gemini analysis result:', result);

      const uploadId = `local_${Date.now()}`;
      setCurUploadId(uploadId);
      setCurStatus(result.status);

      setScanResult({
        status: result.status,
        prediction: result.prediction || [],
        health_status: result.health_status,
        plant_name: result.plant_name,
        scientific_name: result.scientific_name,
        overall_assessment: result.overall_assessment,
        recommendations: result.recommendations,
        is_plant: result.is_plant,
        raw: result,
      });

      return result;
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw error;
    }
  };

  const startScanning = async (uri) => {
    if (isScanning || isNavigating) return;

    // Check rate limit before scanning
    const limitCheck = await scanRateLimiter.canScan();
    if (!limitCheck.canScan) {
      Alert.alert(
        'Daily Limit Reached',
        `You've used all ${limitCheck.limit} scans for today.\n\nYour limit will reset in ${limitCheck.resetTime}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Increment scan count
    const incrementResult = await scanRateLimiter.incrementScanCount();
    setRateLimitInfo({
      remaining: incrementResult.remaining,
      used: incrementResult.used,
      limit: incrementResult.limit,
    });

    setIsScanning(true);
    setScanResult(null);
    setImageUri(uri);
    setUploadProgress(0);
    setIsNavigating(false);
    borderRadius.value = withTiming(100, { duration: 500 });

    try {
      setNotification({
        type: 'info',
        title: 'Analyzing...',
        message: `Scanning plant with AI... (${incrementResult.remaining} scans left today)`,
      });

      await analyzeWithGemini(uri);

      setNotification({
        type: 'success',
        title: 'Analysis complete',
        message: 'Processing results...',
      });
    } catch (error) {
      console.error('Scan error:', error);
      setNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: error.message || 'Something went wrong, please try again.',
      });

      saveToHistory([], 'error');
      setIsScanning(false);
      setIsNavigating(false);
      borderRadius.value = withTiming(20, { duration: 500 });
    }
  };

  const pickFromGallery = async () => {
    if (isScanning || isNavigating) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) startScanning(result.assets[0].uri);
    } catch (err) {
      Alert.alert('Error', 'Unable to access gallery.');
    }
  };

  const takePhoto = async () => {
    if (isScanning || isNavigating) return;

    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) startScanning(result.assets[0].uri);
    } catch (err) {
      Alert.alert('Error', 'Unable to open camera.');
    }
  };

  const dismissNotification = () => setNotification(null);

  // Enhanced disease click handler
  const handleDiseaseClick = async (diseaseName, confidence, index) => {
    console.log(`Disease clicked: ${diseaseName} (Confidence: ${confidence}, Index: ${index})`);
    try {
      setNotification({
        type: 'info',
        title: 'Loading disease information...',
        message: 'Please wait',
      });

      navigation.navigate("DiseaseDetail", {
        diseaseId: index,
        name: diseaseName,
        confidence,
        imageUri,
        fromScan: true,
        scanResult: scanResult
      });

      dismissNotification();
    } catch (error) {
      console.error('Error navigating to disease detail:', error);
      setNotification({
        type: 'error',
        title: 'Error',
        message: 'Could not load disease information',
      });
    }
  };

  // Share diagnosis functionality
  const shareDiagnosis = async (predictions) => {
    if (!predictions || predictions.length === 0) return;

    try {
      const topPrediction = predictions[0];
      const shareContent = {
        title: 'Plant Disease Diagnosis - Farma App',
        message: `Plant Disease Detection Results:\n\n` +
          `Disease: ${topPrediction.class_name}\n` +
          `Confidence: ${((topPrediction.confidence || 0) * 100).toFixed(1)}%\n` +
          `Scanned on: ${new Date().toLocaleDateString()}\n\n` +
          `Generated by Farma - AI Plant Disease Detection App`,
      };

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        setNotification({
          type: 'success',
          title: 'Shared successfully!',
          message: 'Diagnosis shared',
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      setNotification({
        type: 'error',
        title: 'Share failed',
        message: 'Could not share diagnosis',
      });
    }
  };

  return (
    <ImageBackground source={require('../../assets/1.jpg')} style={styles.bgImage} resizeMode="cover">
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Plant Scanner</Text>
          </View>

          {/* Rate Limit Indicator */}
          <View style={styles.rateLimitContainer}>
            <View style={styles.rateLimitBadge}>
              <Ionicons
                name={rateLimitInfo.remaining > 3 ? "scan" : rateLimitInfo.remaining > 0 ? "warning" : "close-circle"}
                size={14}
                color={rateLimitInfo.remaining > 3 ? "#4A7C59" : rateLimitInfo.remaining > 0 ? "#FF9500" : "#FF3B30"}
              />
              <Text style={[
                styles.rateLimitText,
                rateLimitInfo.remaining <= 3 && rateLimitInfo.remaining > 0 && styles.rateLimitWarning,
                rateLimitInfo.remaining === 0 && styles.rateLimitExhausted,
              ]}>
                {rateLimitInfo.remaining}/{rateLimitInfo.limit} scans left today
              </Text>
            </View>
          </View>

          {/* Scanning Area */}
          <Animated.View style={[styles.scanArea, animatedBorderStyle]} entering={SlideInUp.duration(600)}>
            <View style={styles.viewfinder}>
              <View style={[styles.cornerBracket, styles.topLeft]} />
              <View style={[styles.cornerBracket, styles.topRight]} />
              <View style={[styles.cornerBracket, styles.bottomLeft]} />
              <View style={[styles.cornerBracket, styles.bottomRight]} />

              {(isScanning && !isNavigating) && <Animated.View style={[styles.scanLine, animatedScanStyle]} />}

              {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

              <Animated.View style={styles.instructionContainer} entering={FadeIn.delay(300)}>
                <Ionicons
                  name={isScanning ? 'scan' : isNavigating ? 'checkmark-circle' : 'leaf'}
                  size={48}
                  color={isScanning ? '#4A7C59' : isNavigating ? '#34C759' : '#8E8E93'}
                />
                <Text style={styles.instructionText}>
                  {isNavigating ? 'Analysis complete!' :
                    isScanning ? curStatus || 'Analyzing plant...' :
                      'Position plant in the frame'}
                </Text>
                {isScanning && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
                  </View>
                )}
                {!isScanning && !isNavigating && (
                  <Text style={styles.instructionSubtext}>
                    Powered by Google Gemini AI
                  </Text>
                )}
              </Animated.View>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, (isScanning || isNavigating) && styles.disabledButton]}
              onPress={pickFromGallery}
              disabled={isScanning || isNavigating}
            >
              <Ionicons name="images" size={24} color={(isScanning || isNavigating) ? "#8E8E93" : "#4A7C59"} />
              <Text style={[styles.actionButtonText, (isScanning || isNavigating) && styles.disabledText]}>Gallery</Text>
            </TouchableOpacity>

            <Animated.View style={animatedPulseStyle}>
              <TouchableOpacity
                style={[
                  styles.scanButton,
                  isScanning && styles.scanButtonActive,
                  isNavigating && styles.scanButtonSuccess
                ]}
                onPress={() => {
                  if (isNavigating && scanResult?.prediction?.length > 0) {
                    // Navigate to results when scan is complete
                    navigateToResults(scanResult.prediction);
                  } else if (isScanning) {
                    // Cancel current scan
                    resetScanScreen();
                  } else {
                    // Start new scan
                    takePhoto();
                  }
                }}
                activeOpacity={0.8}
                disabled={false}
              >
                <Ionicons
                  name={
                    isNavigating ? 'arrow-forward' :
                      isScanning ? 'close' :
                        'camera'
                  }
                  size={32}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={[styles.actionButton, (isScanning || isNavigating) && styles.disabledButton]}
              onPress={() => navigation.getParent()?.navigate("History")}
              disabled={isScanning || isNavigating}
            >
              <Ionicons name="time" size={24} color={(isScanning || isNavigating) ? "#8E8E93" : "#4A7C59"} />
              <Text style={[styles.actionButtonText, (isScanning || isNavigating) && styles.disabledText]}>History</Text>
            </TouchableOpacity>
          </View>

          {/* Result Preview */}
          {scanResult && (
            <Animated.View style={styles.resultContainer} entering={SlideInUp.duration(600)}>
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={scanResult.status === 'inference_done' ? 'checkmark-circle' :
                      scanResult.status === 'complete' ? 'checkmark-circle' :
                        'information-circle'}
                    size={24}
                    color={scanResult.status === 'inference_done' || scanResult.status === 'complete' ? '#34C759' : '#FF9500'}
                  />
                  <View style={styles.resultTitleContainer}>
                    <Text style={styles.resultTitle}>
                      {scanResult.plant_name ? `${scanResult.plant_name}` : 'Analysis Results'}
                    </Text>
                    {scanResult.scientific_name && (
                      <Text style={styles.scientificName}>{scanResult.scientific_name}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => shareDiagnosis(scanResult.prediction)}
                  >
                    <Ionicons name="share-outline" size={20} color="#4A7C59" />
                  </TouchableOpacity>
                </View>

                {/* Health Status Badge */}
                {scanResult.health_status && (
                  <View style={[
                    styles.healthBadge,
                    scanResult.health_status === 'healthy' ? styles.healthyBadge :
                      scanResult.health_status === 'diseased' ? styles.diseasedBadge :
                        styles.unknownBadge
                  ]}>
                    <Ionicons
                      name={scanResult.health_status === 'healthy' ? 'checkmark-circle' : 'alert-circle'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.healthBadgeText}>
                      {scanResult.health_status.charAt(0).toUpperCase() + scanResult.health_status.slice(1)}
                    </Text>
                  </View>
                )}

                {/* Predictions */}
                <View style={{ gap: 6, marginTop: 12 }}>
                  {scanResult.prediction && scanResult.prediction.length > 0 ? (
                    scanResult.prediction.map((p, idx) => (
                      <TouchableOpacity
                        key={`${p.class_name}-${idx}`}
                        style={styles.diseaseAlert}
                        onPress={() => handleDiseaseClick(p.class_name, p.confidence, p.index || idx)}
                      >
                        <Ionicons name="leaf" size={16} color="#34C759" />
                        <Text style={styles.diseaseAlertText}>
                          {p.class_name || 'Unknown Disease'} ({((p.confidence ?? 0) * 100).toFixed(1)}%)
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#34C759" />
                      </TouchableOpacity>
                    ))
                  ) : scanResult.status === 'inference_done' || scanResult.status === 'complete' ? (
                    <View style={styles.noDiseaseAlert}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.noDiseaseText}>
                        {scanResult.overall_assessment || 'No diseases detected - Plant appears healthy!'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.loadingAlert}>
                      <Ionicons name="hourglass" size={16} color="#FF9500" />
                      <Text style={styles.loadingText}>
                        Status: {scanResult.status} - Please wait...
                      </Text>
                    </View>
                  )}
                </View>

                {/* Recommendations */}
                {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                  <View style={styles.recommendationsContainer}>
                    <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                    {scanResult.recommendations.slice(0, 2).map((rec, idx) => (
                      <Text key={idx} style={styles.recommendationText}>• {rec}</Text>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Tips Section */}
          <Animated.View style={styles.tipsContainer} entering={FadeIn.delay(800)}>
            <Text style={styles.tipsTitle}>Scanning Tips</Text>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="sunny" size={16} color="#FF9500" />
                <Text style={styles.tipText}>Use good natural lighting</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="camera" size={16} color="#007AFF" />
                <Text style={styles.tipText}>Keep camera steady and focused</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="leaf" size={16} color="#34C759" />
                <Text style={styles.tipText}>Show diseased parts clearly</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="sparkles" size={16} color="#4A7C59" />
                <Text style={styles.tipText}>Powered by Google Gemini AI</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        <NotificationToast
          visible={!!notification}
          type={notification?.type}
          title={notification?.title}
          message={notification?.message}
          onDismiss={dismissNotification}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgImage: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.92)' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 12) + 8 : 8,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA', backgroundColor: 'transparent',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', alignContent: 'center', flex: 1, textAlign: 'center' },

  rateLimitContainer: { alignItems: 'center', marginTop: 8, marginBottom: -8 },
  rateLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  rateLimitText: { fontSize: 12, fontWeight: '500', color: '#4A7C59' },
  rateLimitWarning: { color: '#FF9500' },
  rateLimitExhausted: { color: '#FF3B30' },

  scanArea: { height: height * 0.4, backgroundColor: '#000', marginTop: 60, marginHorizontal: 16, overflow: 'hidden' },
  viewfinder: { flex: 1, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  previewImage: { ...StyleSheet.absoluteFillObject, resizeMode: 'cover', opacity: 0.3 },
  cornerBracket: { position: 'absolute', width: 30, height: 30, borderColor: '#4A7C59', borderWidth: 3 },
  topLeft: { top: 20, left: 20, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 20, right: 20, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 20, left: 20, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 20, right: 20, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: { position: 'absolute', top: 0, left: 20, right: 20, height: 2, backgroundColor: '#4A7C59' },
  instructionContainer: { alignItems: 'center', paddingHorizontal: 32 },
  instructionText: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 16, textAlign: 'center' },
  instructionSubtext: { fontSize: 14, color: '#B0B0B0', marginTop: 8, textAlign: 'center' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
  progressBar: { width: 150, height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4A7C59', borderRadius: 3 },
  progressText: { fontSize: 14, color: '#fff', fontWeight: '600', minWidth: 40 },

  actionContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 32 },
  actionButton: { alignItems: 'center', gap: 8 },
  actionButtonText: { fontSize: 14, fontWeight: '500', color: '#4A7C59' },
  disabledButton: { opacity: 0.5 },
  disabledText: { color: '#8E8E93' },
  scanButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4A7C59', justifyContent: 'center', alignItems: 'center' },
  scanButtonActive: { backgroundColor: '#FF3B30' },
  scanButtonSuccess: { backgroundColor: '#34C759' },

  resultContainer: { marginTop: 16, paddingHorizontal: 16 },
  resultCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  resultTitleContainer: { flex: 1, marginLeft: 12 },
  resultTitle: { fontSize: 18, fontWeight: '700' },
  scientificName: { fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 2 },
  shareButton: { padding: 4 },

  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  healthyBadge: { backgroundColor: '#34C759' },
  diseasedBadge: { backgroundColor: '#FF3B30' },
  unknownBadge: { backgroundColor: '#FF9500' },
  healthBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  diseaseAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FFF4', padding: 12, borderRadius: 8, justifyContent: 'space-between' },
  diseaseAlertText: { fontSize: 14, color: '#245C2C', marginLeft: 8, flex: 1 },
  noDiseaseAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FFF4', padding: 12, borderRadius: 8 },
  noDiseaseText: { fontSize: 14, color: '#245C2C', marginLeft: 8, flex: 1 },
  loadingAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E7', padding: 12, borderRadius: 8 },
  loadingText: { fontSize: 14, color: '#8B5A00', marginLeft: 8 },

  recommendationsContainer: { marginTop: 16, padding: 12, backgroundColor: '#F8F9FA', borderRadius: 8 },
  recommendationsTitle: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
  recommendationText: { fontSize: 13, color: '#666', marginBottom: 4 },

  tipsContainer: { marginTop: 24, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2 },
  tipsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  tipsList: { gap: 12 },
  tipItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tipText: { fontSize: 14, color: '#6B7C6B', flex: 1 },
});

export default ScanScreen;
