// Fixed LoginScreen - Social Login Web Only
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
    TextInput,
    Alert,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    loginWithDoc,
    signupWithDoc,
    checkUserSetup,
    googleLoginWithDoc,
    appleLoginWithDoc,
} from "../services/auth";
import * as Location from 'expo-location';
import { STORAGE_KEYS } from '../utils/cacheManager';

const { height, width } = Dimensions.get("window");

const LoginScreen = ({ setIsGuest, navigation, onLoginSuccess }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [socialLoading, setSocialLoading] = useState(null);

    // Modal states
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Debounce refs to prevent multiple rapid clicks
    const lastClickTime = useRef(0);
    const isProcessing = useRef(false);

    // Animations
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: Platform.OS !== 'web',
            }),
        ]).start();
    }, []);

    // Debounced function to prevent multiple rapid calls
    const debounce = useCallback((func, delay = 1000) => {
        return (...args) => {
            const now = Date.now();
            if (now - lastClickTime.current < delay || isProcessing.current) {
                console.log('Button press debounced - too fast');
                return;
            }
            lastClickTime.current = now;
            func(...args);
        };
    }, []);

    // Get device location
    const getUserLocation = async () => {
        try {
            if (Platform.OS === 'web') {
                console.log('Skipping location on web');
                return null;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied');
                return null;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                timeout: 10000,
            });

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
        } catch (err) {
            console.error('Location error:', err);
            return null;
        }
    };

    // Handle navigation after authentication
    const handlePostAuth = async () => {
        try {
            console.log('Checking user setup status...');

            await new Promise(resolve => setTimeout(resolve, 500));

            const setupCheck = await checkUserSetup();
            console.log('Setup check result:', setupCheck);

            if (!setupCheck || typeof setupCheck !== 'object') {
                console.error('Invalid setup check result:', setupCheck);
                Alert.alert("Error", "Unable to verify account status. Please try again.");
                return;
            }

            if (!setupCheck.allowed) {
                console.log('Access not allowed for user');
                Alert.alert("Access Denied", "You cannot access this app. Please contact support.");
                return;
            }

            await AsyncStorage.setItem(STORAGE_KEYS.USER_LOGGED_IN, 'true');

            if (onLoginSuccess) {
                onLoginSuccess();
            }

            if (setupCheck.needsSetup) {
                console.log('User needs setup, navigating to SetupScreen...');
                const location = await getUserLocation();

                const provider = setupCheck.provider || "password";
                navigation.navigate("SetupScreen", { location, provider });
            } else {
                console.log('Setup complete, navigating to MainTabs...');
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            }

        } catch (error) {
            console.error('Post-auth check error:', error);
            Alert.alert("Error", "Something went wrong checking your account. Please try again.");
        }
    };

    // Validate form inputs
    const validateInputs = () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Please fill all fields");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert("Error", "Please enter a valid email address");
            return false;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long");
            return false;
        }

        return true;
    };

    // Handle login/signup
    const handleAuth = debounce(async () => {
        if (!validateInputs() || isProcessing.current) return;

        try {
            isProcessing.current = true;
            setIsLoading(true);

            let authResult;

            if (isLogin) {
                console.log('Attempting login for:', email);
                authResult = await loginWithDoc(email.trim(), password);
                console.log('Login successful, token stored');
            } else {
                console.log('Attempting signup for:', email);
                authResult = await signupWithDoc(email.trim(), password);
                console.log('Signup successful, token stored');
                Alert.alert(
                    "Account Created",
                    "Welcome to FARMA! Let's set up your profile.",
                    [{ text: "Continue" }]
                );
            }

            console.log('Auth result:', {
                hasUser: !!authResult.user,
                hasToken: !!authResult.token,
                userId: authResult.user?.uid
            });

            await handlePostAuth();

        } catch (error) {
            console.error('Auth error:', error);
            handleAuthError(error);
        } finally {
            setIsLoading(false);
            isProcessing.current = false;
        }
    });

    // Handle authentication errors
    const handleAuthError = (error) => {
        let errorMessage = "An error occurred. Please try again.";

        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = "No account found with this email. Please check your email or sign up.";
                break;
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = "Invalid email or password. Please check your credentials.";
                break;
            case 'auth/email-already-in-use':
                errorMessage = "An account with this email already exists. Please try logging in.";
                break;
            case 'auth/weak-password':
                errorMessage = "Password is too weak. Please choose a stronger password.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Invalid email address format.";
                break;
            case 'auth/user-disabled':
                errorMessage = "This account has been disabled. Please contact support.";
                break;
            case 'auth/too-many-requests':
                errorMessage = "Too many failed attempts. Please try again later.";
                break;
            case 'auth/network-request-failed':
                errorMessage = "Network error. Please check your internet connection.";
                break;
            case 'auth/operation-not-allowed':
                errorMessage = "This sign-in method is not enabled. Please contact support.";
                break;
            default:
                if (error.message) {
                    errorMessage = error.message;
                }
                break;
        }

        Alert.alert("Authentication Error", errorMessage);
    };

    // UPDATED: Handle social login - Web only
    const handleSocialLogin = debounce(async (provider) => {
        // Block social login on mobile platforms
        if (Platform.OS !== 'web') {
            Alert.alert(
                "Not Available",
                `${provider.charAt(0).toUpperCase() + provider.slice(1)} Sign-In is only available on web. Please use email/password or guest mode on mobile.`
            );
            return;
        }

        if (isProcessing.current || socialLoading) return;

        try {
            isProcessing.current = true;
            setSocialLoading(provider);
            console.log(`Attempting ${provider} login on web...`);

            let authResult;

            if (provider === "google") {
                authResult = await googleLoginWithDoc();
            } else if (provider === "apple") {
                // Apple Sign-In on web would require additional setup
                Alert.alert("Not Available", "Apple Sign-In is not available on web.");
                return;
            }

            console.log(`${provider} login successful, token stored`);
            await handlePostAuth();

        } catch (error) {
            console.error(`${provider} login error:`, error);

            // Handle user cancellation gracefully
            if (error.cancelled ||
                error.code === 'auth/popup-closed-by-user' ||
                error.message?.includes('cancelled') ||
                error.message?.includes('dismiss')) {
                console.log(`${provider} sign-in was cancelled by user`);
                return;
            }

            let errorMessage = `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in failed.`;

            if (error.message?.includes('not configured')) {
                errorMessage = "Google sign-in is not properly configured. Please check your setup.";
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = "Popup was blocked by browser. Please allow popups and try again.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = "Network error. Please check your internet connection.";
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = "An account with this email already exists. Please try signing in with your email and password.";
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in is not configured. Please contact support.`;
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = "Invalid credentials. Please try again.";
            } else if (error.message?.includes('not available')) {
                errorMessage = error.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert("Social Login Error", errorMessage);
        } finally {
            setSocialLoading(null);
            isProcessing.current = false;
        }
    }, 2000);

    // Handle guest mode
    const handleGuestMode = debounce(async () => {
        if (isProcessing.current) return;

        try {
            isProcessing.current = true;
            console.log('Setting guest mode...');
            setIsGuest(true);

            await AsyncStorage.removeItem(STORAGE_KEYS.USER_LOGGED_IN);

            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } catch (error) {
            console.error('Guest mode error:', error);
            Alert.alert("Error", "Could not enter guest mode. Please try again.");
        } finally {
            isProcessing.current = false;
        }
    });

    const TabButton = ({ title, isActive, onPress }) => (
        <TouchableOpacity
            style={[styles.tabButton, Boolean(isActive) && styles.activeTabButton]}
            onPress={onPress}
            disabled={isLoading || socialLoading}
        >
            <Text style={[styles.tabText, Boolean(isActive) && styles.activeTabText]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    // Social Button Component
    const SocialButton = ({ provider, icon, onPress, disabled }) => {
        const isThisButtonLoading = socialLoading === provider;

        return (
            <TouchableOpacity
                style={[
                    styles.socialButton,
                    provider === 'google' ? styles.googleButton : styles.appleButton,
                    (disabled || socialLoading) && styles.disabledButton
                ]}
                onPress={onPress}
                disabled={disabled || socialLoading || isProcessing.current}
            >
                {isThisButtonLoading ? (
                    <Ionicons name="hourglass" size={20} color="white" />
                ) : (
                    <Ionicons name={icon} size={20} color="white" />
                )}
                <Text style={styles.socialButtonText}>
                    {isThisButtonLoading
                        ? 'Signing in...'
                        : provider.charAt(0).toUpperCase() + provider.slice(1)
                    }
                </Text>
            </TouchableOpacity>
        );
    };

    // Legal Document Modal Component
    const LegalModal = ({ visible, title, content, onClose }) => (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <ScrollView
                    style={styles.modalContent}
                    showsVerticalScrollIndicator={true}
                >
                    <Text style={styles.modalText}>{content}</Text>
                </ScrollView>
                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );

    // Privacy Policy Content
    const privacyPolicyContent = `FARMA PRIVACY POLICY

Last Updated: ${new Date().toLocaleDateString()}

1. INFORMATION WE COLLECT
We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This may include:
• Personal information (name, email address, phone number)
• Farm and agricultural data you input
• Location information (with your permission)
• Device information and usage data

2. HOW WE USE YOUR INFORMATION
We use the information we collect to:
• Provide, maintain, and improve our services
• Send you technical notices and support messages
• Communicate with you about products, services, and events
• Monitor and analyze trends and usage
• Personalize your experience

3. INFORMATION SHARING
We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information:
• With service providers who assist us in operating our app
• To comply with legal obligations
• To protect our rights and prevent fraud
• In connection with a business transfer

4. DATA SECURITY
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. YOUR RIGHTS
You have the right to:
• Access and update your personal information
• Delete your account and data
• Opt out of marketing communications
• Request a copy of your data

6. CHILDREN'S PRIVACY
Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.

7. CHANGES TO THIS POLICY
We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.

8. CONTACT US
If you have questions about this privacy policy, please contact us at:
Email: privacy@farma-app.com


This privacy policy is designed to help you understand how we collect, use, and protect your information when you use FARMA.`;

    // Terms of Service Content
    const termsOfServiceContent = `FARMA TERMS OF SERVICE

Last Updated: ${new Date().toLocaleDateString()}

1. ACCEPTANCE OF TERMS
By downloading, installing, or using the FARMA application, you agree to be bound by these Terms of Service and our Privacy Policy.

2. DESCRIPTION OF SERVICE
FARMA is a digital farm assistant application that provides agricultural tools, information, and services to help farmers and agricultural enthusiasts manage their farming activities.

3. USER ACCOUNTS
• You must provide accurate and complete information when creating an account
• You are responsible for maintaining the security of your account
• You must be at least 13 years old to use our service
• One person or legal entity may maintain no more than one account

4. ACCEPTABLE USE
You agree NOT to use the service to:
• Violate any laws or regulations
• Infringe on intellectual property rights
• Upload malicious code or viruses
• Spam or harass other users
• Share false or misleading information
• Attempt to gain unauthorized access to our systems

5. CONTENT AND DATA
• You retain ownership of the data you input into FARMA
• You grant us a license to use your data to provide and improve our services
• We may use aggregated, anonymized data for research and development
• You are responsible for backing up your important data

6. INTELLECTUAL PROPERTY
• FARMA and its original content are protected by intellectual property laws
• You may not copy, modify, or distribute our proprietary content without permission
• All trademarks and logos are property of their respective owners

7. DISCLAIMER OF WARRANTIES
FARMA is provided "as is" without warranties of any kind. We do not guarantee that:
• The service will be uninterrupted or error-free
• Agricultural advice will be suitable for your specific situation
• Data will be 100% accurate or complete

8. LIMITATION OF LIABILITY
In no event shall FARMA be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.

9. INDEMNIFICATION
You agree to indemnify and hold harmless FARMA from any claims arising from your use of the service or violation of these terms.

10. TERMINATION
We may terminate or suspend your account at any time for violations of these terms. You may delete your account at any time.

11. CHANGES TO TERMS
We reserve the right to modify these terms at any time. We will notify users of significant changes.

12. GOVERNING LAW
These terms are governed by the laws of [Your Jurisdiction] without regard to conflict of law principles.

13. CONTACT INFORMATION
For questions about these terms, contact us at:
Email: legal@farma-app.com


By using FARMA, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.`;

    return (
        <View style={styles.container}>
            <ImageBackground
                source={{
                    uri: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
                }}
                style={styles.background}
            >
                <LinearGradient
                    colors={["rgba(177, 247, 179, 0.8)", "rgba(22, 87, 22, 0.9)"]}
                    style={styles.gradient}
                >
                    <SafeAreaView style={styles.safeArea}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={styles.keyboardView}
                        >
                            <ScrollView
                                contentContainerStyle={[
                                    styles.scrollContainer,
                                    Platform.OS === 'web' && styles.webScrollContainer
                                ]}
                                style={Platform.OS === 'web' ? styles.webScrollView : undefined}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                bounces={Platform.OS !== 'web'}
                                overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
                            >
                                {/* Platform Info (for debugging) */}
                                {__DEV__ && (
                                    <Text style={styles.debugText}>
                                        Platform: {Platform.OS} | Social: {Platform.OS === 'web' ? 'Available' : 'Disabled'}
                                    </Text>
                                )}

                                {/* Logo Section */}
                                <Animated.View
                                    style={[
                                        styles.logoContainer,
                                        {
                                            opacity: fadeAnim,
                                            transform: Platform.OS !== 'web' ? [{ translateY: slideAnim }] : [],
                                        },
                                    ]}
                                >
                                    <View style={styles.logoCircle}>
                                        <Ionicons name="leaf" size={40} color="white" />
                                    </View>
                                    <Text style={styles.logoText}>FARMA</Text>
                                    <Text style={styles.tagline}>
                                        Your Digital Farm Assistant
                                    </Text>
                                </Animated.View>

                                {/* Form Container */}
                                <BlurView intensity={10} style={styles.formContainer}>
                                    <View style={styles.formContent}>
                                        {/* Tabs */}
                                        <View style={styles.tabsContainer}>
                                            <TabButton
                                                title="Login"
                                                isActive={Boolean(isLogin)}
                                                onPress={() => setIsLogin(true)}
                                            />
                                            <TabButton
                                                title="Sign Up"
                                                isActive={Boolean(!isLogin)}
                                                onPress={() => setIsLogin(false)}
                                            />
                                        </View>

                                        {/* Auth Form */}
                                        <Animated.View
                                            style={[
                                                styles.formSection,
                                                {
                                                    opacity: fadeAnim,
                                                    transform: Platform.OS !== 'web' ? [{ translateY: slideAnim }] : [],
                                                },
                                            ]}
                                        >
                                            <View style={styles.headerSection}>
                                                <Text style={styles.welcomeText}>
                                                    {isLogin ? "Welcome Back!" : "Create Account"}
                                                </Text>
                                                <Text style={styles.subText}>
                                                    {isLogin
                                                        ? "Enter your email and password to continue"
                                                        : "Join FARMA today and start your farming journey"}
                                                </Text>
                                            </View>

                                            {/* Email Input */}
                                            <View style={styles.inputContainer}>
                                                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Email"
                                                    value={email}
                                                    onChangeText={setEmail}
                                                    autoCapitalize="none"
                                                    keyboardType="email-address"
                                                    placeholderTextColor="#999"
                                                    editable={!isLoading && !socialLoading}
                                                    autoCorrect={false}
                                                    returnKeyType="next"
                                                />
                                            </View>

                                            {/* Password Input */}
                                            <View style={styles.inputContainer}>
                                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                                <TextInput
                                                    style={[styles.input, { paddingRight: 50 }]}
                                                    placeholder="Password"
                                                    value={password}
                                                    onChangeText={setPassword}
                                                    secureTextEntry={!showPassword}
                                                    placeholderTextColor="#999"
                                                    editable={!isLoading && !socialLoading}
                                                    autoCorrect={false}
                                                    returnKeyType="done"
                                                    onSubmitEditing={handleAuth}
                                                />
                                                <TouchableOpacity
                                                    style={styles.passwordToggle}
                                                    onPress={() => setShowPassword(!showPassword)}
                                                >
                                                    <Ionicons
                                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                        size={20}
                                                        color="#666"
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Login/Signup Button */}
                                            <TouchableOpacity
                                                style={[styles.button, (isLoading || socialLoading) && styles.disabledButton]}
                                                onPress={handleAuth}
                                                disabled={isLoading || socialLoading || isProcessing.current}
                                            >
                                                {isLoading ? (
                                                    <View style={styles.loadingContainer}>
                                                        <Ionicons name="hourglass" size={20} color="#fff" />
                                                        <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                                                            Please wait...
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <Text style={styles.buttonText}>
                                                        {isLogin ? "Login" : "Sign Up"}
                                                    </Text>
                                                )}
                                            </TouchableOpacity>

                                            {/* UPDATED: Social Login Section - Web Only */}
                                            {Platform.OS === 'web' && (
                                                <View style={styles.socialContainer}>
                                                    <View style={styles.dividerContainer}>
                                                        <View style={styles.dividerLine} />
                                                        <Text style={styles.orText}>Or continue with</Text>
                                                        <View style={styles.dividerLine} />
                                                    </View>

                                                    <View style={styles.socialButtonsContainer}>
                                                        <SocialButton
                                                            provider="google"
                                                            icon="logo-google"
                                                            onPress={() => handleSocialLogin("google")}
                                                            disabled={isLoading || socialLoading}
                                                        />
                                                    </View>
                                                </View>
                                            )}

                                            {/* Mobile Info Message */}
                                            {Platform.OS !== 'web' && (
                                                <View style={styles.mobileInfoContainer}>
                                                    <Ionicons name="information-circle-outline" size={16} color="#666" />
                                                    <Text style={styles.mobileInfoText}>
                                                        Social login available on web. Use email/password or guest mode on mobile.
                                                    </Text>
                                                </View>
                                            )}

                                            {/* Guest Mode Button */}
                                            <TouchableOpacity
                                                style={[styles.guestButton, (isLoading || socialLoading) && styles.disabledButton]}
                                                onPress={handleGuestMode}
                                                disabled={isLoading || socialLoading || isProcessing.current}
                                            >
                                                <Ionicons name="person-outline" size={20} color="#4CAF50" />
                                                <Text style={styles.guestText}>Continue as Guest</Text>
                                            </TouchableOpacity>

                                            {/* Forgot Password (Login only) */}
                                            {isLogin && (
                                                <TouchableOpacity
                                                    style={styles.forgotPassword}
                                                    onPress={() => Alert.alert("Forgot Password", "Password reset functionality coming soon!")}
                                                >
                                                    <Text style={styles.forgotPasswordText}>
                                                        Forgot Password?
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </Animated.View>
                                    </View>
                                </BlurView>

                                {/* Footer */}
                                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                                    <Text style={styles.footerText}>
                                        By continuing, you agree to our{" "}
                                        <Text
                                            style={styles.linkText}
                                            onPress={() => setShowTermsModal(true)}
                                        >
                                            Terms of Service
                                        </Text>
                                        {" "}and{" "}
                                        <Text
                                            style={styles.linkText}
                                            onPress={() => setShowPrivacyModal(true)}
                                        >
                                            Privacy Policy
                                        </Text>
                                    </Text>
                                </Animated.View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </LinearGradient>
            </ImageBackground>

            {/* Privacy Policy Modal */}
            <LegalModal
                visible={showPrivacyModal}
                title="Privacy Policy"
                content={privacyPolicyContent}
                onClose={() => setShowPrivacyModal(false)}
            />

            {/* Terms of Service Modal */}
            <LegalModal
                visible={showTermsModal}
                title="Terms of Service"
                content={termsOfServiceContent}
                onClose={() => setShowTermsModal(false)}
            />
        </View>
    );
};

// Complete Styles
const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    background: {
        flex: 1
    },
    gradient: {
        flex: 1
    },
    safeArea: {
        flex: 1
    },
    keyboardView: {
        flex: 1
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
        minHeight: height - 100,
    },
    // Web-specific scroll styles
    webScrollView: {
        height: '100vh', // Full viewport height
    },
    webScrollContainer: {
        minHeight: '100%', // Ensure content can fill the view
        justifyContent: 'flex-start', // Start from top instead of center
        paddingVertical: 40, // Add top/bottom padding for better spacing
    },

    // Debug text
    debugText: {
        color: 'white',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 10,
        opacity: 0.7,
    },

    // Logo Section
    logoContainer: {
        alignItems: "center",
        marginBottom: 40
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
    },
    logoText: {
        fontSize: 42,
        fontWeight: "bold",
        color: "white",
        letterSpacing: 2,
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    tagline: {
        fontSize: 16,
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
        marginTop: 8,
        fontWeight: "300",
    },

    // Form Container
    formContainer: {
        borderRadius: 25,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.95)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
        elevation: 15,
        // Web-specific: ensure form doesn't get too wide on large screens
        ...(Platform.OS === 'web' && {
            maxWidth: 500,
            alignSelf: 'center',
            width: '100%',
        }),
    },
    formContent: {
        padding: 30
    },

    // Tabs
    tabsContainer: {
        flexDirection: "row",
        backgroundColor: "#f5f5f5",
        borderRadius: 15,
        padding: 4,
        marginBottom: 30,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        borderRadius: 12,
    },
    activeTabButton: {
        backgroundColor: "#4CAF50",
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    tabText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666"
    },
    activeTabText: {
        color: "white"
    },

    // Form Section
    formSection: {
        marginBottom: 20
    },
    headerSection: {
        marginBottom: 30,
        alignItems: "center"
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 22
    },

    // Input Fields
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 12,
        marginBottom: 15,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    inputIcon: {
        marginLeft: 15,
        marginRight: 10,
    },
    input: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        color: "#333",
        // Web-specific: Improve focus styles
        ...(Platform.OS === 'web' && {
            outlineStyle: 'none',
        }),
    },
    passwordToggle: {
        position: 'absolute',
        right: 15,
        padding: 5,
    },

    // Buttons
    button: {
        backgroundColor: "green",
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        // Web-specific: Add cursor pointer
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    disabledButton: {
        backgroundColor: "#ccc",
        shadowOpacity: 0,
        elevation: 0,
        // Web-specific: Show disabled cursor
        ...(Platform.OS === 'web' && {
            cursor: 'not-allowed',
        }),
    },
    buttonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 16
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Social Login
    socialContainer: {
        marginVertical: 20,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    orText: {
        textAlign: "center",
        color: "#666",
        fontSize: 14,
        marginHorizontal: 15,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
    socialButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 200,
        // Web-specific: Add cursor pointer
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    googleButton: {
        backgroundColor: "#DB4437",
    },
    appleButton: {
        backgroundColor: "#000",
    },
    socialButtonText: {
        color: "white",
        fontWeight: "600",
        marginLeft: 8,
        fontSize: 14,
    },

    // ADDED: Mobile info container
    mobileInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginVertical: 15,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.2)',
    },

    mobileInfoText: {
        flex: 1,
        fontSize: 12,
        color: '#666',
        marginLeft: 8,
        lineHeight: 16,
    },

    // Guest Button
    guestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#4CAF50",
        backgroundColor: "rgba(74, 175, 80, 0.1)",
        // Web-specific: Add cursor pointer
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    guestText: {
        textAlign: "center",
        color: "#4CAF50",
        fontWeight: "600",
        fontSize: 16,
        marginLeft: 8,
    },

    // Forgot Password
    forgotPassword: {
        alignItems: 'center',
        marginTop: 10,
        // Web-specific: Add cursor pointer
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },
    forgotPasswordText: {
        color: "#4CAF50",
        fontSize: 14,
        fontWeight: "500",
    },

    // Footer
    footer: {
        marginTop: 30,
        alignItems: "center"
    },
    footerText: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
        textAlign: "center",
        lineHeight: 18,
    },
    linkText: {
        fontWeight: "600",
        textDecorationLine: "underline",
        // Web-specific: Add cursor pointer
        ...(Platform.OS === 'web' && {
            cursor: 'pointer',
        }),
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f8f9fa',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    modalText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#444',
        textAlign: 'left',
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#f8f9fa',
    },
    modalCloseButton: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LoginScreen;