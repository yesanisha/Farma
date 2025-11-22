// screens/SetupScreen.js - Fixed: Name + Phone only, no location step

import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { updateUserSetup, getFreshToken } from "../services/auth";

const { width } = Dimensions.get("window");

const SetupScreen = ({ route, navigation }) => {
    // Form states - only name and phone
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // Only 2 steps now

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Initial animation - disable native driver on web
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: Platform.OS !== 'web',
            }),
        ]).start();

        // Update progress bar - only 2 steps now
        Animated.timing(progressAnim, {
            toValue: step / 2,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [step]);

    // Ensure we have a valid token before setup
    useEffect(() => {
        const ensureToken = async () => {
            try {
                console.log('🔑 Ensuring token for setup...');
                const token = await getFreshToken();
                console.log('✅ Token ensured for setup:', !!token);
            } catch (error) {
                console.error('❌ Error ensuring token:', error);
                Alert.alert(
                    "Authentication Error",
                    "There was an issue with your session. Please log in again.",
                    [{
                        text: "OK",
                        onPress: () => navigation.navigate("LoginScreen")
                    }]
                );
            }
        };

        ensureToken();
    }, []);

    // Validate input fields
    const validateName = (text) => {
        const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
        return nameRegex.test(text.trim());
    };

    const validatePhone = (text) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = text.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
    };

    // Handle next step
    const handleNext = () => {
        console.log('➡️ Moving to next step, current step:', step);

        if (step === 1) {
            if (!name.trim()) {
                Alert.alert("Required Field", "Please enter your name");
                return;
            }

            if (!validateName(name)) {
                Alert.alert("Invalid Name", "Please enter a valid name (2-50 characters, letters only)");
                return;
            }

            console.log('✅ Step 1 validation passed, name:', name);
            setStep(2);
        }
    };

    // Complete setup - web compatible navigation
    const handleCompleteSetup = async () => {
        try {
            console.log('🚀 Starting setup completion...');
            console.log('🌐 Platform:', Platform.OS);
            setLoading(true);

            // Validate phone first
            if (!phone.trim()) {
                Alert.alert("Required Field", "Please enter your phone number");
                return;
            }

            if (!validatePhone(phone)) {
                Alert.alert("Invalid Phone", "Please enter a valid phone number (10-16 digits)");
                return;
            }

            // Prepare setup data - no location
            const setupData = {
                name: name.trim(),
                phone: phone.trim().replace(/[\s\-\(\)]/g, ''),
                setupCompletedAt: new Date().toISOString(),
            };

            console.log('📝 Setup data prepared:', {
                name: setupData.name,
                phone: setupData.phone,
                setupCompletedAt: setupData.setupCompletedAt,
                platform: Platform.OS
            });

            // Ensure we have a fresh token
            console.log('🔑 Getting fresh token before setup...');
            const token = await getFreshToken();
            console.log('✅ Fresh token obtained:', !!token);

            if (!token) {
                throw new Error('No authentication token available');
            }

            // Update user setup
            console.log('📡 Calling updateUserSetup...');
            const success = await updateUserSetup(setupData);
            console.log('📡 updateUserSetup result:', success);

            if (success) {
                console.log('✅ Setup completed successfully');

                // Web-compatible navigation
                const navigateToMainTabs = () => {
                    try {
                        if (Platform.OS === 'web') {
                            console.log('🌐 Web navigation to MainTabs');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'MainTabs' }],
                            });
                        } else {
                            console.log('📱 Native navigation to MainTabs');
                            navigation.replace("MainTabs");
                        }
                    } catch (navError) {
                        console.error('❌ Navigation error:', navError);
                        // Fallback
                        navigation.navigate('MainTabs');
                    }
                };

                // Show success and navigate
                if (Platform.OS === 'web') {
                    console.log('🎉 Setup complete - web version');
                    // Small delay for web
                    setTimeout(navigateToMainTabs, 100);
                } else {
                    Alert.alert(
                        "Setup Complete!",
                        "Welcome to FARMA! Your account is now ready to use.",
                        [{
                            text: "Continue",
                            onPress: navigateToMainTabs
                        }]
                    );
                }
            } else {
                throw new Error("Setup update returned false");
            }

        } catch (error) {
            console.error('❌ Setup error details:', {
                message: error.message,
                code: error.code,
                platform: Platform.OS
            });

            let errorMessage = "Failed to complete setup. Please try again.";

            if (error.message && error.message.includes('auth')) {
                errorMessage = "Authentication error. Please log in again.";

                Alert.alert(
                    "Authentication Error",
                    errorMessage,
                    [{
                        text: "Login Again",
                        onPress: () => navigation.navigate("LoginScreen")
                    }]
                );
                return;
            }

            Alert.alert("Setup Error", errorMessage, [
                {
                    text: "Retry",
                    onPress: handleCompleteSetup
                },
                {
                    text: "Skip Setup",
                    style: "cancel",
                    onPress: () => {
                        console.log('⏭️ User chose to skip setup');
                        if (Platform.OS === 'web') {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'MainTabs' }],
                            });
                        } else {
                            navigation.replace("MainTabs");
                        }
                    }
                }
            ]);
        } finally {
            setLoading(false);
            console.log('🏁 Setup completion attempt finished');
        }
    };

    // Go back to previous step
    const handleBack = () => {
        if (step > 1) {
            console.log('⬅️ Going back to step', step - 1);
            setStep(step - 1);
        }
    };

    // Render different steps
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <Ionicons name="person-outline" size={60} color="#4CAF50" style={styles.stepIcon} />
                        <Text style={styles.stepTitle}>What's your name?</Text>
                        <Text style={styles.stepSubtitle}>
                            Help us personalize your farming experience
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            placeholderTextColor="#999"
                            editable={!loading}
                            maxLength={50}
                        />

                        {name.trim() && !validateName(name) && (
                            <Text style={styles.errorText}>
                                Please enter a valid name (letters only, 2-50 characters)
                            </Text>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                (!name.trim() || !validateName(name)) && styles.disabledButton
                            ]}
                            onPress={handleNext}
                            disabled={loading || !name.trim() || !validateName(name)}
                        >
                            <Text style={styles.primaryButtonText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <Ionicons name="call-outline" size={60} color="#4CAF50" style={styles.stepIcon} />
                        <Text style={styles.stepTitle}>Phone Number</Text>
                        <Text style={styles.stepSubtitle}>
                            For important updates and support
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your phone number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor="#999"
                            editable={!loading}
                            maxLength={20}
                        />

                        {phone.trim() && !validatePhone(phone) && (
                            <Text style={styles.errorText}>
                                Please enter a valid phone number (10-16 digits)
                            </Text>
                        )}

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleBack}
                                disabled={loading}
                            >
                                <Text style={styles.secondaryButtonText}>Back</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    styles.flexButton,
                                    (!phone.trim() || !validatePhone(phone)) && styles.disabledButton
                                ]}
                                onPress={handleCompleteSetup}
                                disabled={loading || !phone.trim() || !validatePhone(phone)}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {loading ? "Finishing..." : "Complete Setup"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Debug info for web */}
                        {__DEV__ && Platform.OS === 'web' && (
                            <View style={styles.debugContainer}>
                                <Text style={styles.debugText}>
                                    Debug - Platform: {Platform.OS} | Steps: 2 (no location)
                                </Text>
                            </View>
                        )}
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#4CAF50", "#388E3C"]}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.keyboardView}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Setup Your Account</Text>
                            <Text style={styles.headerSubtitle}>Step {step} of 2</Text>

                            {/* Progress Bar */}
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBackground}>
                                    <Animated.View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                })
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Content */}
                        <ScrollView
                            contentContainerStyle={styles.scrollContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            <Animated.View
                                style={[
                                    styles.contentContainer,
                                    {
                                        opacity: fadeAnim,
                                        transform: Platform.OS !== 'web' ? [{ translateY: slideAnim }] : [],
                                    },
                                ]}
                            >
                                {renderStepContent()}
                            </Animated.View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    keyboardView: { flex: 1 },

    header: {
        padding: 20,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: "rgba(255,255,255,0.8)",
        marginBottom: 20,
    },

    progressContainer: {
        width: width - 40,
        height: 6,
    },
    progressBackground: {
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "white",
        borderRadius: 3,
    },

    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },

    stepContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    stepIcon: {
        marginBottom: 20,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 10,
    },
    stepSubtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
        lineHeight: 22,
    },

    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: "#f9f9f9",
        marginBottom: 10,
    },

    errorText: {
        color: "#FF6B6B",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 20,
    },

    primaryButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 12,
        minWidth: 120,
    },
    primaryButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },

    secondaryButton: {
        backgroundColor: "#f5f5f5",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        minWidth: 100,
    },
    secondaryButtonText: {
        color: "#666",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },

    buttonRow: {
        flexDirection: "row",
        gap: 15,
        width: "100%",
        marginTop: 20,
    },
    flexButton: {
        flex: 1,
    },

    disabledButton: {
        backgroundColor: "#ccc",
    },

    // Debug styles
    debugContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
    },
    debugText: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
});

export default SetupScreen;