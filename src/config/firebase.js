// Firebase has been removed - Using local backend with Gemini API
// This file provides stub exports to prevent import errors during migration

console.log('Firebase has been removed. Using local backend with Gemini API for plant disease detection.');

// Stub auth object for compatibility
export const auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
        // Return unsubscribe function
        callback(null);
        return () => {};
    },
    signOut: async () => {
        console.log('Using local auth - signOut');
    }
};

// Stub db object for compatibility
export const db = null;

// Stub storage object for compatibility
export const storage = null;

// Stub functions object for compatibility
export const functions = null;

// Stub config for compatibility
export const firebaseConfig = null;
