import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, BounceIn } from 'react-native-reanimated';

const FavoritesEmptyState = () => {
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeInUp.delay(200).duration(600)}
    >
      <Animated.View 
        style={styles.iconContainer}
        entering={BounceIn.delay(400).duration(1000)}
      >
        <Ionicons name="heart-outline" size={64} color="#FFB3BA" />
      </Animated.View>
      
      <Text style={styles.title}>Add a plant</Text>
      <Text style={styles.subtitle}>To favorites</Text>
      
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>So that you do not lose</Text>
        <Text style={styles.description}>a new friend for home</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    backgroundColor: '#FFF0F0',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 24,
  },
  descriptionContainer: {
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default FavoritesEmptyState;