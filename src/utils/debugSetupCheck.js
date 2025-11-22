// utils/debugSetupCheck.js
import { auth } from "../config/firebase";
import { checkUserSetup } from "../services/auth";

export const debugSetupCheck = async () => {
    try {
        console.log('=== DEBUG SETUP CHECK START ===');
        console.log('Current user:', auth.currentUser?.uid);
        console.log('Current user email:', auth.currentUser?.email);

        if (!auth.currentUser) {
            console.log(' No authenticated user');
            return;
        }

        console.log('Calling checkUserSetup...');
        const result = await checkUserSetup();

        console.log('=== SETUP CHECK RESULT ===');
        console.log('Result type:', typeof result);
        console.log('Result constructor:', result?.constructor?.name);
        console.log('Result keys:', Object.keys(result || {}));
        console.log('Full result:', JSON.stringify(result, null, 2));

        if (result && typeof result === 'object') {
            console.log('✅ Valid result object');
            console.log('- allowed:', result.allowed);
            console.log('- needsSetup:', result.needsSetup);

            if (result.allowed && result.needsSetup) {
                console.log('👉 Should navigate to SetupScreen');
            } else if (result.allowed && !result.needsSetup) {
                console.log('👉 Should navigate to HomeScreen');
            } else {
                console.log('👉 Should show access denied');
            }
        } else {
            console.log(' Invalid result object');
        }

        console.log('=== DEBUG SETUP CHECK END ===');
        return result;

    } catch (error) {
        console.error('=== SETUP CHECK DEBUG ERROR ===');
        console.error('Error type:', typeof error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error:', error);
        console.error('=== END ERROR ===');
    }
};

// Add this button to your LoginScreen temporarily for testing
export const DebugButton = ({ onPress }) => {
    return (
        <TouchableOpacity
            style={{
                backgroundColor: 'orange',
                padding: 10,
                margin: 10,
                borderRadius: 5,
            }}
            onPress={onPress}
        >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                DEBUG SETUP CHECK
            </Text>
        </TouchableOpacity>
    );
};