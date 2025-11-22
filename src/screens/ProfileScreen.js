import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import localAuth from "../services/localAuth";
import localDatabase from "../services/localDatabase";
import StorageService from "../services/storage";

const ProfileScreen = ({ navigation, isGuest, setIsGuest }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [isGuest]);

  const loadUserData = async () => {
    try {
      const currentUser = localAuth.getCurrentUser();
      setUser(currentUser);

      if (currentUser && !isGuest) {
        const userData = await localDatabase.getUserData();
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      console.log('Logging out user...');

      await localAuth.signOut();

      // Reset guest state if applicable
      if (setIsGuest) {
        setIsGuest(false);
      }

      console.log('Logout successful');
      navigation.replace("LoginScreen");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isGuest) {
      Alert.alert("Error", "Guest users cannot delete accounts.");
      return;
    }

    Alert.alert(
      "Delete Account",
      "This will PERMANENTLY delete your account and all associated data.\n\nThis action CANNOT be undone!\n\nAre you absolutely certain?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "DELETE FOREVER",
          style: "destructive",
          onPress: performAccountDeletion,
        },
      ]
    );
  };

  const performAccountDeletion = async () => {
    setLoading(true);

    try {
      const currentUser = localAuth.getCurrentUser();
      if (!currentUser) {
        Alert.alert("Error", "No user is currently signed in.");
        return;
      }

      console.log('Starting account deletion process...');

      // Clear all user data
      await localDatabase.clearAllUserData();

      // Clear additional storage
      await StorageService.removeItem('plant_favorites');
      await StorageService.removeItem('scan_history');

      // Sign out
      await localAuth.signOut();

      // Reset guest state
      if (setIsGuest) {
        setIsGuest(false);
      }

      console.log('Account deletion completed');

      Alert.alert(
        "Account Deleted",
        "Your account and all data have been permanently deleted.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.replace("LoginScreen");
            },
          },
        ]
      );

    } catch (error) {
      console.error("Delete account error:", error);
      Alert.alert("Delete Account Issue", "Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    Alert.alert("Edit Profile", "This feature will allow editing profile details in a future update.");
  };

  const getUserDisplayName = () => {
    if (isGuest) return "Guest User";
    if (userProfile?.name) return userProfile.name;
    if (user?.displayName) return user.displayName;
    return "User";
  };

  const getUserEmail = () => {
    if (isGuest) return "guest@farma.app";
    return user?.email || "No email available";
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/1.jpg")}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.innerContainer}>
          <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Profile Info */}
            <View style={styles.profileCard}>
              <Image
                source={{
                  uri: user?.photoURL || "https://ui-avatars.com/api/?name=" + getUserDisplayName() + "&background=4A7C59&color=fff"
                }}
                style={styles.avatar}
              />
              <Text style={styles.name}>{getUserDisplayName()}</Text>
              <Text style={styles.email}>{getUserEmail()}</Text>

              {userProfile?.location && (
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={16} color="#8E8E93" />
                  <Text style={styles.locationText}>
                    {userProfile.locationAddress || "Location set"}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Ionicons name="create-outline" size={18} color="#1C1C1E" />
                <Text style={styles.editText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Stats */}
            {!isGuest && userProfile && (
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{userProfile.total_scans || 0}</Text>
                  <Text style={styles.statLabel}>Total Scans</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {userProfile.detected_diseases?.length || 0}
                  </Text>
                  <Text style={styles.statLabel}>Diseases Detected</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {userProfile.setupCompletedAt ?
                      Math.floor((Date.now() - new Date(userProfile.setupCompletedAt).getTime()) / (1000 * 60 * 60 * 24))
                      : 0}
                  </Text>
                  <Text style={styles.statLabel}>Days Active</Text>
                </View>
              </View>
            )}

            {/* Backend Info Card */}
            <View style={styles.backendCard}>
              <Ionicons name="sparkles" size={24} color="#4A7C59" />
              <View style={styles.backendInfo}>
                <Text style={styles.backendTitle}>Powered by Gemini AI</Text>
                <Text style={styles.backendText}>Using local storage for your data</Text>
              </View>
            </View>

            {/* Settings Options */}
            <View style={styles.settingsList}>
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="notifications-outline" size={22} color="#1C1C1E" />
                <Text style={styles.settingText}>Notifications</Text>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="lock-closed-outline" size={22} color="#1C1C1E" />
                <Text style={styles.settingText}>Privacy</Text>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="color-palette-outline" size={22} color="#1C1C1E" />
                <Text style={styles.settingText}>Appearance</Text>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => navigation.navigate("History")}
              >
                <Ionicons name="time-outline" size={22} color="#1C1C1E" />
                <Text style={styles.settingText}>Scan History</Text>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="help-circle-outline" size={22} color="#1C1C1E" />
                <Text style={styles.settingText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.logoutButton, loading && styles.disabledButton]}
                onPress={handleLogout}
                disabled={loading}
              >
                <Ionicons name="log-out-outline" size={20} color={loading ? "#ccc" : "#FF3B30"} />
                <Text style={[styles.logoutText, loading && { color: "#ccc" }]}>
                  {loading ? "Logging out..." : "Logout"}
                </Text>
              </TouchableOpacity>

              {!isGuest && (
                <TouchableOpacity
                  style={[styles.deleteButton, loading && styles.disabledButton]}
                  onPress={handleDeleteAccount}
                  disabled={loading}
                >
                  <Ionicons name="trash-outline" size={20} color={loading ? "#ccc" : "#FF3B30"} />
                  <Text style={[styles.deleteText, loading && { color: "#ccc" }]}>
                    {loading ? "Deleting..." : "Delete Account"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: { flex: 1 },
  bgImage: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255, 255, 255, 0.95)" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1C1C1E" },
  placeholder: { width: 24 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  profileCard: {
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: "700", color: "#1C1C1E", marginBottom: 4 },
  email: { fontSize: 14, color: "#8E8E93", marginBottom: 8 },
  locationInfo: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  locationText: { marginLeft: 4, fontSize: 14, color: "#8E8E93" },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  editText: { marginLeft: 6, color: "#1C1C1E", fontWeight: "500" },

  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#4A7C59" },
  statLabel: { fontSize: 12, color: "#8E8E93", marginTop: 4 },
  statDivider: { width: 1, backgroundColor: "#E5E5EA", marginHorizontal: 16 },

  backendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#4A7C59",
  },
  backendInfo: { marginLeft: 12, flex: 1 },
  backendTitle: { fontSize: 16, fontWeight: "600", color: "#4A7C59" },
  backendText: { fontSize: 12, color: "#6B8E6B", marginTop: 2 },

  settingsList: { marginBottom: 20 },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  settingText: { marginLeft: 12, fontSize: 16, color: "#1C1C1E", flex: 1 },

  actionButtons: { gap: 12 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFECEC",
    paddingVertical: 14,
    justifyContent: "center",
    borderRadius: 12,
  },
  logoutText: { fontSize: 16, fontWeight: "500", color: "#FF3B30", marginLeft: 8 },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    paddingVertical: 14,
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD6D6",
  },
  deleteText: { fontSize: 16, fontWeight: "500", color: "#FF3B30", marginLeft: 8 },

  disabledButton: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
});

export default ProfileScreen;
