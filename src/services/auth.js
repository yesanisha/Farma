// services/auth.js - Authentication Service (Local Mode)
// This file wraps localAuth to provide the same API as the original Firebase auth

import localAuth from "./localAuth";
import localDatabase from "./localDatabase";
import StorageService from "./storage";
import { Platform } from 'react-native';

// ========================================
// CONFIGURATION
// ========================================

// Flag to enable/disable social logins (not available in local mode)
const SOCIAL_LOGIN_ENABLED = false;

// Token management functions (for API compatibility)
const storeAuthToken = async (token) => {
    try {
        await StorageService.setItem("auth_token", token);
        console.log("Token stored successfully");
    } catch (error) {
        console.error("Error storing token:", error);
    }
};

const getStoredAuthToken = async () => {
    try {
        return await StorageService.getItem("auth_token");
    } catch (error) {
        console.error("Error retrieving token:", error);
        return null;
    }
};

const removeStoredAuthToken = async () => {
    try {
        await StorageService.removeItem("auth_token");
        console.log("Token removed successfully");
    } catch (error) {
        console.error("Error removing token:", error);
    }
};

export const getFreshToken = async () => {
    try {
        const token = await localAuth.getAuthToken();
        return token;
    } catch (error) {
        console.error("Error getting token:", error);
        throw error;
    }
};

// ========================================
// AUTH STATE
// ========================================

// Create a fake auth object that mimics Firebase auth
export const auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
        return localAuth.onAuthStateChanged((user) => {
            auth.currentUser = user;
            callback(user);
        });
    },
};

// Initialize auth on module load
localAuth.initializeLocalAuth().then(user => {
    auth.currentUser = user;
});

// ========================================
// EMAIL/PASSWORD AUTH
// ========================================

export const signupWithDoc = async (email, password) => {
    try {
        console.log('Starting local signup...');
        const result = await localAuth.signupWithEmail(email, password);

        // Create initial user data
        await localDatabase.setUserData({
            email: result.user.email,
            displayName: result.user.displayName,
            setup: false,
            role: 'user',
            createdAt: new Date().toISOString(),
        });

        auth.currentUser = result.user;
        await storeAuthToken(result.token);

        console.log('Local signup successful');
        return result;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
};

export const loginWithDoc = async (email, password) => {
    try {
        console.log('Starting local login...');
        const result = await localAuth.loginWithEmail(email, password);

        auth.currentUser = result.user;
        await storeAuthToken(result.token);

        console.log('Local login successful');
        return result;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// ========================================
// SOCIAL LOGIN (Disabled in local mode)
// ========================================

export const googleLoginWithDoc = async () => {
    if (!SOCIAL_LOGIN_ENABLED) {
        throw new Error('Google Sign-In is not available in local mode. Please use email/password.');
    }
};

export const appleLoginWithDoc = async () => {
    if (!SOCIAL_LOGIN_ENABLED) {
        throw new Error('Apple Sign-In is not available in local mode. Please use email/password.');
    }
};

// ========================================
// OTHER AUTH FUNCTIONS
// ========================================

export const logout = async () => {
    try {
        await localAuth.logout();
        await removeStoredAuthToken();
        auth.currentUser = null;
        console.log('Logout successful');
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

export const forgotPassword = async (email) => {
    // In local mode, we can't send emails
    // Just show a message that this feature is not available
    console.log('Password reset requested for:', email);
    console.log('Note: In local mode, password reset is not available via email.');
    // For testing, we'll just return success
    return true;
};

export const getCustomClaims = async () => {
    // Local mode doesn't have custom claims
    const user = localAuth.getCurrentUser();
    if (!user) return null;

    return {
        role: user.role || 'user',
    };
};

export const checkUserSetup = async () => {
    try {
        console.log('Checking user setup...');

        const user = localAuth.getCurrentUser();
        if (!user) {
            console.log('No authenticated user found');
            return { allowed: false, needsSetup: true };
        }

        const result = await localDatabase.checkUserSetup();
        console.log('Setup check result:', result);

        return result;
    } catch (err) {
        console.error('Error checking user setup:', err);
        return { allowed: false, needsSetup: true };
    }
};

export const updateUserSetup = async (userData) => {
    try {
        const user = localAuth.getCurrentUser();
        if (!user) {
            throw new Error('No authenticated user');
        }

        console.log('Updating user setup with data:', userData);

        await localDatabase.completeUserSetup(userData);

        console.log('User setup completed successfully');
        return true;
    } catch (error) {
        console.error('Error updating user setup:', error);
        throw error;
    }
};

// ========================================
// GUEST LOGIN
// ========================================

export const loginAsGuest = async () => {
    try {
        console.log('Starting guest login...');
        const result = await localAuth.loginAsGuest();

        auth.currentUser = result.user;
        await storeAuthToken(result.token);

        console.log('Guest login successful');
        return result;
    } catch (error) {
        console.error('Guest login error:', error);
        throw error;
    }
};

// ========================================
// ACCOUNT MANAGEMENT
// ========================================

export const deleteUserAccount = async () => {
    try {
        // Clear all user data
        await localDatabase.clearAllUserData();

        // Delete the account
        await localAuth.deleteAccount();

        auth.currentUser = null;
        console.log('Account deleted successfully');
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
};

// Export the auth object for compatibility
export { auth as firebaseAuth };
