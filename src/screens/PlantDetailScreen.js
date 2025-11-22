import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    ImageBackground,
    Platform,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    FadeIn,
    SlideInUp,
} from 'react-native-reanimated';
import { useFavorites } from '../context/FavoritesContext';

const { width, height } = Dimensions.get('window');

const PlantDetailScreen = ({ route, navigation }) => {
    const { plant } = route.params;
    const { toggleFavorite, isFavorite } = useFavorites();
    const [activeTab, setActiveTab] = useState('overview');

    const heartScale = useSharedValue(1);
    const isLiked = isFavorite(plant.plant_id || plant.id);

    const heartAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }],
    }));

    const handleFavoritePress = () => {
        heartScale.value = withSpring(1.3, { damping: 10, stiffness: 300 }, () => {
            heartScale.value = withSpring(1, { damping: 10, stiffness: 300 });
        });
        toggleFavorite(plant.plant_id || plant.id);
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high': return '#FF3B30';
            case 'medium': return '#FF9500';
            case 'low': return '#34C759';
            default: return '#8E8E93';
        }
    };

    const renderTabButton = (tab, label) => (
        <TouchableOpacity
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
        >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderOverviewTab = () => (
        <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Plant Information</Text>
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Scientific Name</Text>
                        <Text style={styles.infoValue}>{plant.scientific_name}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Family</Text>
                        <Text style={styles.infoValue}>{plant.family}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Type</Text>
                        <Text style={styles.infoValue}>{plant.plant_type}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Genus</Text>
                        <Text style={styles.infoValue}>{plant.genus}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{plant.description}</Text>
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Growth Conditions</Text>
                <Text style={styles.growthText}>{plant.growth_conditions}</Text>
            </View>
        </Animated.View>
    );

    const renderClimateTab = () => (
        <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            {plant.climate_requirements && (
                <View style={styles.climateGrid}>
                    <View style={styles.climateCard}>
                        <View style={[styles.climateIcon, { backgroundColor: '#FFF4E6' }]}>
                            <Ionicons name="sunny" size={24} color="#FF9500" />
                        </View>
                        <Text style={styles.climateTitle}>Sunlight</Text>
                        <Text style={styles.climateValue}>
                            {plant.climate_requirements.water || 'Regular watering'}
                        </Text>
                    </View>

                    <View style={styles.climateCard}>
                        <View style={[styles.climateIcon, { backgroundColor: '#FFF0F0' }]}>
                            <Ionicons name="cloud" size={24} color="#8E8E93" />
                        </View>
                        <Text style={styles.climateTitle}>Humidity</Text>
                        <Text style={styles.climateValue}>
                            {plant.climate_requirements.humidity || '50-70%'}
                        </Text>
                    </View>

                    <View style={[styles.climateCard, styles.wideCard]}>
                        <View style={[styles.climateIcon, { backgroundColor: '#F0E6FF' }]}>
                            <Ionicons name="earth" size={24} color="#8B5A2B" />
                        </View>
                        <Text style={styles.climateTitle}>Soil Requirements</Text>
                        <Text style={styles.climateValue}>
                            {plant.climate_requirements.soil || 'Well-draining, fertile soil'}
                        </Text>
                    </View>
                </View>
            )}
        </Animated.View>
    );

    const renderDiseasesTab = () => (
        <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            {plant.affecting_diseases && plant.affecting_diseases.length > 0 ? (
                <View>
                    <Text style={styles.sectionTitle}>Common Diseases</Text>
                    {plant.affecting_diseases.map((disease, index) => (
                        <View key={index} style={styles.diseaseCard}>
                            <View style={styles.diseaseHeader}>
                                <View style={[
                                    styles.severityIndicator,
                                    { backgroundColor: getSeverityColor(disease.severity_level) }
                                ]} />
                                <Text style={styles.diseaseName}>{disease.disease_name}</Text>
                                <Text style={[
                                    styles.severityText,
                                    { color: getSeverityColor(disease.severity_level) }
                                ]}>
                                    {disease.severity_level}
                                </Text>
                            </View>
                            {disease.symptoms_description && (
                                <Text style={styles.diseaseSymptoms}>
                                    {disease.symptoms_description}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.noDiseases}>
                    <Ionicons name="shield-checkmark" size={48} color="#34C759" />
                    <Text style={styles.noDiseasesTitle}>No Common Diseases</Text>
                    <Text style={styles.noDiseasesText}>
                        This plant is generally resistant to diseases when properly cared for.
                    </Text>
                </View>
            )}
        </Animated.View>
    );

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
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Main Content */}
            <SafeAreaView style={styles.safeArea}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        {/* <Ionicons name="arrow-back" size={24} color="#1C1C1E" /> */}
                    </TouchableOpacity>

                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {plant.common_name || plant.name}
                    </Text>

                    <TouchableOpacity style={styles.favoriteHeaderButton} onPress={handleFavoritePress}>
                        <Animated.View style={heartAnimatedStyle}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={24}
                                color={isLiked ? "#FF3B30" : "#8E8E93"}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Scrollable Content */}
                    <Animated.View entering={SlideInUp.duration(600)} style={styles.imageContainer}>
                        <Image
                            source={plant.image_url ? { uri: plant.image_url } : plant.image}
                            style={styles.plantImage}
                            resizeMode="cover"
                        />
                        <View style={styles.imageOverlay}>
                            <Text style={styles.plantName}>{plant.common_name || plant.name}</Text>
                            <Text style={styles.scientificName}>{plant.scientific_name}</Text>
                        </View>
                    </Animated.View>
                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        {renderTabButton("overview", "Overview")}
                        {renderTabButton("climate", "Climate")}
                        {renderTabButton("diseases", "Diseases")}
                    </View>

                    {/* Tab Content */}
                    {activeTab === "overview" && renderOverviewTab()}
                    {activeTab === "climate" && renderClimateTab()}
                    {activeTab === "diseases" && renderDiseasesTab()}
                </ScrollView>
            </SafeAreaView>
        </View>
    );

};

const styles = StyleSheet.create({
    bgImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.96)', // light overlay so UI pops
    },

    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 10) + 8 : 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
        backgroundColor: "transparent", // keep image visible
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'green',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    favoriteHeaderButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        position: 'relative',
        height: height * 0.3,
        backgroundColor: '#FFFFFF',
    },
    plantImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#A8C8A8',
        padding: 20,
    },
    plantName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    scientificName: {
        fontSize: 16,
        color: '#E5E5EA',
        fontStyle: 'italic',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginTop: 1,
        paddingHorizontal: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#4A7C59',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#8E8E93',
    },
    activeTabText: {
        color: '#4A7C59',
        fontWeight: '600',
    },
    tabContent: {
        padding: 16,
    },
    infoSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 12,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    infoItem: {
        width: '48%',
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#1C1C1E',
    },
    growthText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#1C1C1E',
    },
    climateGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    climateCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    wideCard: {
        width: '100%',
    },
    climateIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    climateTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 4,
        textAlign: 'center',
    },
    climateValue: {
        fontSize: 12,
        color: '#6B7C6B',
        textAlign: 'center',
        lineHeight: 16,
    },
    diseaseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    diseaseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    severityIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    diseaseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        flex: 1,
    },
    severityText: {
        fontSize: 12,
        fontWeight: '600',
    },
    diseaseSymptoms: {
        fontSize: 14,
        color: '#6B7C6B',
        lineHeight: 20,
        marginLeft: 20,
    },
    noDiseases: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    noDiseasesTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#34C759',
        marginTop: 16,
        marginBottom: 8,
    },
    noDiseasesText: {
        fontSize: 14,
        color: '#6B7C6B',
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
    },
});
export default PlantDetailScreen;
