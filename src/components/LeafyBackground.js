import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const LeafyBackground = () => {
    // Create animated values for different leaf animations
    const leaf1Rotation = useSharedValue(0);
    const leaf2Scale = useSharedValue(1);
    const leaf3Opacity = useSharedValue(0.3);
    const leaf4Translation = useSharedValue(0);

    React.useEffect(() => {
        // Subtle rotating animation for leaf 1
        leaf1Rotation.value = withRepeat(
            withTiming(360, { duration: 20000 }),
            -1,
            false
        );

        // Gentle scaling animation for leaf 2
        leaf2Scale.value = withRepeat(
            withTiming(1.1, { duration: 8000 }),
            -1,
            true
        );

        // Fade in/out animation for leaf 3
        leaf3Opacity.value = withRepeat(
            withTiming(0.6, { duration: 6000 }),
            -1,
            true
        );

        // Subtle floating animation for leaf 4
        leaf4Translation.value = withRepeat(
            withTiming(10, { duration: 4000 }),
            -1,
            true
        );
    }, []);

    const leaf1AnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${leaf1Rotation.value}deg` }],
    }));

    const leaf2AnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: leaf2Scale.value }],
    }));

    const leaf3AnimatedStyle = useAnimatedStyle(() => ({
        opacity: leaf3Opacity.value,
    }));

    const leaf4AnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: leaf4Translation.value }],
    }));

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Top left decorative leaves */}
            <Animated.View style={[styles.leafContainer, styles.topLeft, leaf1AnimatedStyle]}>
                <Ionicons name="leaf" size={24} color="rgba(168, 200, 168, 0.15)" />
            </Animated.View>

            <View style={[styles.leafContainer, styles.topLeft2]}>
                <Ionicons name="leaf" size={18} color="rgba(168, 200, 168, 0.1)" />
            </View>

            {/* Top right decorative leaves */}
            <Animated.View style={[styles.leafContainer, styles.topRight, leaf2AnimatedStyle]}>
                <Ionicons name="leaf" size={20} color="rgba(168, 200, 168, 0.12)" />
            </Animated.View>

            <View style={[styles.leafContainer, styles.topRight2]}>
                <Ionicons name="leaf" size={16} color="rgba(168, 200, 168, 0.08)" />
            </View>

            {/* Middle left decorative leaves */}
            <Animated.View style={[styles.leafContainer, styles.middleLeft, leaf3AnimatedStyle]}>
                <Ionicons name="leaf" size={22} color="rgba(168, 200, 168, 0.2)" />
            </Animated.View>

            <View style={[styles.leafContainer, styles.middleLeft2]}>
                <Ionicons name="leaf" size={14} color="rgba(168, 200, 168, 0.06)" />
            </View>

            {/* Middle right decorative leaves */}
            <Animated.View style={[styles.leafContainer, styles.middleRight, leaf4AnimatedStyle]}>
                <Ionicons name="leaf" size={19} color="rgba(168, 200, 168, 0.14)" />
            </Animated.View>

            <View style={[styles.leafContainer, styles.middleRight2]}>
                <Ionicons name="leaf" size={26} color="rgba(168, 200, 168, 0.1)" />
            </View>

            {/* Bottom decorative leaves (scattered) */}
            <View style={[styles.leafContainer, styles.bottomLeft]}>
                <Ionicons name="leaf" size={15} color="rgba(168, 200, 168, 0.08)" />
            </View>

            <View style={[styles.leafContainer, styles.bottomCenter]}>
                <Ionicons name="leaf" size={21} color="rgba(168, 200, 168, 0.12)" />
            </View>

            <View style={[styles.leafContainer, styles.bottomRight]}>
                <Ionicons name="leaf" size={17} color="rgba(168, 200, 168, 0.09)" />
            </View>

            {/* Additional scattered leaves for richness */}
            <View style={[styles.leafContainer, styles.scattered1]}>
                <Ionicons name="leaf" size={12} color="rgba(168, 200, 168, 0.05)" />
            </View>

            <View style={[styles.leafContainer, styles.scattered2]}>
                <Ionicons name="leaf" size={28} color="rgba(168, 200, 168, 0.08)" />
            </View>

            <View style={[styles.leafContainer, styles.scattered3]}>
                <Ionicons name="leaf" size={16} color="rgba(168, 200, 168, 0.06)" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    leafContainer: {
        position: 'absolute',
    },
    // Top positioned leaves
    topLeft: {
        top: '8%',
        left: '5%',
        transform: [{ rotate: '15deg' }],
    },
    topLeft2: {
        top: '12%',
        left: '12%',
        transform: [{ rotate: '-25deg' }],
    },
    topRight: {
        top: '6%',
        right: '8%',
        transform: [{ rotate: '45deg' }],
    },
    topRight2: {
        top: '15%',
        right: '4%',
        transform: [{ rotate: '-15deg' }],
    },
    // Middle positioned leaves
    middleLeft: {
        top: '35%',
        left: '3%',
        transform: [{ rotate: '75deg' }],
    },
    middleLeft2: {
        top: '42%',
        left: '8%',
        transform: [{ rotate: '-45deg' }],
    },
    middleRight: {
        top: '38%',
        right: '6%',
        transform: [{ rotate: '120deg' }],
    },
    middleRight2: {
        top: '30%',
        right: '12%',
        transform: [{ rotate: '-60deg' }],
    },
    // Bottom positioned leaves
    bottomLeft: {
        bottom: '25%',
        left: '4%',
        transform: [{ rotate: '30deg' }],
    },
    bottomCenter: {
        bottom: '28%',
        left: '45%',
        transform: [{ rotate: '-75deg' }],
    },
    bottomRight: {
        bottom: '22%',
        right: '8%',
        transform: [{ rotate: '90deg' }],
    },
    // Scattered leaves for natural look
    scattered1: {
        top: '25%',
        left: '25%',
        transform: [{ rotate: '135deg' }],
    },
    scattered2: {
        top: '55%',
        right: '25%',
        transform: [{ rotate: '-30deg' }],
    },
    scattered3: {
        top: '65%',
        left: '15%',
        transform: [{ rotate: '60deg' }],
    },
});

export default LeafyBackground;