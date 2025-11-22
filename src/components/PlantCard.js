import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { useFavorites } from '../context/FavoritesContext';
import { responsiveDimensions, responsiveFonts } from '../utils/responsive';

// Heart animation
const FloatingHeart = ({ onComplete }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  translateY.value = withTiming(-40, { duration: 600, easing: Easing.out(Easing.quad) });
  opacity.value = withTiming(0, { duration: 600 });
  scale.value = withSpring(1.2, {}, () => {
    scale.value = withSpring(1);
  });

  // Remove heart after animation
  setTimeout(onComplete, 600);

  return (
    <Animated.View style={[styles.floatingHeart, animatedStyle]}>
      <Ionicons name="heart" size={16} color="#FF3B30" />
    </Animated.View>
  );
};

const PlantCard = ({ plant, onPress }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  // Get plant ID consistently
  const plantId = plant.plant_id || plant.id;
  const isLiked = isFavorite(plantId);

  const [floatingHearts, setFloatingHearts] = useState([]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handleFavoritePress = () => {
    // Pass complete plant object instead of just ID
    const plantDataForFavorites = {
      ...plant,
      plant_id: plantId, // Ensure consistent ID field
      id: plantId, // Keep both for compatibility
      name: plant.common_name || plant.name || 'Unknown Plant',
    };

    console.log('Toggling favorite for plant:', plantDataForFavorites.name, 'ID:', plantId);
    toggleFavorite(plantDataForFavorites);

    heartScale.value = withSpring(1.3, { damping: 10, stiffness: 300 }, () => {
      heartScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });

    if (!isLiked) {
      const id = Date.now();
      setFloatingHearts(prev => [...prev, id]);
    }
  };

  const removeHeart = (id) => {
    setFloatingHearts(prev => prev.filter(h => h !== id));
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const cardWidth = responsiveDimensions.getCardWidth();
  const cardHeight = responsiveDimensions.getCardHeight();
  const imageHeight = responsiveDimensions.getCardImageHeight();

  return (
    <Animated.View style={[styles.container, cardAnimatedStyle, { width: cardWidth, height: cardHeight }]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <Image
            source={
              plant.image_url
                ? { uri: plant.image_url }
                : require("../../assets/placeholder-plant.png") // add a local placeholder
            }
            style={styles.image}
            resizeMode="cover"
          />

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View style={heartAnimatedStyle}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? "#FF3B30" : "#8E8E93"}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Floating hearts */}
          {floatingHearts.map(id => (
            <FloatingHeart key={id} onComplete={() => removeHeart(id)} />
          ))}
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { fontSize: responsiveFonts.medium(15) }]} numberOfLines={1}>
            {plant.common_name || plant.name}
          </Text>
          <Text style={[styles.scientificName, { fontSize: responsiveFonts.small(11) }]} numberOfLines={1}>
            {plant.scientific_name}
          </Text>

          {plant.climate_requirements && (
            <View style={styles.climateInfo}>
              <View style={styles.climateItem}>
                <Ionicons name="sunny" size={12} color="#FF9500" />
                <Text style={[styles.climateText, { fontSize: responsiveFonts.small(9) }]} numberOfLines={1}>
                  {plant.climate_requirements.sunlight?.split(' ')[0] || 'Full sun'}
                </Text>
              </View>
              <View style={styles.climateItem}>
                <Ionicons name="thermometer" size={12} color="#007AFF" />
                <Text style={[styles.climateText, { fontSize: responsiveFonts.small(9) }]} numberOfLines={1}>
                  {plant.climate_requirements.temperature?.split(' ')[0] || 'Warm'}
                </Text>
              </View>
            </View>
          )}

          {plant.affecting_diseases && plant.affecting_diseases.length > 0 && (
            <View style={styles.diseaseIndicator}>
              <Ionicons
                name="warning"
                size={12}
                color={getSeverityColor(plant.affecting_diseases[0].severity_level)}
              />
              <Text style={[
                styles.diseaseText,
                {
                  color: getSeverityColor(plant.affecting_diseases[0].severity_level),
                  fontSize: responsiveFonts.small(10)
                }
              ]} numberOfLines={1}>
                {plant.affecting_diseases.length} disease{plant.affecting_diseases.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 6 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4, flex: 1 },
  imageContainer: { position: 'relative', width: '100%' },
  image: { width: '100%', height: '100%' },
  favoriteButton: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFFFFF', borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  floatingHeart: { position: 'absolute', top: -10, right: 0 },
  content: { padding: 12, flex: 1, justifyContent: 'space-between' },
  title: { fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  scientificName: { color: '#8E8E93', fontStyle: 'italic', marginBottom: 8 },
  climateInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, gap: 4 },
  climateItem: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  climateText: { color: '#6B7C6B', marginLeft: 3, flex: 1 },
  diseaseIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  diseaseText: { fontWeight: '500', marginLeft: 4, flex: 1 },
});

export default PlantCard;