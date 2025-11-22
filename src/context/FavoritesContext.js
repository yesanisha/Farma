// contexts/FavoritesContext.js - Local storage only (Firebase removed)

import React, { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '../services/storage';
import localAuth from '../services/localAuth';

const FavoritesContext = createContext();

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};

export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState({});
    const [isFirstTime, setIsFirstTime] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [syncError, setSyncError] = useState(null);

    useEffect(() => {
        loadFavorites();
        checkFirstTime();

        // Listen for auth state changes
        const checkAuth = async () => {
            const user = localAuth.getCurrentUser();
            if (user) {
                await loadFavorites();
            }
        };

        checkAuth();
    }, []);

    // Load favorites from local storage
    const loadFavorites = async () => {
        try {
            console.log('Loading favorites from local storage...');
            const storedFavorites = await StorageService.getItem('plant_favorites');
            if (storedFavorites) {
                const parsedFavorites = JSON.parse(storedFavorites);
                setFavorites(parsedFavorites || {});
                console.log('Loaded local favorites:', Object.keys(parsedFavorites || {}).length);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    };

    const checkFirstTime = async () => {
        try {
            const hasLaunched = await StorageService.getItem('has_launched');
            if (hasLaunched) {
                setIsFirstTime(false);
            }
        } catch (error) {
            console.error('Error checking first time:', error);
        }
    };

    const markAsLaunched = async () => {
        try {
            await StorageService.setItem('has_launched', 'true');
            setIsFirstTime(false);
            console.log('Marked as launched');
        } catch (error) {
            console.error('Error marking as launched:', error);
        }
    };

    // Save favorites locally
    const saveFavorites = async (updatedFavoritesData) => {
        try {
            setIsLoading(true);
            await StorageService.setItem('plant_favorites', JSON.stringify(updatedFavoritesData));
            setFavorites(updatedFavoritesData);
            console.log('Saved favorites locally:', Object.keys(updatedFavoritesData).length);
            setSyncError(null);
        } catch (error) {
            console.error('Error saving favorites:', error);
            setSyncError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle favorite with complete plant data
    const toggleFavorite = async (plantData) => {
        if (!plantData || !plantData.plant_id) {
            console.warn('Invalid plant data provided to toggleFavorite');
            return;
        }

        try {
            setIsLoading(true);
            const plantId = plantData.plant_id;
            const isCurrentlyFavorite = favorites.hasOwnProperty(plantId);

            let updatedFavorites;
            if (isCurrentlyFavorite) {
                // Remove from favorites
                updatedFavorites = { ...favorites };
                delete updatedFavorites[plantId];
                console.log(`Removing plant ${plantId} from favorites`);
            } else {
                // Add to favorites with timestamp
                const favoriteData = {
                    ...plantData,
                    added_to_favorites_at: new Date().toISOString(),
                };
                updatedFavorites = {
                    ...favorites,
                    [plantId]: favoriteData
                };
                console.log(`Adding plant ${plantId} to favorites`);
            }

            // Update local storage and state
            await StorageService.setItem('plant_favorites', JSON.stringify(updatedFavorites));
            setFavorites(updatedFavorites);
            setSyncError(null);

        } catch (error) {
            console.error('Error toggling favorite:', error);
            setSyncError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Add plant to favorites
    const addToFavorites = async (plantData) => {
        if (!plantData || !plantData.plant_id) {
            console.warn('Invalid plant data provided to addToFavorites');
            return;
        }

        const plantId = plantData.plant_id;
        if (favorites.hasOwnProperty(plantId)) {
            console.log('Plant already in favorites');
            return;
        }

        const favoriteData = {
            ...plantData,
            added_to_favorites_at: new Date().toISOString(),
        };

        const updatedFavorites = {
            ...favorites,
            [plantId]: favoriteData
        };

        await saveFavorites(updatedFavorites);
    };

    // Remove plant from favorites
    const removeFromFavorites = async (plantId) => {
        if (!plantId || !favorites.hasOwnProperty(plantId)) {
            console.warn('Plant not in favorites or invalid ID');
            return;
        }

        const updatedFavorites = { ...favorites };
        delete updatedFavorites[plantId];

        await saveFavorites(updatedFavorites);
    };

    // Clear all favorites
    const clearAllFavorites = async () => {
        try {
            setIsLoading(true);
            await saveFavorites({});
            console.log('Cleared all favorites');
        } catch (error) {
            console.error('Error clearing favorites:', error);
            setSyncError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const isFavorite = (plantId) => {
        return favorites.hasOwnProperty(plantId);
    };

    // Get favorite plant data by ID
    const getFavoriteData = (plantId) => {
        return favorites[plantId] || null;
    };

    // Get all favorite plants as array
    const getFavoritesList = () => {
        return Object.values(favorites);
    };

    // Get all favorite plant IDs as array
    const getFavoriteIds = () => {
        return Object.keys(favorites);
    };

    // Force sync (reload from local storage)
    const forceSyncFavorites = async () => {
        try {
            setIsLoading(true);
            setSyncError(null);
            await loadFavorites();
        } catch (error) {
            setSyncError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FavoritesContext.Provider
            value={{
                // State
                favorites,
                isFirstTime,
                isLoading,
                syncError,

                // Core operations
                toggleFavorite,
                addToFavorites,
                removeFromFavorites,
                isFavorite,

                // Data retrieval
                getFavoriteData,
                getFavoritesList,
                getFavoriteIds,

                // Management operations
                clearAllFavorites,

                // App lifecycle
                markAsLaunched,

                // Sync operations
                forceSyncFavorites,
                syncFavoritesFromFirestore: loadFavorites, // Compatibility alias
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
};
