import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Platform,
    ImageBackground,
    Alert,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import localAuth from "../services/localAuth";
import localDatabase from "../services/localDatabase";
import apiService from "../services/apiService";

const DiseaseHistoryScreen = ({ navigation }) => {
    const [diseases, setDiseases] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clearingHistory, setClearingHistory] = useState(false); // ADDED: Loading state for clear operation
    const [stats, setStats] = useState({
        totalDiseases: 0,
        recentDiseases: 0,
        highConfidenceDiseases: 0
    });

    // Load detected diseases from local database
    const loadDiseaseHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Loading disease history from local database...');

            const user = localAuth.getCurrentUser();
            if (!user) {
                setError('Please log in to view disease history');
                setDiseases([]);
                return;
            }

            const userData = await localDatabase.getUserData();
            const detectedDiseases = userData?.detected_diseases || [];

            console.log('Fetched detected diseases:', detectedDiseases.length);

            // Sort by detection date (newest first)
            const sortedDiseases = detectedDiseases
                .sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at))
                .map((disease, index) => ({
                    ...disease,
                    id: `${disease.disease_name}_${index}`, // Ensure unique IDs
                }));

            setDiseases(sortedDiseases);

            // Calculate stats
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

            const recentCount = sortedDiseases.filter(d =>
                new Date(d.detected_at) >= thirtyDaysAgo
            ).length;

            const highConfidenceCount = sortedDiseases.filter(d =>
                (d.confidence || 0) >= 0.8
            ).length;

            setStats({
                totalDiseases: sortedDiseases.length,
                recentDiseases: recentCount,
                highConfidenceDiseases: highConfidenceCount
            });
        } catch (err) {
            console.error("Error loading disease history:", err);
            setError(err.message || 'Failed to load disease history');
            setDiseases([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadDiseaseHistory();
        setRefreshing(false);
    }, []);

    // Navigate to disease detail with API lookup
    const navigateToDiseaseDetail = async (diseaseItem) => {
        try {
            console.log('Looking up disease details for:', diseaseItem.disease_name);

            // Try to get detailed disease info from API
            const apiDiseases = await apiService.getDiseases({
                disease_name: diseaseItem.disease_name
            });

            const detailedDisease = apiDiseases.find(d =>
                d.disease_name.toLowerCase().includes(diseaseItem.disease_name.toLowerCase()) ||
                diseaseItem.disease_name.toLowerCase().includes(d.disease_name.toLowerCase())
            );

            if (detailedDisease) {
                navigation.navigate("DiseaseDetail", {
                    disease: detailedDisease,
                    confidence: diseaseItem.confidence,
                    detectedAt: diseaseItem.detected_at,
                    fromHistory: true
                });
            } else {
                // Fallback with basic info
                navigation.navigate("DiseaseDetail", {
                    name: diseaseItem.disease_name,
                    confidence: diseaseItem.confidence,
                    detectedAt: diseaseItem.detected_at,
                    fromHistory: true
                });
            }
        } catch (error) {
            console.error('Error fetching disease details:', error);
            Alert.alert(
                'Error',
                'Could not load detailed information for this disease.',
                [
                    {
                        text: 'View Basic Info',
                        onPress: () => navigation.navigate("DiseaseDetail", {
                            name: diseaseItem.disease_name,
                            confidence: diseaseItem.confidence,
                            detectedAt: diseaseItem.detected_at,
                            fromHistory: true
                        })
                    },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        }
    };

    // Clear disease history using local database
    const clearDiseaseHistory = async () => {
        // Check if history is already empty
        if (diseases.length === 0) {
            Alert.alert(
                "Already Empty",
                "Your disease history is already empty. There's nothing to clear.",
                [{ text: "OK" }]
            );
            return;
        }

        Alert.alert(
            "Clear Disease History",
            `Are you sure you want to delete all ${diseases.length} detected disease records? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setClearingHistory(true);
                            const user = localAuth.getCurrentUser();

                            if (!user) {
                                Alert.alert('Error', 'You must be logged in to clear history');
                                return;
                            }

                            console.log('Clearing disease history for user:', user.uid);

                            // Update local database to clear detected diseases
                            await localDatabase.updateUserData({
                                detected_diseases: [],
                                updatedAt: new Date().toISOString(),
                            });

                            console.log('Disease history cleared successfully');

                            // Update local state
                            setDiseases([]);
                            setStats({
                                totalDiseases: 0,
                                recentDiseases: 0,
                                highConfidenceDiseases: 0
                            });

                            Alert.alert('Success', 'Disease history cleared successfully');
                        } catch (error) {
                            console.error('Error clearing disease history:', error);

                            Alert.alert(
                                'Error',
                                `Failed to clear disease history: ${error.message || 'Unknown error'}`
                            );
                        } finally {
                            setClearingHistory(false);
                        }
                    }
                }
            ]
        );
    };

    // Get confidence color
    const getConfidenceColor = (confidence) => {
        const conf = confidence || 0;
        if (conf >= 0.8) return '#34C759'; // High confidence - green
        if (conf >= 0.6) return '#FF9500'; // Medium confidence - orange  
        return '#FF3B30'; // Low confidence - red
    };

    // Get confidence label
    const getConfidenceLabel = (confidence) => {
        const conf = confidence || 0;
        if (conf >= 0.8) return 'High';
        if (conf >= 0.6) return 'Medium';
        return 'Low';
    };

    // Group diseases by name for better display
    const groupedDiseases = diseases.reduce((acc, disease) => {
        const existing = acc.find(item => item.disease_name === disease.disease_name);
        if (existing) {
            existing.detections.push(disease);
            // Keep the highest confidence detection as primary
            if ((disease.confidence || 0) > (existing.confidence || 0)) {
                existing.confidence = disease.confidence;
                existing.detected_at = disease.detected_at;
            }
        } else {
            acc.push({
                ...disease,
                detections: [disease],
                detectionCount: 1
            });
        }
        return acc;
    }, []);

    // Update detection count for grouped diseases
    groupedDiseases.forEach(item => {
        item.detectionCount = item.detections.length;
    });

    // Load disease history when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadDiseaseHistory();
        }, [])
    );

    return (
        <ImageBackground
            source={require("../../assets/1.jpg")}
            style={styles.bgImage}
            resizeMode="cover"
        >
            <View style={styles.overlay} />
            <SafeAreaView style={styles.container}>
                <StatusBar
                    translucent
                    backgroundColor="transparent"
                    barStyle="dark-content"
                />

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Disease History</Text>
                    <View style={styles.headerActions}>
                        {/* IMPROVED: Clear button with loading state and better styling */}
                        <TouchableOpacity
                            style={[
                                styles.clearButton,
                                clearingHistory && styles.clearButtonDisabled
                            ]}
                            onPress={clearDiseaseHistory}
                            disabled={clearingHistory}
                        >
                            {clearingHistory ? (
                                <Ionicons name="hourglass" size={20} color="#FF3B30" />
                            ) : (
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Error Display */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={loadDiseaseHistory}>
                            <Ionicons name="refresh" size={16} color="#4A7C59" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Stats Header */}
                {diseases.length > 0 && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.totalDiseases}</Text>
                            <Text style={styles.statLabel}>Total Detected</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.recentDiseases}</Text>
                            <Text style={styles.statLabel}>Last 30 Days</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.highConfidenceDiseases}</Text>
                            <Text style={styles.statLabel}>High Confidence</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{groupedDiseases.length}</Text>
                            <Text style={styles.statLabel}>Unique Diseases</Text>
                        </View>
                    </View>
                )}

                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#4A7C59"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {loading && diseases.length === 0 ? (
                        <View style={styles.loadingContainer}>
                            <Ionicons name="hourglass" size={48} color="#C7C7CC" />
                            <Text style={styles.loadingText}>Loading disease history...</Text>
                        </View>
                    ) : groupedDiseases.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="medical-outline" size={64} color="#C7C7CC" />
                            <Text style={styles.emptyTitle}>No Diseases Detected</Text>
                            <Text style={styles.emptyText}>
                                When you scan plants and diseases are detected,
                                they will appear here for easy reference.
                            </Text>
                            <TouchableOpacity
                                style={styles.startScanButton}
                                onPress={() => navigation.navigate("Scan")}
                            >
                                <Ionicons name="scan" size={20} color="#FFFFFF" />
                                <Text style={styles.startScanText}>Start Scanning</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        groupedDiseases.map((diseaseItem, index) => (
                            <Animated.View
                                key={diseaseItem.id}
                                entering={SlideInRight.duration(300).delay(index * 50)}
                            >
                                <TouchableOpacity
                                    style={styles.diseaseCard}
                                    onPress={() => navigateToDiseaseDetail(diseaseItem)}
                                    activeOpacity={0.7}
                                >
                                    {/* Disease Icon and Info */}
                                    <View style={styles.diseaseIcon}>
                                        <Ionicons name="bug" size={24} color="#FF3B30" />
                                    </View>

                                    {/* Content */}
                                    <View style={styles.cardContent}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.diseaseName}>
                                                {diseaseItem.disease_name}
                                            </Text>
                                            {diseaseItem.detectionCount > 1 && (
                                                <View style={styles.countBadge}>
                                                    <Text style={styles.countText}>
                                                        {diseaseItem.detectionCount}x
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <View style={styles.diseaseDetails}>
                                            <View style={styles.confidenceContainer}>
                                                <View style={[
                                                    styles.confidenceBadge,
                                                    { backgroundColor: getConfidenceColor(diseaseItem.confidence) }
                                                ]}>
                                                    <Text style={styles.confidenceText}>
                                                        {getConfidenceLabel(diseaseItem.confidence)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.confidencePercentage}>
                                                    {((diseaseItem.confidence || 0) * 100).toFixed(1)}%
                                                </Text>
                                            </View>

                                            <Text style={styles.detectedAt}>
                                                Last detected: {new Date(diseaseItem.detected_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Chevron */}
                                    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    )}

                    {/* ADDED: Clearing progress indicator */}
                    {clearingHistory && (
                        <View style={styles.clearingContainer}>
                            <Ionicons name="hourglass" size={24} color="#FF3B30" />
                            <Text style={styles.clearingText}>Clearing history...</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgImage: { ...StyleSheet.absoluteFillObject },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.95)' },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 12) + 8 : 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#1C1C1E" },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    clearButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
    },
    // ADDED: Disabled state for clear button
    clearButtonDisabled: {
        opacity: 0.5,
    },

    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        color: '#FF3B30',
    },

    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 20, fontWeight: '700', color: '#4A7C59' },
    statLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
    statDivider: { width: 1, backgroundColor: '#E5E5EA', marginHorizontal: 16 },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 12,
    },

    // ADDED: Clearing progress indicator styles
    clearingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    clearingText: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '500',
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1C1C1E',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 40,
    },
    startScanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A7C59',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
    },
    startScanText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    diseaseCard: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
    },

    diseaseIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },

    cardContent: { flex: 1 },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    diseaseName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1C1C1E",
        flex: 1,
    },
    countBadge: {
        backgroundColor: '#4A7C59',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    countText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },

    diseaseDetails: { gap: 4 },
    confidenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    confidenceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    confidenceText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    confidencePercentage: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
    },
    detectedAt: {
        fontSize: 12,
        color: '#8E8E93',
    },
});

export default DiseaseHistoryScreen;