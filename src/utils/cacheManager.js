// utils/cacheManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for the application
export const STORAGE_KEYS = {
    USER_LOGGED_IN: 'user_logged_in',
    CACHED_PLANTS: 'cached_plants',
    CACHED_USER_LOCATION: 'cached_user_location',
    APP_FIRST_LAUNCH: 'app_first_launch',
    USER_PREFERENCES: 'user_preferences',
    LAST_REFRESH: 'last_refresh',
    FAVORITES: 'user_favorites',
    SEARCH_HISTORY: 'search_history',
    WEATHER_CACHE: 'weather_cache',
    DISEASE_CACHE: 'disease_cache',
    SCAN_HISTORY: 'scan_history'
};

// Default cache expiry times (in hours)
export const CACHE_EXPIRY = {
    PLANTS: 24,
    LOCATION: 72,
    WEATHER: 1,
    DISEASES: 168, // 1 week
    USER_DATA: 24
};

class CacheManager {
    /**
     * Save data to cache with timestamp
     * @param {string} key - Storage key
     * @param {any} data - Data to cache
     * @param {number} customExpiry - Custom expiry in hours (optional)
     */
    async save(key, data, customExpiry = null) {
        try {
            const cacheData = {
                data,
                timestamp: Date.now(),
                customExpiry,
                version: '1.0'
            };

            await AsyncStorage.setItem(key, JSON.stringify(cacheData));
            console.log(`✅ Data cached successfully for key: ${key}`, {
                dataSize: JSON.stringify(data).length,
                timestamp: new Date(cacheData.timestamp).toISOString()
            });

            return true;
        } catch (error) {
            console.error(`❌ Error saving cache for ${key}:`, error);
            return false;
        }
    }

    /**
     * Load data from cache if not expired
     * @param {string} key - Storage key
     * @param {number} expiryHours - Expiry time in hours
     * @returns {any|null} Cached data or null if expired/not found
     */
    async load(key, expiryHours = 24) {
        try {
            const cachedData = await AsyncStorage.getItem(key);

            if (!cachedData) {
                console.log(`📭 No cache found for key: ${key}`);
                return null;
            }

            const { data, timestamp, customExpiry, version } = JSON.parse(cachedData);
            const effectiveExpiry = customExpiry || expiryHours;
            const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60);

            if (hoursSinceCache < effectiveExpiry) {
                console.log(`📦 Loading fresh cache for ${key}`, {
                    age: `${hoursSinceCache.toFixed(1)} hours`,
                    expiresIn: `${(effectiveExpiry - hoursSinceCache).toFixed(1)} hours`,
                    version
                });
                return data;
            } else {
                console.log(`⏰ Cache expired for ${key}`, {
                    age: `${hoursSinceCache.toFixed(1)} hours`,
                    expiry: `${effectiveExpiry} hours`
                });
                await this.clear(key);
                return null;
            }
        } catch (error) {
            console.error(`❌ Error loading cache for ${key}:`, error);
            return null;
        }
    }

    /**
     * Load stale cache (ignoring expiry) - useful for offline fallback
     * @param {string} key - Storage key
     * @returns {any|null} Cached data regardless of expiry
     */
    async loadStale(key) {
        try {
            const cachedData = await AsyncStorage.getItem(key);

            if (!cachedData) {
                return null;
            }

            const { data, timestamp, version } = JSON.parse(cachedData);
            const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60);

            console.log(`📜 Loading stale cache for ${key}`, {
                age: `${hoursSinceCache.toFixed(1)} hours`,
                version
            });

            return data;
        } catch (error) {
            console.error(`❌ Error loading stale cache for ${key}:`, error);
            return null;
        }
    }

    /**
     * Check if cache exists and is valid
     * @param {string} key - Storage key
     * @param {number} expiryHours - Expiry time in hours
     * @returns {boolean} True if cache is valid
     */
    async isValid(key, expiryHours = 24) {
        try {
            const cachedData = await AsyncStorage.getItem(key);

            if (!cachedData) {
                return false;
            }

            const { timestamp, customExpiry } = JSON.parse(cachedData);
            const effectiveExpiry = customExpiry || expiryHours;
            const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60);

            return hoursSinceCache < effectiveExpiry;
        } catch (error) {
            console.error(`❌ Error checking cache validity for ${key}:`, error);
            return false;
        }
    }

    /**
     * Get cache metadata
     * @param {string} key - Storage key
     * @returns {object|null} Cache metadata
     */
    async getMetadata(key) {
        try {
            const cachedData = await AsyncStorage.getItem(key);

            if (!cachedData) {
                return null;
            }

            const { timestamp, customExpiry, version } = JSON.parse(cachedData);
            const hoursSinceCache = (Date.now() - timestamp) / (1000 * 60 * 60);

            return {
                key,
                timestamp,
                age: hoursSinceCache,
                customExpiry,
                version,
                createdAt: new Date(timestamp).toISOString()
            };
        } catch (error) {
            console.error(`❌ Error getting metadata for ${key}:`, error);
            return null;
        }
    }

    /**
     * Clear specific cache
     * @param {string} key - Storage key
     */
    async clear(key) {
        try {
            await AsyncStorage.removeItem(key);
            console.log(`🗑️ Cache cleared for ${key}`);
            return true;
        } catch (error) {
            console.error(`❌ Error clearing cache for ${key}:`, error);
            return false;
        }
    }

    /**
     * Clear multiple caches
     * @param {string[]} keys - Array of storage keys
     */
    async clearMultiple(keys) {
        try {
            await AsyncStorage.multiRemove(keys);
            console.log(`🗑️ Multiple caches cleared:`, keys);
            return true;
        } catch (error) {
            console.error(`❌ Error clearing multiple caches:`, error);
            return false;
        }
    }

    /**
     * Clear all application cache
     */
    async clearAll() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const appKeys = allKeys.filter(key =>
                Object.values(STORAGE_KEYS).includes(key)
            );

            await AsyncStorage.multiRemove(appKeys);
            console.log(`🗑️ All app cache cleared:`, appKeys);
            return true;
        } catch (error) {
            console.error(`❌ Error clearing all cache:`, error);
            return false;
        }
    }

    /**
     * Get all cache info for debugging
     */
    async getAllCacheInfo() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const appKeys = allKeys.filter(key =>
                Object.values(STORAGE_KEYS).includes(key)
            );

            const cacheInfo = {};

            for (const key of appKeys) {
                const metadata = await this.getMetadata(key);
                if (metadata) {
                    cacheInfo[key] = metadata;
                }
            }

            return cacheInfo;
        } catch (error) {
            console.error(`❌ Error getting cache info:`, error);
            return {};
        }
    }

    /**
     * Update cache without changing timestamp (for incremental updates)
     * @param {string} key - Storage key
     * @param {function} updateFunction - Function to update data
     */
    async update(key, updateFunction) {
        try {
            const cachedData = await AsyncStorage.getItem(key);

            if (!cachedData) {
                console.log(`📭 No cache to update for key: ${key}`);
                return false;
            }

            const cacheObject = JSON.parse(cachedData);
            const updatedData = updateFunction(cacheObject.data);

            cacheObject.data = updatedData;
            cacheObject.lastUpdated = Date.now();

            await AsyncStorage.setItem(key, JSON.stringify(cacheObject));
            console.log(`🔄 Cache updated for key: ${key}`);

            return true;
        } catch (error) {
            console.error(`❌ Error updating cache for ${key}:`, error);
            return false;
        }
    }

    /**
     * Preload multiple caches
     * @param {object} cacheMap - Map of keys to data
     */
    async preloadCaches(cacheMap) {
        try {
            const promises = Object.entries(cacheMap).map(([key, data]) =>
                this.save(key, data)
            );

            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled').length;

            console.log(`📦 Preloaded ${successful}/${results.length} caches`);
            return successful === results.length;
        } catch (error) {
            console.error(`❌ Error preloading caches:`, error);
            return false;
        }
    }

    /**
     * Get cache size information
     */
    async getCacheSize() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const appKeys = allKeys.filter(key =>
                Object.values(STORAGE_KEYS).includes(key)
            );

            let totalSize = 0;
            const sizeByKey = {};

            for (const key of appKeys) {
                const data = await AsyncStorage.getItem(key);
                if (data) {
                    const size = new Blob([data]).size;
                    sizeByKey[key] = size;
                    totalSize += size;
                }
            }

            return {
                totalSize,
                sizeByKey,
                totalSizeFormatted: this.formatBytes(totalSize),
                keyCount: appKeys.length
            };
        } catch (error) {
            console.error(`❌ Error getting cache size:`, error);
            return { totalSize: 0, sizeByKey: {}, totalSizeFormatted: '0 B', keyCount: 0 };
        }
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes 
     * @returns {string}
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Export singleton instance
export const cacheManager = new CacheManager();
export default cacheManager;