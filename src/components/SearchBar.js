// components/SearchBar.js
import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  responsiveDimensions,
  responsiveFonts,
  screenDimensions,
  DEVICE_SIZES,
  getDeviceSize,
} from '../utils/responsive';

const SearchBar = ({ value, onChangeText, placeholder = "Find the plant you're looking for" }) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.iconContainer}>
          <Ionicons
            name="search"
            size={screenDimensions.isTablet || getDeviceSize() === DEVICE_SIZES.LARGE ? 18 : 20}
            color="#8E8E93"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: responsiveDimensions.getContainerPadding(),
    marginBottom: responsiveDimensions.padding(10),
  },
  searchContainer: {
    backgroundColor: '#E6F3E6',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    width: screenDimensions.isTablet ? '60%' : '95%',
    maxWidth: 500,

    paddingHorizontal: responsiveDimensions.padding(12),

    // ✅ Mobile-first padding
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,

    // ✅ Override for large screens only
    ...(getDeviceSize() === DEVICE_SIZES.LARGE && {
      paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    }),
  },
  input: {
    flex: 1,
    fontSize:
      getDeviceSize() === DEVICE_SIZES.LARGE
        ? responsiveFonts.medium(12) // desktop → slightly smaller
        : responsiveFonts.medium(14), // mobile/tablet → normal size
    color: '#1C1C1E',
    fontWeight: '400',
  },
  iconContainer: {
    marginLeft: responsiveDimensions.margin(6),
  },
});

export default SearchBar;
