// utils/debugAuth.js
import { auth, functions } from "../config/firebase";
import { httpsCallable } from "firebase/functions";

// Test function to debug your cloud function
export const testCloudFunction = async () => {
    try {
        console.log('Testing cloud function...');

        if (!auth.currentUser) {
            console.error('No authenticated user');
            return;
        }

        const setUserRole = httpsCallable(functions, "setUserRole");

        console.log('Calling cloud function with test data...');
        const result = await setUserRole({
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            role: "user",
            setup: false
        });

        console.log('Cloud function raw response:', result);
        console.log('Cloud function data:', result.data);
        console.log('Response type:', typeof result);
        console.log('Data type:', typeof result.data);

        if (result && result.data) {
            console.log('✅ Cloud function working correctly');
            return result.data;
        } else {
            console.error('❌ Cloud function response missing data field');
            return null;
        }

    } catch (error) {
        console.error('❌ Cloud function test failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
    }
};

// Test the entire auth flow
export const testAuthFlow = async (email, password) => {
    try {
        console.log('=== Testing Auth Flow ===');

        // Step 1: Test cloud function
        console.log('Step 1: Testing cloud function...');
        await testCloudFunction();

        // Step 2: Test user setup check
        console.log('Step 2: Testing setup check...');
        const { checkUserSetup } = require('../services/auth');
        const setupStatus = await checkUserSetup();
        console.log('Setup status:', setupStatus);

        console.log('=== Auth Flow Test Complete ===');

    } catch (error) {
        console.error('Auth flow test failed:', error);
    }
};