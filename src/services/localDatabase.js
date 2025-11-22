// services/localDatabase.js - Local Database Service (Replaces Firestore)
import StorageService from "./storage";
import localAuth from "./localAuth";

// Storage keys
const USER_DATA_KEY = 'user_data_';
const SCAN_HISTORY_KEY = 'scan_history_';
const FAVORITES_KEY = 'favorites_';
const UPLOADS_KEY = 'uploads_';

// Get user-specific key
const getUserKey = (baseKey) => {
    const user = localAuth.getCurrentUser();
    if (!user) return null;
    return `${baseKey}${user.uid}`;
};

// ========================================
// USER DATA OPERATIONS
// ========================================

export const getUserData = async (userId = null) => {
    try {
        const uid = userId || localAuth.getCurrentUser()?.uid;
        if (!uid) return null;

        const data = await StorageService.getItem(`${USER_DATA_KEY}${uid}`);
        return data || {
            email: localAuth.getCurrentUser()?.email,
            displayName: localAuth.getCurrentUser()?.displayName,
            setup: false,
            role: 'user',
            favorite_plants: {},
            detected_diseases: [],
            total_scans: 0,
            createdAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

export const setUserData = async (data, userId = null) => {
    try {
        const uid = userId || localAuth.getCurrentUser()?.uid;
        if (!uid) throw new Error('No user ID');

        const existingData = await getUserData(uid);
        const mergedData = {
            ...existingData,
            ...data,
            updatedAt: new Date().toISOString(),
        };

        await StorageService.setItem(`${USER_DATA_KEY}${uid}`, mergedData);
        return mergedData;
    } catch (error) {
        console.error('Error setting user data:', error);
        throw error;
    }
};

export const updateUserData = async (updates) => {
    return setUserData(updates);
};

// ========================================
// FAVORITES OPERATIONS
// ========================================

export const getFavorites = async () => {
    try {
        const key = getUserKey(FAVORITES_KEY);
        if (!key) return {};

        const favorites = await StorageService.getItem(key);
        return favorites || {};
    } catch (error) {
        console.error('Error getting favorites:', error);
        return {};
    }
};

export const setFavorites = async (favorites) => {
    try {
        const key = getUserKey(FAVORITES_KEY);
        if (!key) throw new Error('No user');

        await StorageService.setItem(key, favorites);

        // Also update user data
        await updateUserData({
            favorite_plants: favorites,
            favorites_updated_at: new Date().toISOString(),
        });

        return favorites;
    } catch (error) {
        console.error('Error setting favorites:', error);
        throw error;
    }
};

export const addFavorite = async (plantId, plantData) => {
    try {
        const favorites = await getFavorites();
        favorites[plantId] = {
            ...plantData,
            added_to_favorites_at: new Date().toISOString(),
        };
        return await setFavorites(favorites);
    } catch (error) {
        console.error('Error adding favorite:', error);
        throw error;
    }
};

export const removeFavorite = async (plantId) => {
    try {
        const favorites = await getFavorites();
        delete favorites[plantId];
        return await setFavorites(favorites);
    } catch (error) {
        console.error('Error removing favorite:', error);
        throw error;
    }
};

// ========================================
// SCAN HISTORY OPERATIONS
// ========================================

export const getScanHistory = async () => {
    try {
        const key = getUserKey(SCAN_HISTORY_KEY);
        if (!key) return [];

        const history = await StorageService.getItem(key);
        return history || [];
    } catch (error) {
        console.error('Error getting scan history:', error);
        return [];
    }
};

export const addScanResult = async (scanResult) => {
    try {
        const key = getUserKey(SCAN_HISTORY_KEY);
        if (!key) throw new Error('No user');

        const history = await getScanHistory();
        const newScan = {
            id: `scan_${Date.now()}`,
            ...scanResult,
            scannedAt: new Date().toISOString(),
        };

        history.unshift(newScan); // Add to beginning

        // Keep only last 100 scans
        if (history.length > 100) {
            history.pop();
        }

        await StorageService.setItem(key, history);

        // Update user data with detected diseases
        if (scanResult.diseases && scanResult.diseases.length > 0) {
            const userData = await getUserData();
            const detectedDiseases = userData.detected_diseases || [];

            scanResult.diseases.forEach(disease => {
                detectedDiseases.push({
                    disease_name: disease.name,
                    confidence: disease.confidence,
                    detected_at: new Date().toISOString(),
                });
            });

            await updateUserData({
                detected_diseases: detectedDiseases,
                total_scans: (userData.total_scans || 0) + 1,
                last_scan_at: new Date().toISOString(),
            });
        }

        return newScan;
    } catch (error) {
        console.error('Error adding scan result:', error);
        throw error;
    }
};

export const getDetectedDiseases = async () => {
    try {
        const userData = await getUserData();
        return userData?.detected_diseases || [];
    } catch (error) {
        console.error('Error getting detected diseases:', error);
        return [];
    }
};

// ========================================
// UPLOADS OPERATIONS (for compatibility)
// ========================================

export const createUpload = async (uploadData) => {
    try {
        const key = getUserKey(UPLOADS_KEY);
        if (!key) throw new Error('No user');

        const uploads = await StorageService.getItem(key) || [];
        const uploadId = `upload_${Date.now()}`;

        const newUpload = {
            id: uploadId,
            ...uploadData,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        uploads.unshift(newUpload);
        await StorageService.setItem(key, uploads);

        return uploadId;
    } catch (error) {
        console.error('Error creating upload:', error);
        throw error;
    }
};

export const updateUpload = async (uploadId, updates) => {
    try {
        const key = getUserKey(UPLOADS_KEY);
        if (!key) throw new Error('No user');

        const uploads = await StorageService.getItem(key) || [];
        const index = uploads.findIndex(u => u.id === uploadId);

        if (index !== -1) {
            uploads[index] = {
                ...uploads[index],
                ...updates,
                updatedAt: new Date().toISOString(),
            };
            await StorageService.setItem(key, uploads);
        }

        return uploads[index];
    } catch (error) {
        console.error('Error updating upload:', error);
        throw error;
    }
};

// ========================================
// LOCATION OPERATIONS
// ========================================

export const updateUserLocation = async (location, address = null) => {
    try {
        await updateUserData({
            location: location,
            locationAddress: address,
        });
        return true;
    } catch (error) {
        console.error('Error updating location:', error);
        return false;
    }
};

// ========================================
// USER SETUP OPERATIONS
// ========================================

export const checkUserSetup = async () => {
    try {
        const user = localAuth.getCurrentUser();
        if (!user) {
            return { allowed: false, needsSetup: true };
        }

        const userData = await getUserData();

        if (userData.role === 'admin') {
            return { allowed: false, needsSetup: false };
        }

        const needsSetup = !userData.setup || !userData.name || !userData.phone;
        return { allowed: true, needsSetup };

    } catch (error) {
        console.error('Error checking user setup:', error);
        return { allowed: false, needsSetup: true };
    }
};

export const completeUserSetup = async (setupData) => {
    try {
        await updateUserData({
            setup: true,
            name: setupData.name,
            displayName: setupData.name,
            phone: setupData.phone,
            location: setupData.location || null,
            locationAddress: setupData.locationAddress || null,
            setupCompletedAt: new Date().toISOString(),
        });

        // Also update the local auth user
        await localAuth.updateUserProfile({
            displayName: setupData.name,
            setup: true,
        });

        return true;
    } catch (error) {
        console.error('Error completing setup:', error);
        throw error;
    }
};

// ========================================
// CLEAR ALL USER DATA
// ========================================

export const clearAllUserData = async () => {
    try {
        const user = localAuth.getCurrentUser();
        if (!user) return;

        await StorageService.removeItem(`${USER_DATA_KEY}${user.uid}`);
        await StorageService.removeItem(`${SCAN_HISTORY_KEY}${user.uid}`);
        await StorageService.removeItem(`${FAVORITES_KEY}${user.uid}`);
        await StorageService.removeItem(`${UPLOADS_KEY}${user.uid}`);

        console.log('All user data cleared');
    } catch (error) {
        console.error('Error clearing user data:', error);
    }
};

export default {
    getUserData,
    setUserData,
    updateUserData,
    getFavorites,
    setFavorites,
    addFavorite,
    removeFavorite,
    getScanHistory,
    addScanResult,
    getDetectedDiseases,
    createUpload,
    updateUpload,
    updateUserLocation,
    checkUserSetup,
    completeUserSetup,
    clearAllUserData,
};
