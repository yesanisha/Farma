import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { responsiveDimensions } from '../utils/responsive';

const ScanButton = ({ onPress }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );

    rotation.value = withSequence(
      withSpring(5, { damping: 15, stiffness: 200 }),
      withSpring(-5, { damping: 15, stiffness: 200 }),
      withSpring(0, { damping: 15, stiffness: 200 })
    );

    onPress?.();
  };

  const semicircleWidth = responsiveDimensions.getSemicircleWidth();

  return (
    <>
      {/* Enhanced Semicircle with navigation items */}
      <Animated.View style={styles.semicircleContainer}>
        <Animated.View style={[styles.semicircle, { width: semicircleWidth, borderTopLeftRadius: semicircleWidth / 2, borderTopRightRadius: semicircleWidth / 2 }]}>
          {/* Navigation items inside semicircle */}
          <View style={styles.navContainer}>
            <TouchableOpacity style={styles.navItem}>
              <View style={styles.navIcon}>
                <Ionicons name="finger-print" size={20} color="#4A7C59" />
              </View>
              <Text style={styles.navLabel}>Click</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={onPress}>
              <View style={styles.navIcon}>
                <Ionicons name="scan" size={20} color="#4A7C59" />
              </View>
              <Text style={styles.navLabel}>Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <View style={styles.navIcon}>
                <Ionicons name="medical" size={20} color="#4A7C59" />
              </View>
              <Text style={styles.navLabel}>Diagnose</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <View style={styles.navIcon}>
                <Ionicons name="leaf" size={20} color="#4A7C59" />
              </View>
              <Text style={styles.navLabel}>Healthy-fy</Text>
            </TouchableOpacity>
          </View>

          {/* Motivational text */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>So that you do not lose</Text>
            <Text style={styles.messageText}>a new friend for home</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Enhanced Scan button */}
      <Animated.View style={[styles.container, animatedStyle]}>
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="scan" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  semicircleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 999,
    pointerEvents: 'box-none',
  },
  semicircle: {
    height: 180,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A7C59',
    textAlign: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  messageText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  container: {
    position: 'absolute',
    bottom: 130,
    alignSelf: 'center',
    zIndex: 1000,
  },
  button: {
    backgroundColor: '#4A7C59',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A7C59',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});

export default ScanButton;