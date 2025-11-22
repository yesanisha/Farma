// screens/ScanResults.js - Results screen for plant disease detection

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Share,
    Alert,
    Dimensions,
    Platform,
    ImageBackground,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    SlideInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import NotificationToast from '../components/NotificationToast';
import { getTreatmentRecommendations } from "../services/geminiService";

const { width, height } = Dimensions.get('window');

const ScanResults = ({ navigation, route }) => {
    const { predictions = [], topPrediction, imageUri, timestamp } = route.params || {};

    const [notification, setNotification] = useState(null);
    const [diseaseDetails, setDiseaseDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    const scaleValue = useSharedValue(0.8);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleValue.value }],
    }));

    // Initialize with prediction data on mount
    useEffect(() => {
        scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });

        // Use prediction data immediately
        if (topPrediction?.class_name) {
            setDiseaseDetails({
                disease_name: topPrediction.class_name,
                disease_type: "Plant Disease",
                severity_level: topPrediction.confidence >= 0.8 ? "High" : topPrediction.confidence >= 0.5 ? "Medium" : "Low",
                symptoms_description: topPrediction.symptoms?.join("\n• ") || topPrediction.description,
                treatment_methods: topPrediction.treatment?.join("\n• ") || "See treatment tab for details",
                prevention: topPrediction.prevention,
            });
        }
    }, [topPrediction]);

    // Fetch detailed disease information using Gemini AI
    const fetchDiseaseDetails = async (diseaseName) => {
        if (loading || !diseaseName) return;
        console.log("Fetching disease details for:", diseaseName);

        try {
            setLoading(true);
            setNotification({
                type: 'info',
                title: 'Loading details...',
                message: 'Getting AI recommendations',
            });

            // Get treatment recommendations from Gemini
            const recommendations = await getTreatmentRecommendations(diseaseName);
            console.log("Gemini recommendations received");

            if (recommendations) {
                // Transform Gemini data to disease details format
                const diseaseInfo = {
                    disease_name: recommendations.disease_name || diseaseName,
                    disease_type: "Plant Disease",
                    severity_level: recommendations.severity || "Medium",
                    symptoms_description: recommendations.immediate_actions?.join("\n• ") || "See treatment for details",
                    treatment_methods: recommendations.treatment_options?.map(t =>
                        `${t.name}: ${t.description}`
                    ).join("\n\n") || "Consult agricultural expert",
                    prevention: recommendations.prevention_measures,
                    recovery_time: recommendations.recovery_time,
                    when_to_seek_expert: recommendations.when_to_seek_expert,
                };

                setDiseaseDetails(diseaseInfo);
                setNotification({
                    type: 'success',
                    title: 'AI Analysis Complete',
                    message: 'Treatment recommendations loaded',
                });
            } else {
                // Use prediction data if Gemini fails
                const prediction = predictions.find(p => p.class_name === diseaseName) || topPrediction;
                if (prediction) {
                    setDiseaseDetails({
                        disease_name: prediction.class_name,
                        disease_type: "Plant Disease",
                        severity_level: prediction.confidence >= 0.8 ? "High" : prediction.confidence >= 0.5 ? "Medium" : "Low",
                        symptoms_description: prediction.symptoms?.join("\n• ") || prediction.description,
                        treatment_methods: prediction.treatment?.join("\n• ") || "Consult agricultural expert",
                        prevention: prediction.prevention,
                    });
                }
                setNotification({
                    type: 'info',
                    title: 'Using scan data',
                    message: 'Showing analysis from scan',
                });
            }
        } catch (error) {
            console.error('Error fetching disease details:', error);
            // Fallback to prediction data
            const prediction = predictions.find(p => p.class_name === diseaseName) || topPrediction;
            if (prediction) {
                setDiseaseDetails({
                    disease_name: prediction.class_name,
                    disease_type: "Plant Disease",
                    severity_level: prediction.confidence >= 0.8 ? "High" : prediction.confidence >= 0.5 ? "Medium" : "Low",
                    symptoms_description: prediction.symptoms?.join("\n• ") || prediction.description,
                    treatment_methods: prediction.treatment?.join("\n• ") || "Consult agricultural expert",
                    prevention: prediction.prevention,
                });
            }
            setNotification({
                type: 'info',
                title: 'Using scan data',
                message: 'Showing analysis from original scan',
            });
        } finally {
            setLoading(false);
        }
    };

    // Share diagnosis
    const shareDiagnosis = async () => {
        try {
            const confidence = ((topPrediction?.confidence || 0) * 100).toFixed(1);
            const dateStr = new Date(timestamp || Date.now()).toLocaleDateString();

            let shareMessage = `🌱 Plant Disease Detection Results\n\n`;
            shareMessage += `📋 Primary Diagnosis: ${topPrediction?.class_name || 'Unknown'}\n`;
            shareMessage += `🎯 Confidence: ${confidence}%\n`;
            shareMessage += `📅 Scanned: ${dateStr}\n\n`;

            if (predictions.length > 1) {
                shareMessage += `🔍 Other possible conditions:\n`;
                predictions.slice(1, 3).forEach((p, idx) => {
                    shareMessage += `${idx + 2}. ${p.class_name} (${((p.confidence || 0) * 100).toFixed(1)}%)\n`;
                });
                shareMessage += `\n`;
            }

            if (diseaseDetails) {
                shareMessage += `💡 Treatment: ${diseaseDetails.treatment_methods || 'Consult agricultural expert'}\n\n`;
            }

            shareMessage += `Generated by Farma - AI Plant Disease Detection App`;

            const result = await Share.share({
                title: 'Plant Disease Diagnosis - Farma',
                message: shareMessage,
            });

            if (result.action === Share.sharedAction) {
                setNotification({
                    type: 'success',
                    title: 'Shared successfully!',
                    message: 'Diagnosis shared',
                });
            }
        } catch (error) {
            console.error('❌ Share error:', error);
            setNotification({
                type: 'error',
                title: 'Share failed',
                message: 'Could not share diagnosis',
            });
        }
    };

    // Navigate to disease detail - pass full Gemini prediction data
    const viewDiseaseDetail = (diseaseName, confidence) => {
        // Find the full prediction data for this disease
        const prediction = predictions.find(p => p.class_name === diseaseName) || topPrediction;

        // Build scanResult object with all Gemini data
        const scanResultData = {
            prediction: predictions,
            plant_name: topPrediction?.plant_name || "Unknown Plant",
            health_status: topPrediction?.health_status || "diseased",
        };

        navigation.navigate("DiseaseDetail", {
            name: diseaseName,
            confidence: confidence,
            imageUri: imageUri,
            fromScan: true,
            scanResult: scanResultData,
            disease: diseaseDetails || {
                disease_name: prediction?.class_name || diseaseName,
                disease_type: "Plant Disease",
                severity_level: confidence >= 0.8 ? "High" : confidence >= 0.5 ? "Medium" : "Low",
                symptoms_description: prediction?.symptoms?.join("\n• ") || prediction?.description,
                treatment_methods: prediction?.treatment?.join("\n• "),
                prevention: prediction?.prevention,
            },
        });
    };

    // Get severity color
    const getSeverityColor = (confidence) => {
        const conf = confidence || 0;
        if (conf >= 0.8) return '#FF3B30'; // High confidence - Red
        if (conf >= 0.6) return '#FF9500'; // Medium confidence - Orange  
        if (conf >= 0.4) return '#FFCC00'; // Low-medium confidence - Yellow
        return '#8E8E93'; // Very low confidence - Gray
    };

    const getSeverityText = (confidence) => {
        const conf = confidence || 0;
        if (conf >= 0.8) return 'High Confidence';
        if (conf >= 0.6) return 'Medium Confidence';
        if (conf >= 0.4) return 'Low Confidence';
        return 'Very Low Confidence';
    };

    const dismissNotification = () => setNotification(null);

    if (!predictions || predictions.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#8E8E93" />
                    <Text style={styles.errorTitle}>No Results Found</Text>
                    <Text style={styles.errorText}>
                        We couldn't detect any plant diseases in this image.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.primaryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <ImageBackground source={require('../../assets/1.jpg')} style={styles.bgImage} resizeMode="cover">
            <View style={styles.overlay} />

            <SafeAreaView style={styles.container}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Diagnosis Results</Text>
                    <TouchableOpacity style={styles.shareHeaderButton} onPress={shareDiagnosis}>
                        <Ionicons name="share-outline" size={24} color="#4A7C59" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Image Preview */}
                    {imageUri && (
                        <Animated.View style={[styles.imageContainer, animatedStyle]} entering={FadeIn.duration(600)}>
                            <Image source={{ uri: imageUri }} style={styles.scanImage} />
                            <View style={styles.imageOverlay}>
                                <Ionicons name="camera" size={20} color="#FFFFFF" />
                                <Text style={styles.imageTimestamp}>
                                    {new Date(timestamp || Date.now()).toLocaleString()}
                                </Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Primary Result */}
                    <Animated.View style={styles.primaryResultCard} entering={SlideInUp.duration(700).delay(200)}>
                        <View style={styles.primaryResultHeader}>
                            <View style={styles.primaryResultInfo}>
                                <Text style={styles.primaryResultLabel}>Primary Diagnosis</Text>
                                <Text style={styles.primaryResultName}>{topPrediction?.class_name || 'Unknown Disease'}</Text>
                                <View style={styles.confidenceContainer}>
                                    <View style={[styles.confidenceBadge, { backgroundColor: getSeverityColor(topPrediction?.confidence) }]}>
                                        <Text style={styles.confidenceText}>
                                            {((topPrediction?.confidence || 0) * 100).toFixed(1)}%
                                        </Text>
                                    </View>
                                    <Text style={styles.severityText}>
                                        {getSeverityText(topPrediction?.confidence)}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.detailsButton}
                                onPress={() => fetchDiseaseDetails(topPrediction?.class_name)}
                                disabled={loading}
                            >
                                <Ionicons
                                    name={loading ? "hourglass" : "information-circle-outline"}
                                    size={24}
                                    color="#4A7C59"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Disease Details */}
                        {diseaseDetails && (
                            <View style={styles.diseaseDetailsSection}>
                                <View style={styles.detailRow}>
                                    <Ionicons name="medical-outline" size={16} color="#666" />
                                    <Text style={styles.detailLabel}>Type:</Text>
                                    <Text style={styles.detailValue}>
                                        {diseaseDetails.disease_type || diseaseDetails.pathogen_type || 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Ionicons name="warning-outline" size={16} color="#666" />
                                    <Text style={styles.detailLabel}>Severity:</Text>
                                    <Text style={styles.detailValue}>
                                        {diseaseDetails.severity_level || 'Unknown'}
                                    </Text>
                                </View>
                                {diseaseDetails.symptoms_description && (
                                    <View style={styles.symptomsSection}>
                                        <Text style={styles.symptomsTitle}>Symptoms:</Text>
                                        <Text style={styles.symptomsText} numberOfLines={3}>
                                            {diseaseDetails.symptoms_description}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => viewDiseaseDetail(topPrediction?.class_name, topPrediction?.confidence)}
                            >
                                <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
                                <Text style={styles.primaryButtonText}>View Details</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={shareDiagnosis}>
                                <Ionicons name="share-outline" size={18} color="#4A7C59" />
                                <Text style={styles.secondaryButtonText}>Share</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Alternative Results */}
                    {predictions.length > 1 && (
                        <Animated.View style={styles.alternativesCard} entering={SlideInUp.duration(700).delay(400)}>
                            <Text style={styles.alternativesTitle}>Alternative Possibilities</Text>
                            <Text style={styles.alternativesSubtitle}>
                                Other conditions that might match your plant:
                            </Text>

                            <View style={styles.alternativesList}>
                                {predictions.slice(1, 4).map((prediction, index) => (
                                    <TouchableOpacity
                                        key={`alt-${index}`}
                                        style={styles.alternativeItem}
                                        onPress={() => viewDiseaseDetail(prediction.class_name, prediction.confidence)}
                                    >
                                        <View style={styles.alternativeInfo}>
                                            <Text style={styles.alternativeName}>{prediction.class_name}</Text>
                                            <Text style={styles.alternativeConfidence}>
                                                {((prediction.confidence || 0) * 100).toFixed(1)}% match
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {/* Quick Actions */}
                    <Animated.View style={styles.quickActionsCard} entering={SlideInUp.duration(700).delay(600)}>
                        <Text style={styles.quickActionsTitle}>What's Next?</Text>

                        <TouchableOpacity
                            style={styles.quickActionItem}
                            onPress={() => navigation.getParent()?.navigate("History")}
                        >
                            <Ionicons name="time-outline" size={20} color="#4A7C59" />
                            <Text style={styles.quickActionText}>View Scan History</Text>
                            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionItem}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="scan-outline" size={20} color="#4A7C59" />
                            <Text style={styles.quickActionText}>Scan Another Plant</Text>
                            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.quickActionItem}
                            onPress={() => navigation.navigate("Plants")}
                        >
                            <Ionicons name="leaf-outline" size={20} color="#4A7C59" />
                            <Text style={styles.quickActionText}>Browse Plant Database</Text>
                            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Disclaimer */}
                    <Animated.View style={styles.disclaimerCard} entering={FadeIn.delay(800)}>
                        <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
                        <Text style={styles.disclaimerText}>
                            This diagnosis is AI-generated and should be used as a reference only.
                            For critical plant health decisions, please consult with agricultural experts or plant pathologists.
                        </Text>
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
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.95)' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 12) + 8 : 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
    shareHeaderButton: { padding: 8 },

    scrollContent: { padding: 16, paddingBottom: 40 },

    imageContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#000',
    },
    scanImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
    },
    imageTimestamp: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },

    primaryResultCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryResultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    primaryResultInfo: { flex: 1 },
    primaryResultLabel: {
        fontSize: 12,
        color: '#8E8E93',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 4,
    },
    primaryResultName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 12,
    },
    confidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    confidenceBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    confidenceText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    severityText: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },
    detailsButton: { padding: 8 },

    diseaseDetailsSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        minWidth: 60,
    },
    detailValue: {
        fontSize: 14,
        color: '#1C1C1E',
        flex: 1,
    },
    symptomsSection: { marginTop: 12 },
    symptomsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
    },
    symptomsText: {
        fontSize: 14,
        color: '#1C1C1E',
        lineHeight: 20,
    },

    actionButtonsContainer: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4A7C59',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F2F2F7',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    secondaryButtonText: {
        color: '#4A7C59',
        fontSize: 16,
        fontWeight: '600',
    },

    alternativesCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    alternativesTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 6,
    },
    alternativesSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 16,
    },
    alternativesList: { gap: 12 },
    alternativeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
    },
    alternativeInfo: { flex: 1 },
    alternativeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    alternativeConfidence: {
        fontSize: 14,
        color: '#8E8E93',
    },

    quickActionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    quickActionsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 16,
    },
    quickActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    quickActionText: {
        flex: 1,
        fontSize: 16,
        color: '#1C1C1E',
    },

    disclaimerCard: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        alignItems: 'flex-start',
    },
    disclaimerText: {
        flex: 1,
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },

    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1C1C1E',
        marginTop: 20,
        marginBottom: 10,
    },
    errorText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
});

export default ScanResults;