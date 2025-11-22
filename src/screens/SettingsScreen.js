import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ImageBackground,
    TouchableOpacity,
    Switch,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <ImageBackground
                source={require('../../assets/1.jpg')} // adjust path
                style={styles.bgImage}
                resizeMode="cover"
            >
                <View style={styles.overlay} />
                <SafeAreaView style={styles.container}>
                    <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Notifications */}
                        <View style={styles.settingItem}>
                            <Text style={styles.settingText}>Enable Notifications</Text>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                            />
                        </View>

                        {/* Dark Mode */}
                        <View style={styles.settingItem}>
                            <Text style={styles.settingText}>Dark Mode</Text>
                            <Switch
                                value={darkModeEnabled}
                                onValueChange={setDarkModeEnabled}
                            />
                        </View>

                        {/* Privacy */}
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={styles.settingText}>Privacy Policy</Text>
                            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                        </TouchableOpacity>

                        {/* Terms */}
                        <TouchableOpacity style={styles.settingItem}>
                            <Text style={styles.settingText}>Terms & Conditions</Text>
                            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </ImageBackground>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bgImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backButton: {
        padding: 6,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    placeholder: {
        width: 24,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    settingText: {
        fontSize: 16,
        color: '#1C1C1E',
    },
});

export default SettingsScreen;
