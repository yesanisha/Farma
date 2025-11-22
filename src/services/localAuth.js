// services/localAuth.js - Local Authentication Service (No Firebase)
import StorageService from "./storage";
import * as Crypto from 'expo-crypto';

// Storage keys
const USERS_KEY = 'local_users';
const CURRENT_USER_KEY = 'current_user';
const AUTH_TOKEN_KEY = 'local_auth_token';

// Simple hash function for passwords
const hashPassword = async (password) => {
    const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
    );
    return hash;
};

// Generate a simple token
const generateToken = () => {
    return `local_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Generate a simple user ID
const generateUserId = () => {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Get all registered users
const getUsers = async () => {
    const users = await StorageService.getItem(USERS_KEY);
    return users || {};
};

// Save users
const saveUsers = async (users) => {
    await StorageService.setItem(USERS_KEY, users);
};

// Auth state change listeners
let authStateListeners = [];
let currentUser = null;

// Notify all listeners of auth state change
const notifyAuthStateChange = (user) => {
    currentUser = user;
    authStateListeners.forEach(listener => {
        try {
            listener(user);
        } catch (e) {
            console.error('Auth listener error:', e);
        }
    });
};

// Initialize - load current user from storage
export const initializeLocalAuth = async () => {
    try {
        const storedUser = await StorageService.getItem(CURRENT_USER_KEY);
        if (storedUser) {
            currentUser = storedUser;
            notifyAuthStateChange(storedUser);
        }
        return storedUser;
    } catch (error) {
        console.error('Error initializing local auth:', error);
        return null;
    }
};

// Subscribe to auth state changes
export const onAuthStateChanged = (callback) => {
    authStateListeners.push(callback);
    // Immediately call with current state
    callback(currentUser);

    // Return unsubscribe function
    return () => {
        authStateListeners = authStateListeners.filter(l => l !== callback);
    };
};

// Get current user
export const getCurrentUser = () => currentUser;

// Sign up with email and password
export const signupWithEmail = async (email, password) => {
    try {
        console.log('Local signup for:', email);

        const users = await getUsers();

        // Check if user already exists
        const existingUser = Object.values(users).find(u => u.email === email.toLowerCase());
        if (existingUser) {
            throw { code: 'auth/email-already-in-use', message: 'Email already in use' };
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        const userId = generateUserId();
        const token = generateToken();

        const newUser = {
            uid: userId,
            email: email.toLowerCase(),
            password: hashedPassword,
            displayName: email.split('@')[0],
            emailVerified: true, // Auto-verify for local
            createdAt: new Date().toISOString(),
            setup: false,
            role: 'user',
        };

        // Save user
        users[userId] = newUser;
        await saveUsers(users);

        // Create user object without password
        const userWithoutPassword = { ...newUser };
        delete userWithoutPassword.password;

        // Store current user and token
        await StorageService.setItem(CURRENT_USER_KEY, userWithoutPassword);
        await StorageService.setItem(AUTH_TOKEN_KEY, token);

        notifyAuthStateChange(userWithoutPassword);

        console.log('Local signup successful');
        return { user: userWithoutPassword, token };

    } catch (error) {
        console.error('Local signup error:', error);
        throw error;
    }
};

// Login with email and password
export const loginWithEmail = async (email, password) => {
    try {
        console.log('Local login for:', email);

        const users = await getUsers();

        // Find user by email
        const user = Object.values(users).find(u => u.email === email.toLowerCase());
        if (!user) {
            throw { code: 'auth/user-not-found', message: 'User not found' };
        }

        // Verify password
        const hashedPassword = await hashPassword(password);
        if (user.password !== hashedPassword) {
            throw { code: 'auth/wrong-password', message: 'Wrong password' };
        }

        const token = generateToken();

        // Create user object without password
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;

        // Store current user and token
        await StorageService.setItem(CURRENT_USER_KEY, userWithoutPassword);
        await StorageService.setItem(AUTH_TOKEN_KEY, token);

        notifyAuthStateChange(userWithoutPassword);

        console.log('Local login successful');
        return { user: userWithoutPassword, token };

    } catch (error) {
        console.error('Local login error:', error);
        throw error;
    }
};

// Logout
export const logout = async () => {
    try {
        await StorageService.removeItem(CURRENT_USER_KEY);
        await StorageService.removeItem(AUTH_TOKEN_KEY);
        notifyAuthStateChange(null);
        console.log('Local logout successful');
    } catch (error) {
        console.error('Local logout error:', error);
        throw error;
    }
};

// Update user profile
export const updateUserProfile = async (updates) => {
    try {
        if (!currentUser) {
            throw new Error('No authenticated user');
        }

        const users = await getUsers();
        const user = users[currentUser.uid];

        if (!user) {
            throw new Error('User not found');
        }

        // Update user
        const updatedUser = {
            ...user,
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        users[currentUser.uid] = updatedUser;
        await saveUsers(users);

        // Update current user (without password)
        const userWithoutPassword = { ...updatedUser };
        delete userWithoutPassword.password;

        await StorageService.setItem(CURRENT_USER_KEY, userWithoutPassword);
        notifyAuthStateChange(userWithoutPassword);

        return userWithoutPassword;

    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
};

// Reset password (just updates the password for the email)
export const resetPassword = async (email) => {
    // In local mode, we can't actually send an email
    // Just log it and return success
    console.log('Password reset requested for:', email);
    return true;
};

// Delete account
export const deleteAccount = async () => {
    try {
        if (!currentUser) {
            throw new Error('No authenticated user');
        }

        const users = await getUsers();
        delete users[currentUser.uid];
        await saveUsers(users);

        await logout();
        console.log('Account deleted');

    } catch (error) {
        console.error('Delete account error:', error);
        throw error;
    }
};

// Get auth token
export const getAuthToken = async () => {
    return await StorageService.getItem(AUTH_TOKEN_KEY);
};

// Guest login (creates a temporary guest user)
export const loginAsGuest = async () => {
    try {
        const guestId = `guest_${Date.now()}`;
        const token = generateToken();

        const guestUser = {
            uid: guestId,
            email: null,
            displayName: 'Guest',
            isGuest: true,
            createdAt: new Date().toISOString(),
            setup: true,
            role: 'guest',
        };

        await StorageService.setItem(CURRENT_USER_KEY, guestUser);
        await StorageService.setItem(AUTH_TOKEN_KEY, token);

        notifyAuthStateChange(guestUser);

        console.log('Guest login successful');
        return { user: guestUser, token };

    } catch (error) {
        console.error('Guest login error:', error);
        throw error;
    }
};

export default {
    initializeLocalAuth,
    onAuthStateChanged,
    getCurrentUser,
    signupWithEmail,
    loginWithEmail,
    logout,
    updateUserProfile,
    resetPassword,
    deleteAccount,
    getAuthToken,
    loginAsGuest,
};
