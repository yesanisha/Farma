// src/screens/DiseaseDetailScreen.js
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    StatusBar,
    Platform,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
    FadeIn,
    SlideInUp,
} from "react-native-reanimated";
import { getTreatmentRecommendations } from "../services/geminiService";
import { MaterialCommunityIcons } from '@expo/vector-icons';


const { width, height } = Dimensions.get("window");

const DiseaseDetailScreen = ({ route, navigation }) => {
    // Get all possible params - supports scan results, gallery, and direct navigation
    const {
        diseaseId,
        name,
        confidence,
        imageUri,
        fromScan,
        fromGallery,
        scanResult,
        disease: passedDisease,
        detectedAt
    } = route.params || {};

    const [disease, setDisease] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [geminiRecommendations, setGeminiRecommendations] = useState(null);

    useEffect(() => {
        const loadDiseaseData = async () => {
            setLoading(true);

            try {
                // If coming from scan with Gemini data, use that directly
                if (fromScan && scanResult) {
                    console.log("Loading disease from scan result");

                    // Find the specific prediction for this disease
                    const prediction = scanResult.prediction?.find(p =>
                        p.class_name === name || p.index === diseaseId
                    ) || scanResult.prediction?.[0];

                    if (prediction) {
                        setDisease({
                            disease_name: prediction.class_name || name,
                            disease_type: "Plant Disease",
                            pathogen_type: "Identified by AI",
                            severity_level: prediction.confidence >= 0.8 ? "High" :
                                           prediction.confidence >= 0.5 ? "Medium" : "Low",
                            symptoms_description: prediction.symptoms?.join("\n• ") || prediction.description,
                            causes: prediction.description || "Identified through AI image analysis",
                            treatment_methods: prediction.treatment?.join("\n• ") || "Consult treatment recommendations",
                            prevention: prediction.prevention || [],
                            affected_plant_parts: ["Leaves", "Fruit"],
                            confidence: prediction.confidence,
                            image_url: imageUri,
                        });

                        // Get additional recommendations from Gemini
                        try {
                            const recommendations = await getTreatmentRecommendations(
                                prediction.class_name || name,
                                scanResult.plant_name
                            );
                            setGeminiRecommendations(recommendations);
                        } catch (err) {
                            console.log("Could not get additional recommendations:", err);
                        }
                    }
                }
                // If disease data was passed directly (from gallery with Perenual data)
                else if (passedDisease) {
                    console.log("Using passed disease data");

                    // Transform Perenual disease data to display format
                    const transformedDisease = {
                        disease_name: passedDisease.disease_name || passedDisease.common_name,
                        disease_type: "Plant Disease/Pest",
                        pathogen_type: passedDisease.scientific_name || "Unknown",
                        severity_level: "Medium",
                        symptoms_description: passedDisease.description || "See solution for details",
                        causes: passedDisease.description || "Environmental or pathogen-based",
                        treatment_methods: passedDisease.solution || "Consult agricultural expert",
                        affected_plant_parts: passedDisease.host_plants || ["Various plants"],
                        image_url: passedDisease.image_url,
                    };

                    setDisease(transformedDisease);

                    // Get additional Gemini recommendations if name available
                    const diseaseName = passedDisease.disease_name || passedDisease.common_name;
                    if (diseaseName) {
                        try {
                            const recommendations = await getTreatmentRecommendations(diseaseName);
                            setGeminiRecommendations(recommendations);
                        } catch (err) {
                            console.log("Could not get Gemini recommendations:", err);
                        }
                    }
                }
                // If only name is provided, get info from Gemini
                else if (name) {
                    console.log("Getting disease info from Gemini for:", name);

                    // Create basic disease info and get recommendations
                    setDisease({
                        disease_name: name,
                        disease_type: "Plant Disease",
                        severity_level: confidence >= 0.8 ? "High" :
                                       confidence >= 0.5 ? "Medium" : "Low",
                        confidence: confidence,
                        image_url: imageUri,
                    });

                    try {
                        const recommendations = await getTreatmentRecommendations(name);
                        setGeminiRecommendations(recommendations);

                        // Update disease with Gemini data
                        if (recommendations) {
                            setDisease(prev => ({
                                ...prev,
                                symptoms_description: recommendations.immediate_actions?.join("\n• "),
                                treatment_methods: recommendations.treatment_options?.map(t =>
                                    `${t.name}: ${t.description}`
                                ).join("\n• "),
                                causes: recommendations.additional_notes,
                                prevention: recommendations.prevention_measures,
                            }));
                        }
                    } catch (err) {
                        console.log("Could not get Gemini recommendations:", err);
                    }
                }
            } catch (error) {
                console.error("Error loading disease data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDiseaseData();
    }, [diseaseId, name, fromScan]);

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case "high":
                return "#FF3B30";
            case "medium":
                return "#FF9500";
            case "low":
                return "#34C759";
            default:
                return "#8E8E93";
        }
    };

    const renderTabButton = (tab, label) => (
        <TouchableOpacity
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
        >
            <Text
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );




    const renderCardWithIcon = (iconName, title, value) => {
        if (!value) return null;
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name={iconName} size={20} color="#4A7C59" />
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
                <Text style={styles.cardValue}>{value}</Text>
            </View>
        );
    };


    const renderOverviewTab = () => (
        <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            {/* Confidence Badge */}
            {disease?.confidence && (
                <View style={[styles.confidenceBadge, {
                    backgroundColor: disease.confidence >= 0.8 ? "#34C759" :
                                    disease.confidence >= 0.5 ? "#FF9500" : "#FF3B30"
                }]}>
                    <Ionicons name="analytics" size={16} color="#fff" />
                    <Text style={styles.confidenceText}>
                        AI Confidence: {(disease.confidence * 100).toFixed(1)}%
                    </Text>
                </View>
            )}

            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Disease Information</Text>
                {renderCardWithIcon("leaf", "Type", disease?.disease_type)}
                {renderCardWithIcon("biohazard", "Pathogen", disease?.pathogen_type)}
                {renderCardWithIcon("alert-circle", "Severity", disease?.severity_level)}
                {renderCardWithIcon(
                    "sprout",
                    "Affected Parts",
                    Array.isArray(disease?.affected_plant_parts)
                        ? disease.affected_plant_parts.join(", ")
                        : disease?.affected_plant_parts
                )}
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Causes</Text>
                {renderCardWithIcon("flask", "Causes", disease?.causes || "Not available")}
            </View>
        </Animated.View>
    );

    const renderSymptomsTab = () => (
        <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Symptoms</Text>
                {renderCardWithIcon("stethoscope", "Symptoms", disease?.symptoms_description || "Not available")}
            </View>
        </Animated.View>
    );

    const renderTreatmentTab = () => (
        <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Treatment Methods</Text>
                {renderCardWithIcon(
                    "bandage",
                    "Treatment Methods",
                    disease?.treatment_methods || "Not available"
                )}
            </View>

            {/* Prevention Section */}
            {(disease?.prevention?.length > 0 || geminiRecommendations?.prevention_measures?.length > 0) && (
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Prevention</Text>
                    {renderCardWithIcon(
                        "shield-check",
                        "Prevention Measures",
                        (disease?.prevention || geminiRecommendations?.prevention_measures)?.join("\n• ") || "Not available"
                    )}
                </View>
            )}

            {/* Additional Gemini Recommendations */}
            {geminiRecommendations && (
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>AI Recommendations</Text>
                    {geminiRecommendations.recovery_time && renderCardWithIcon(
                        "clock-outline",
                        "Expected Recovery",
                        geminiRecommendations.recovery_time
                    )}
                    {geminiRecommendations.when_to_seek_expert && renderCardWithIcon(
                        "account-alert",
                        "When to Seek Expert Help",
                        geminiRecommendations.when_to_seek_expert
                    )}
                </View>
            )}
        </Animated.View>
    );

    // Show loading state
    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#4A7C59" />
                <Text style={{ marginTop: 16, color: "#666" }}>Loading disease information...</Text>
            </View>
        );
    }

    // Show error state if no disease data
    if (!disease) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="alert-circle-outline" size={64} color="#FF9500" />
                <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "600" }}>Disease Not Found</Text>
                <Text style={{ marginTop: 8, color: "#666", textAlign: "center", paddingHorizontal: 32 }}>
                    Could not load disease information. Please try again.
                </Text>
                <TouchableOpacity
                    style={{ marginTop: 24, backgroundColor: "#4A7C59", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }



    return (
        <View style={styles.container}>
            {/* Background Image */}
            <Image
                source={require("../../assets/1.jpg")}
                style={styles.bgImage}
                resizeMode="cover"
            />
            <View style={styles.overlay} />

            {/* Transparent StatusBar */}
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="dark-content"
            />

            {/* Main Content */}
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    {/* <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                    </TouchableOpacity> */}

                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {disease?.disease_name}
                    </Text>

                    <View style={{ width: 32 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Hero Section */}
                    <Animated.View
                        entering={SlideInUp.duration(600)}
                        style={styles.imageContainer}
                    >
                        <Image
                            source={
                                disease?.image_url
                                    ? { uri: disease.image_url }
                                    : require("../../assets/placeholder-plant.png")
                            }
                            style={styles.diseaseImage}
                            resizeMode="cover"
                        />
                        <View style={styles.imageOverlay}>
                            <Text style={styles.diseaseName}>{disease?.disease_name}</Text>
                            <Text style={styles.diseaseType}>{disease?.disease_type}</Text>
                        </View>
                    </Animated.View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        {renderTabButton("overview", "Overview")}
                        {renderTabButton("symptoms", "Symptoms")}
                        {renderTabButton("treatment", "Treatment")}
                    </View>

                    {/* Tab Content */}
                    {activeTab === "overview" && renderOverviewTab()}
                    {activeTab === "symptoms" && renderSymptomsTab()}
                    {activeTab === "treatment" && renderTreatmentTab()}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    bgImage: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: "100%",
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.96)",
    },

    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop:
            Platform.OS === "android" ? (StatusBar.currentHeight || 10) + 8 : 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
        backgroundColor: "transparent",
    },
    backButton: {
        padding: 8,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1C1C1E",
        marginLeft: 8,
    },
    cardValue: {
        fontSize: 16,
        color: "#6B7C6B",
        lineHeight: 20,
        flexShrink: 1,
    },


    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "green",
        flex: 1,
        textAlign: "center",
        marginHorizontal: 16,
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        position: "relative",
        height: height * 0.3,
        backgroundColor: "#FFFFFF",
    },
    diseaseImage: {
        width: "100%",
        height: "100%",
    },
    imageOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#A8C8A8",
        padding: 20,
    },
    diseaseName: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 4,
    },
    diseaseType: {
        fontSize: 16,
        color: "#E5E5EA",
        fontStyle: "italic",
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        marginTop: 1,
        paddingHorizontal: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    activeTabButton: {
        borderBottomColor: "#4A7C59",
    },
    tabText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#8E8E93",
    },
    activeTabText: {
        color: "#4A7C59",
        fontWeight: "600",
    },
    tabContent: {
        padding: 16,
    },
    infoSection: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1C1C1E",
        marginBottom: 12,
    },
    infoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    infoItem: {
        width: "48%",
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: "#8E8E93",
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1C1C1E",
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: "#1C1C1E",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    confidenceBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
        gap: 6,
    },
    confidenceText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
});

export default DiseaseDetailScreen;
