import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    ImageBackground,
    Platform,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { useFavorites } from '../context/FavoritesContext';
import localAuth from '../services/localAuth';
import localDatabase from '../services/localDatabase';
import apiService from '../services/apiService';
import SearchBar from '../components/SearchBar';
import FilterModal from '../components/FilterModal';
import SortModal from '../components/SortModal';
import NotificationToast from '../components/NotificationToast';
import PlantCard from '../components/PlantCard';
import FloatingChatButton from '../components/FloatingChatButton';
import ChatBotScreen from '../components/ChatBotScreen.js';
import { responsiveDimensions, responsiveFonts } from '../utils/responsive';

const { width } = Dimensions.get('window');

// Storage keys
const STORAGE_KEYS = {
    CACHED_PLANTS: 'cached_plants',
    CACHED_USER_LOCATION: 'cached_user_location',
    LAST_REFRESH: 'last_refresh'
};

// Configuration
const CACHE_EXPIRY_HOURS = 24;
const isLargeWeb = Platform.OS === 'web' && width > 1024;
const CATEGORIES = ["All", "Vegetables", "Fruits", "Herbs", "Flowers"];

// Cache Management Functions
const cacheManager = {
    save: async (key, data) => {
        try {
            const cacheData = {
                data,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(key, JSON.stringify(cacheData));
            console.log(`Data cached successfully for key: ${key}`);
        } catch (error) {
            console.error(`Error saving cache for ${key}:`, error);
        }
    },

    load: async (key, expiryHours = CACHE_EXPIRY_HOURS) => {
        try {
            const cachedData = await AsyncStorage.getItem(key);
            if (cachedData) {
                const { data, timestamp } = JSON.parse(cachedData);
                const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60);

                if (hoursSinceCache < expiryHours) {
                    console.log(`Loading fresh cache for ${key} (${hoursSinceCache.toFixed(1)} hours old)`);
                    return data;
                } else {
                    console.log(`Cache expired for ${key} (${hoursSinceCache.toFixed(1)} hours old)`);
                    await AsyncStorage.removeItem(key);
                }
            }
            return null;
        } catch (error) {
            console.error(`Error loading cache for ${key}:`, error);
            return null;
        }
    },

    loadStale: async (key) => {
        try {
            const cachedData = await AsyncStorage.getItem(key);
            if (cachedData) {
                const { data } = JSON.parse(cachedData);
                return data;
            }
            return null;
        } catch (error) {
            console.error(`Error loading stale cache for ${key}:`, error);
            return null;
        }
    },

    clear: async (key) => {
        try {
            await AsyncStorage.removeItem(key);
            console.log(`Cache cleared for ${key}`);
        } catch (error) {
            console.error(`Error clearing cache for ${key}:`, error);
        }
    }
};

const HomeScreen = ({ navigation }) => {
    // State Management
    const [plants, setPlants] = useState([]);
    const [filteredPlants, setFilteredPlants] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sortVisible, setSortVisible] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({});
    const [notification, setNotification] = useState(null);
    const [chatBotVisible, setChatBotVisible] = useState(false);

    // Enhanced state
    const [showFavorites, setShowFavorites] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [userLocation, setUserLocation] = useState(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    const { isFavorite, toggleFavorite } = useFavorites();

    // Initialize data on component mount
    useEffect(() => {
        initializeData();
    }, []);

    // Apply filters when dependencies change
    useEffect(() => {
        applyFilters();
    }, [plants, searchQuery, showFavorites, selectedCategory, appliedFilters]);

    const initializeData = async () => {
        console.log('Initializing HomeScreen data...');
        setLoading(true);

        try {
            // Load cached data first for immediate display
            const cachedPlants = await cacheManager.load(STORAGE_KEYS.CACHED_PLANTS);
            const cachedLocation = await cacheManager.load(STORAGE_KEYS.CACHED_USER_LOCATION, 72); // 3 days

            if (cachedPlants) {
                console.log(`Loaded ${cachedPlants.length} plants from cache`);
                setPlants(cachedPlants);
                setFilteredPlants(cachedPlants);
            }

            if (cachedLocation) {
                setUserLocation(cachedLocation);
            }

            // Fetch fresh data in background
            await Promise.all([
                fetchPlantsData(!!cachedPlants),
                updateUserLocation(!!cachedLocation)
            ]);

        } catch (error) {
            console.error('Error initializing data:', error);
            await handleDataLoadError();
        } finally {
            setLoading(false);
        }
    };

    const fetchPlantsData = async (hasCache = false) => {
        try {
            console.log('Fetching plants from API...');
            const data = await apiService.getPlants();

            if (data && data.length > 0) {
                console.log(`Fetched ${data.length} plants from API`);
                setPlants(data);
                setFilteredPlants(data);
                setIsOfflineMode(false);

                // Cache the fresh data
                await cacheManager.save(STORAGE_KEYS.CACHED_PLANTS, data);
                await AsyncStorage.setItem(STORAGE_KEYS.LAST_REFRESH, Date.now().toString());

                if (!hasCache) {
                    showNotification('success', 'Plants Loaded', 'Fresh plant data loaded successfully');
                }
            } else {
                throw new Error('No plant data received');
            }
        } catch (error) {
            console.error('Failed to fetch plants from API:', error);
            await handlePlantsLoadError(hasCache);
        }
    };

    const updateUserLocation = async (hasCache = false) => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 15000,
            });

            const locationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: new Date().toISOString(),
            };

            console.log('Location updated:', locationData);
            setUserLocation(locationData);

            // Cache location
            await cacheManager.save(STORAGE_KEYS.CACHED_USER_LOCATION, locationData);

            // Update local database if user is authenticated
            const user = localAuth.getCurrentUser();
            if (user) {
                try {
                    await localDatabase.updateUserData({
                        currentLocation: locationData,
                        lastLocationUpdate: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    console.log('User location updated in local database');
                } catch (dbError) {
                    console.error('Error updating user location:', dbError);
                }
            }
        } catch (error) {
            console.error('Location update error:', error);
            if (!hasCache) {
                showNotification('warning', 'Location', 'Could not get current location');
            }
        }
    };

    const handlePlantsLoadError = async (hasCache) => {
        console.log('Handling plants load error, hasCache:', hasCache);

        if (!hasCache) {
            // Try to load stale cache as fallback
            const staleCache = await cacheManager.loadStale(STORAGE_KEYS.CACHED_PLANTS);
            if (staleCache && staleCache.length > 0) {
                console.log(`Loading ${staleCache.length} plants from stale cache`);
                setPlants(staleCache);
                setFilteredPlants(staleCache);
                setIsOfflineMode(true);
                showNotification('warning', 'Offline Mode', 'Showing cached data. Pull to refresh when online.');
            } else {
                showNotification('error', 'Connection Error', 'Could not load plants. Please check your internet connection.');
            }
        } else {
            setIsOfflineMode(true);
            showNotification('warning', 'Update Failed', 'Using cached data. Pull to refresh to try again.');
        }
    };

    const handleDataLoadError = async () => {
        const staleCache = await cacheManager.loadStale(STORAGE_KEYS.CACHED_PLANTS);
        if (staleCache && staleCache.length > 0) {
            setPlants(staleCache);
            setFilteredPlants(staleCache);
            setIsOfflineMode(true);
            showNotification('warning', 'Offline Mode', 'Showing cached data only.');
        } else {
            showNotification('error', 'No Data', 'No plant data available. Please check your connection and try again.');
        }
    };

    const handleRefresh = async () => {
        console.log('Manual refresh triggered');
        setRefreshing(true);

        try {
            await Promise.all([
                fetchPlantsData(true),
                updateUserLocation(true)
            ]);

            showNotification('success', 'Refreshed', 'Data updated successfully!');
        } catch (error) {
            console.error('Refresh error:', error);
            showNotification('error', 'Refresh Failed', 'Could not refresh data. Please try again.');
        } finally {
            setRefreshing(false);
        }
    };

    const applyFilters = () => {
        let data = [...plants];

        // Apply favorites filter
        if (showFavorites) {
            data = data.filter((p) => isFavorite(p.plant_id || p.id));
        }

        // Apply category filter
        if (selectedCategory !== "All") {
            data = data.filter((p) =>
                (p.plant_type || "").toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter((p) =>
                (p.common_name || "").toLowerCase().includes(query) ||
                (p.scientific_name || "").toLowerCase().includes(query) ||
                (p.plant_type || "").toLowerCase().includes(query)
            );
        }

        // Apply additional filters from modal
        if (appliedFilters.difficulty) {
            data = data.filter((p) =>
                (p.difficulty || "").toLowerCase() === appliedFilters.difficulty.toLowerCase()
            );
        }

        if (appliedFilters.sunlight) {
            data = data.filter((p) =>
                (p.sunlight || "").toLowerCase().includes(appliedFilters.sunlight.toLowerCase())
            );
        }

        console.log(`Filtered ${data.length} plants from ${plants.length} total`);
        setFilteredPlants(data);
    };

    const handlePlantPress = (plant) => {
        navigation.navigate('PlantDetail', { plant });
    };

    const showNotification = (type, title, message) => {
        setNotification({ type, title, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const clearCache = async () => {
        Alert.alert(
            'Clear Cache',
            'This will remove all cached data and require fresh downloads. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        await Promise.all([
                            cacheManager.clear(STORAGE_KEYS.CACHED_PLANTS),
                            cacheManager.clear(STORAGE_KEYS.CACHED_USER_LOCATION),
                            cacheManager.clear(STORAGE_KEYS.LAST_REFRESH)
                        ]);
                        showNotification('success', 'Cache Cleared', 'All cached data has been removed');
                        initializeData();
                    }
                }
            ]
        );
    };

    const renderPlantCard = ({ item, index }) => (
        <Animated.View
            entering={FadeIn.delay(index * 50).duration(300)}
            style={{ margin: 6, width: responsiveDimensions.getCardWidth() }}
        >
            <PlantCard
                plant={item}
                isFavorite={isFavorite(item.plant_id || item.id)}
                onToggleFavorite={() => toggleFavorite(item.plant_id || item.id)}
                onPress={() => handlePlantPress(item)}
            />
        </Animated.View>
    );

    const renderHeader = () => (
        <View style={[styles.headerSection, isLargeWeb && styles.headerSectionWeb]}>
            {/* Main Header */}
            <View style={[styles.header, isLargeWeb && styles.headerWeb]}>
                <View style={styles.headerLeft}>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.headerTitle, { fontSize: responsiveFonts.large(isLargeWeb ? 20 : 24) }]}>

                        </Text>
                        {isOfflineMode && (
                            <View style={styles.offlineBadge}>
                                <Ionicons name="cloud-offline" size={12} color="#FF6B6B" />
                                <Text style={styles.offlineText}>Offline</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, showFavorites && styles.actionButtonActive]}
                        onPress={() => setShowFavorites(!showFavorites)}
                    >
                        <Ionicons
                            name={showFavorites ? "heart" : "heart-outline"}
                            size={isLargeWeb ? 18 : 20}
                            color="#fff"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setSortVisible(true)}
                    >
                        <Ionicons name="swap-vertical" size={isLargeWeb ? 18 : 20} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setFilterVisible(true)}
                    >
                        <Ionicons name="options" size={isLargeWeb ? 18 : 20} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={clearCache}
                        onLongPress={clearCache}
                    >
                        <Ionicons name="refresh" size={isLargeWeb ? 18 : 20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>



            {/* Search Bar */}
            <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search plants..."
            />

            {/* Categories */}
            {!showFavorites && (
                <View style={styles.categories}>
                    <FlatList
                        data={CATEGORIES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.categoryButton,
                                    selectedCategory === item && styles.categoryButtonActive,
                                    isLargeWeb && { paddingVertical: 6, paddingHorizontal: 12 }
                                ]}
                                onPress={() => setSelectedCategory(item)}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        selectedCategory === item && styles.categoryTextActive,
                                        isLargeWeb && { fontSize: 12 }
                                    ]}
                                >
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.categoriesList}
                    />
                </View>
            )}

            {/* Results Summary */}
            <View style={styles.resultsContainer}>
                <Text style={styles.resultsText}>
                    {showFavorites ? 'Favorites' : 'All Plants'}: {filteredPlants.length}
                    {selectedCategory !== 'All' && ` ${selectedCategory}`} found
                </Text>
                {isOfflineMode && (
                    <Text style={styles.offlineInfo}>
                        Cached data • Pull to refresh
                    </Text>
                )}
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons
                name={showFavorites ? "heart-outline" : "leaf-outline"}
                size={64}
                color="#ccc"
            />
            <Text style={styles.emptyTitle}>
                {showFavorites ? 'No Favorites Yet' : 'No Plants Found'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {showFavorites
                    ? 'Tap the heart icon on plants to add them to favorites'
                    : searchQuery
                        ? 'Try adjusting your search terms'
                        : 'Pull down to refresh or check your connection'
                }
            </Text>
        </View>
    );

    return (
        <ImageBackground
            source={require('../../assets/1.jpg')}
            style={styles.bgImage}
            resizeMode="cover"
        >
            <View style={styles.overlay} />

            <SafeAreaView style={styles.container}>
                <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                <FlatList
                    data={filteredPlants}
                    renderItem={renderPlantCard}
                    keyExtractor={(item, index) => `plant-${item.plant_id ?? item.id ?? index}`}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={!loading ? renderEmptyState : null}
                    contentContainerStyle={{
                        paddingHorizontal: responsiveDimensions.getContainerPadding(),
                        paddingBottom: 100,
                        flexGrow: 1
                    }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#4A7C59']}
                            tintColor="#4A7C59"
                        />
                    }
                    numColumns={responsiveDimensions.getGridColumns()}
                    columnWrapperStyle={
                        responsiveDimensions.getGridColumns() > 1
                            ? { justifyContent: 'space-between', marginBottom: 12 }
                            : null
                    }
                />

                {/* Floating Chat Button */}
                <FloatingChatButton
                    onPress={() => setChatBotVisible(true)}
                    visible={!chatBotVisible}
                />

                {/* ChatBot Screen */}
                <ChatBotScreen
                    visible={chatBotVisible}
                    onClose={() => setChatBotVisible(false)}
                    navigation={navigation}
                />

                {/* Modals */}
                <SortModal
                    visible={sortVisible}
                    onClose={() => setSortVisible(false)}
                    onApply={(sortOption) => {
                        // Apply sorting logic here
                        console.log('Sort applied:', sortOption);
                        setSortVisible(false);
                    }}
                />

                <FilterModal
                    visible={filterVisible}
                    filters={appliedFilters}
                    onApply={(filters) => {
                        setAppliedFilters(filters);
                        setFilterVisible(false);
                    }}
                    onClose={() => setFilterVisible(false)}
                />

                {/* Notification Toast */}
                <NotificationToast
                    visible={!!notification}
                    type={notification?.type}
                    title={notification?.title}
                    message={notification?.message}
                    onDismiss={() => setNotification(null)}
                />
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    bgImage: {
        flex: 1
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },

    headerSection: {
        marginBottom: 20,
    },
    headerSectionWeb: {
        marginBottom: 10,
    },

    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerWeb: {
        paddingHorizontal: 40,
        paddingBottom: 12,
    },

    headerLeft: {
        flex: 1,
    },

    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#4A7C59',
        marginRight: 12,
    },

    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },

    offlineText: {
        fontSize: 10,
        color: '#FF6B6B',
        fontWeight: '600',
        marginLeft: 4,
    },

    weatherWidget: {
        alignSelf: 'flex-start',
        marginBottom: 14,
    },
    weatherWidgetWeb: {
        transform: [{ scale: 0.9 }],
    },

    headerActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },

    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(74, 124, 89, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actionButtonActive: {
        backgroundColor: 'rgba(246, 25, 25, 0.8)',
    },

    categories: {
        marginBottom: 20,
    },
    categoriesList: {
        gap: 8,
        paddingHorizontal: 20,
    },
    categoryButton: {
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    categoryButtonActive: {
        backgroundColor: '#4A7C59',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: '600',
    },

    resultsContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    resultsText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    offlineInfo: {
        fontSize: 12,
        color: '#FF6B6B',
        marginTop: 2,
        fontStyle: 'italic',
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default HomeScreen;