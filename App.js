import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from "./src/services/auth";

import SplashScreenComponent from "./src/screens/SplashScreen";
import HomeScreen from "./src/screens/HomeScreen";
import PlantGalleryScreen from "./src/screens/PlantGalleryScreen";
import PlantDetailScreen from "./src/screens/PlantDetailScreen";
import ScanScreen from "./src/screens/ScanScreen";
import ScanResultsScreen from "./src/screens/ScanResults";
import ProfileScreen from "./src/screens/ProfileScreen";
import DiseaseDetailScreen from "./src/screens/DiseaseDetailScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SetupScreen from "./src/screens/SetupScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import ChatBotScreen from "./src/components/ChatBotScreen";

import { FavoritesProvider } from "./src/context/FavoritesContext";
import { NotificationProvider } from "./src/context/NotificationContext";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Storage keys for persistence
const STORAGE_KEYS = {
  USER_LOGGED_IN: 'user_logged_in',
  CACHED_PLANTS: 'cached_plants',
  APP_FIRST_LAUNCH: 'app_first_launch',
  USER_PREFERENCES: 'user_preferences'
};

// Bottom Tabs Component
const MainTabs = ({ isGuest, setIsGuest }) => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === "Home") iconName = focused ? "home" : "home-outline";
        else if (route.name === "Gallery") iconName = focused ? "grid" : "grid-outline";
        else if (route.name === "Scan") iconName = focused ? "scan" : "scan-outline";
        else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#4A7C59",
      tabBarInactiveTintColor: "#8E8E93",
      tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
      tabBarStyle: {
        backgroundColor: "#fff",
        borderTopColor: "#E5E5EA",
        height: 85,
        paddingBottom: 25,
        paddingTop: 8,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Gallery" component={PlantGalleryScreen} />
    <Tab.Screen name="Scan" component={ScanScreen} />
    <Tab.Screen name="Profile">
      {(props) => (
        <ProfileScreen
          {...props}
          isGuest={isGuest}
          setIsGuest={setIsGuest}
        />
      )}
    </Tab.Screen>

    {/* Hidden tab for History (not shown in bottom bar) */}
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{ tabBarButton: () => null }}
    />
  </Tab.Navigator>
);

// Main App Component
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Initialize app state on startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');

        // Check if user has logged in before
        const hasLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.USER_LOGGED_IN);
        const isFirstLaunch = await AsyncStorage.getItem(STORAGE_KEYS.APP_FIRST_LAUNCH);

        console.log('Has logged in before:', hasLoggedIn);
        console.log('Is first launch:', isFirstLaunch);

        setHasLoggedInBefore(hasLoggedIn === 'true');

        // Mark that app has been launched before
        if (isFirstLaunch === null) {
          await AsyncStorage.setItem(STORAGE_KEYS.APP_FIRST_LAUNCH, 'false');
        }

      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // Local auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log('Auth state changed:', currentUser ? 'User logged in' : 'No user');

      setUser(currentUser);

      if (currentUser) {
        // User is authenticated - save login state
        await AsyncStorage.setItem(STORAGE_KEYS.USER_LOGGED_IN, 'true');
        setHasLoggedInBefore(true);
        console.log('User login state saved');
      }

      setAuthChecked(true);
    });

    return unsubscribe;
  }, []);

  // Handle splash screen timing
  useEffect(() => {
    if (!isInitializing && authChecked) {
      const timer = setTimeout(() => {
        console.log('Splash screen finishing...');
        setShowSplash(false);
      }, 2500); // Show splash for 2.5 seconds

      return () => clearTimeout(timer);
    }
  }, [isInitializing, authChecked]);

  // Show splash screen while initializing
  if (showSplash || isInitializing || !authChecked) {
    return <SplashScreenComponent onFinish={() => setShowSplash(false)} />;
  }

  // Determine navigation flow
  const shouldShowLogin = () => {
    // Show login only if:
    // 1. No authenticated user AND
    // 2. Not a guest AND  
    // 3. User has never logged in before
    return !user && !isGuest && !hasLoggedInBefore;
  };

  console.log('Navigation decision:', {
    user: !!user,
    isGuest,
    hasLoggedInBefore,
    shouldShowLogin: shouldShowLogin()
  });

  return (
    <FavoritesProvider>
      <NotificationProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={shouldShowLogin() ? "Login" : "MainTabs"}
          >

            {/* Authentication Flow */}
            {shouldShowLogin() && (
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen
                    {...props}
                    setIsGuest={setIsGuest}
                    onLoginSuccess={() => setHasLoggedInBefore(true)}
                  />
                )}
              </Stack.Screen>
            )}

            {/* Login Screen - Always available for navigation */}
            <Stack.Screen name="LoginScreen">
              {(props) => (
                <LoginScreen
                  {...props}
                  setIsGuest={setIsGuest}
                  onLoginSuccess={() => setHasLoggedInBefore(true)}
                />
              )}
            </Stack.Screen>

            {/* Setup Screen */}
            <Stack.Screen name="SetupScreen" component={SetupScreen} />


            {/* Main App Flow */}
            <Stack.Screen name="MainTabs">
              {(props) => (
                <MainTabs
                  {...props}
                  isGuest={isGuest}
                  setIsGuest={setIsGuest}
                />
              )}
            </Stack.Screen>

            {/* Detail Screens */}
            <Stack.Screen
              name="PlantDetail"
              component={PlantDetailScreen}
              options={{
                headerShown: true,
                headerBackTitleVisible: false,
                headerTitle: "Plant Details",
                headerStyle: { backgroundColor: "#4A7C59" },
                headerTintColor: "#fff"
              }}
            />

            <Stack.Screen
              name="DiseaseDetail"
              component={DiseaseDetailScreen}
              options={{
                headerShown: true,
                headerBackTitleVisible: false,
                headerTitle: "Disease Details",
                headerStyle: { backgroundColor: "#4A7C59" },
                headerTintColor: "#fff"
              }}
            />

            {/* Scan Results Screen */}
            <Stack.Screen
              name="ScanResults"
              component={ScanResultsScreen}
              options={{
                headerShown: true,
                headerBackTitleVisible: false,
                headerTitle: "Scan Results",
                headerStyle: { backgroundColor: "#4A7C59" },
                headerTintColor: "#fff"
              }}
            />

            {/* ChatBot Screen */}
            <Stack.Screen
              name="ChatBot"
              component={ChatBotScreen}
              options={{
                headerShown: true,
                headerBackTitleVisible: false,
                headerTitle: "Farm Assistant",
                headerStyle: { backgroundColor: "#4A7C59" },
                headerTintColor: "#fff"
              }}
            />

          </Stack.Navigator>
        </NavigationContainer>
      </NotificationProvider>
    </FavoritesProvider>
  );
}