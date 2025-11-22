import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import apiService from '../services/apiService';
import { searchService } from '../services/searchService';
import { useFavorites } from '../context/FavoritesContext';
import SearchBar from '../components/SearchBar';
import FilterModal from '../components/FilterModal';
import SortModal from '../components/SortModal';
import PlantCard from '../components/PlantCard';
import DiseaseCard from '../components/DiseaseCard';
import { Animated as RNAnimated } from 'react-native';
import { responsiveDimensions, responsiveFonts } from '../utils/responsive';

const PlantGalleryScreen = ({ navigation }) => {
  const [plants, setPlants] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [activeView, setActiveView] = useState('plants');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterOptions, setFilterOptions] = useState(null);
  const [sortOption, setSortOption] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updateFilteredData();
  }, [searchQuery, plants, diseases, activeView, filterOptions, sortOption]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plantsData, diseasesData] = await Promise.all([
        apiService.getPlants(),
        apiService.getDiseases(),
      ]);
      setPlants(plantsData);
      setDiseases(diseasesData);
      searchService.initializePlantSearch(plantsData);
      searchService.initializeDiseaseSearch(diseasesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleItemPress = (item) => {
    if (activeView === 'plants') {
      navigation.navigate('PlantDetail', { plant: item, plantId: item.plant_id });
    } else {
      navigation.navigate('DiseaseDetail', {
        diseaseId: item.disease_id,
        name: item.disease_name,
        disease: item,
        fromGallery: true,
      });
    }
  };


  const applySort = (data) => {
    if (!sortOption) return data;
    switch (sortOption) {
      case 'name_asc':
        return [...data].sort((a, b) =>
          (a.common_name || a.disease_name).localeCompare(b.common_name || b.disease_name)
        );
      case 'name_desc':
        return [...data].sort((a, b) =>
          (b.common_name || b.disease_name).localeCompare(a.common_name || a.disease_name)
        );
      default:
        return data;
    }
  };

  const updateFilteredData = () => {
    let result = [];
    if (activeView === 'plants') {
      result = searchQuery.trim()
        ? searchService.searchPlants(searchQuery)
        : plants;
    } else {
      result = searchQuery.trim()
        ? searchService.searchDiseases(searchQuery)
        : diseases;
    }
    if (filterOptions) {
      result = result.filter((item) => {
        if (activeView === 'plants' && filterOptions.plantTypes?.length) {
          return filterOptions.plantTypes.includes(item.plant_type);
        }
        if (activeView === 'diseases' && filterOptions.severities?.length) {
          return filterOptions.severities.includes(item.severity_level);
        }
        return true;
      });
    }
    setFilteredData(applySort(result));
  };

  const renderActionButtons = () => (
    <View style={styles.actionsRow}>
      {/* Filter */}
      <RNAnimated.View entering={FadeIn.duration(300)} style={{ flex: 1, marginRight: 6 }}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="options-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Filter</Text>
        </TouchableOpacity>
      </RNAnimated.View>

      {/* Sort */}
      <RNAnimated.View entering={FadeIn.duration(300).delay(100)} style={{ flex: 1, marginLeft: 6 }}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setSortModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="swap-vertical" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Sort</Text>
        </TouchableOpacity>
      </RNAnimated.View>
    </View>
  );


  const renderPlantCard = ({ item, index }) => (
    <Animated.View
      entering={FadeIn.delay(index * 80).duration(400)}
      style={{ margin: 6, width: responsiveDimensions.getCardWidth() }}
    >
      <PlantCard
        plant={item}
        isFavorite={isFavorite(item.plant_id || item.id)}
        onToggleFavorite={() => toggleFavorite(item.plant_id || item.id)}
        onPress={() => handleItemPress(item)}
      />
    </Animated.View>
  );

  const renderDiseaseCard = ({ item, index }) => (
    <Animated.View
      entering={FadeIn.delay(index * 80).duration(400)}
      style={{ margin: 6, width: responsiveDimensions.getCardWidth() }}
    >
      <DiseaseCard
        disease={item}
        onPress={() => handleItemPress(item)}
      />
    </Animated.View>
  );

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.toggleButton, activeView === 'plants' && styles.activeToggleButton]}
        onPress={() => setActiveView('plants')}
      >
        <Ionicons
          name="leaf"
          size={16}
          color={activeView === 'plants' ? '#FFFFFF' : '#8E8E93'}
        />
        <Text
          style={[
            styles.toggleText,
            { fontSize: responsiveFonts.medium(14) },
            activeView === 'plants' && styles.activeToggleText,
          ]}
        >
          Plants
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, activeView === 'diseases' && styles.activeToggleButton]}
        onPress={() => setActiveView('diseases')}
      >
        <Ionicons
          name="warning"
          size={16}
          color={activeView === 'diseases' ? '#FFFFFF' : '#8E8E93'}
        />
        <Text
          style={[
            styles.toggleText,
            { fontSize: responsiveFonts.medium(14) },
            activeView === 'diseases' && styles.activeToggleText,
          ]}
        >
          Diseases
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/1.jpg')} // update path if needed
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
          <Text style={styles.headerTitle}>Plant Scanner</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontSize: responsiveFonts.large(24) }]}>Gallery</Text>
          {renderViewToggle()}
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={activeView === 'plants' ? 'Search plants...' : 'Search diseases...'}
        />

        {/* Modals */}
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApply={(options) => setFilterOptions(options)}
          activeView={activeView}
        />
        <SortModal
          visible={sortModalVisible}
          onClose={() => setSortModalVisible(false)}
          onApply={(option) => setSortOption(option)}
        />

        {renderActionButtons()}

        <FlatList
          data={filteredData}
          renderItem={activeView === 'plants' ? renderPlantCard : renderDiseaseCard}
          keyExtractor={(item, index) =>
            activeView === 'plants'
              ? `plant-${item.plant_id ?? item.id ?? index}`
              : `disease-${item.disease_id ?? item.id ?? index}`
          }


          contentContainerStyle={{ paddingHorizontal: responsiveDimensions.getContainerPadding() }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          numColumns={responsiveDimensions.getGridColumns()}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  btnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  container: { flex: 1 },
  bgImage: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.96)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontWeight: '700', color: '#fff' },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 2,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  activeToggleButton: { backgroundColor: '#4A7C59' },
  toggleText: { fontWeight: '500', color: '#ddd' },
  activeToggleText: { color: '#FFFFFF' }, actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#558B6E',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: responsiveFonts.medium(15),
    marginLeft: 8,
  },


});

export default PlantGalleryScreen;
