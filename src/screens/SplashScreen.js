import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotation.value}deg` }
    ],
  }));

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const startAnimations = () => {
    // Background fade in
    backgroundOpacity.value = withTiming(1, { duration: 500 });

    // Logo scale and rotate animation
    logoScale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 100 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );

    logoRotation.value = withTiming(360, { duration: 1000 });

    // Title fade in
    titleOpacity.value = withTiming(1, { duration: 800, delay: 600 });

    // Subtitle fade in
    subtitleOpacity.value = withTiming(1, { duration: 800, delay: 800 });
  };

  useEffect(() => {
    startAnimations();

    // ⏳ Call onFinish after 5 seconds
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <Animated.View style={[styles.backgroundGradient, animatedBackgroundStyle]} />

      {/* Decorative elements */}
      <View style={styles.decorativeElements}>
        {[...Array(6)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.leaf,
              {
                left: (width * (0.1 + index * 0.15)),
                top: height * (0.1 + (index % 2) * 0.8),
                transform: [
                  { rotate: `${index * 30}deg` },
                  { scale: 0.5 + (index % 3) * 0.3 }
                ]
              },
              animatedBackgroundStyle
            ]}
          >
            <Ionicons
              name="leaf"
              size={20}
              color="rgba(168, 200, 168, 0.3)"
            />
          </Animated.View>
        ))}
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
          <View style={styles.logoBackground}>
            <Ionicons name="leaf-outline" size={64} color="#4A7C59" />
          </View>
        </Animated.View>

        {/* App Title */}
        <Animated.Text style={[styles.title, animatedTitleStyle]}>
          FARMA
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, animatedSubtitleStyle]}>
          Plant & Disease Detection for Farmers
        </Animated.Text>

        {/* Loading indicator */}
        <Animated.View style={[styles.loadingContainer, animatedSubtitleStyle]}>
          <View style={styles.loadingDots}>
            {[...Array(3)].map((_, index) => (
              <View key={index} style={styles.dot} />
            ))}
          </View>
        </Animated.View>
      </View>

      {/* Bottom branding */}
      <Animated.View style={[styles.bottomContainer, animatedSubtitleStyle]}>
        <Text style={styles.tagline}>Empowering Farmers with AI</Text>
        <View style={styles.versionContainer}>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E8F5E8',
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  leaf: {
    position: 'absolute',
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBackground: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A7C59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C5530',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7C6B',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
    maxWidth: 280,
  },
  loadingContainer: {
    marginTop: 24,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A7C59',
    opacity: 0.7,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  versionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(74, 124, 89, 0.1)',
    borderRadius: 12,
  },
  version: {
    fontSize: 12,
    color: '#4A7C59',
    fontWeight: '600',
  },
});

export default SplashScreen;
