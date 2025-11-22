// services/perenualService.js - Perenual Plant API Service
import axios from "axios";

// Perenual API Configuration (from environment)
const PERENUAL_API_KEY = process.env.EXPO_PUBLIC_PERENUAL_API_KEY;
const PERENUAL_BASE_URL = "https://perenual.com/api";
const TIMEOUT = 15000;

// Create axios instance for Perenual API
const perenualClient = axios.create({
  baseURL: PERENUAL_BASE_URL,
  timeout: TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

// ==========================
// Plant Species APIs
// ==========================

/**
 * Get list of plants with optional filters
 * @param {Object} options - Filter options
 * @param {number} options.page - Page number (default: 1)
 * @param {string} options.q - Search query
 * @param {string} options.order - Order (asc/desc)
 * @param {boolean} options.edible - Filter edible plants
 * @param {boolean} options.indoor - Filter indoor plants
 * @param {string} options.watering - Watering level (frequent, average, minimum, none)
 * @param {string} options.sunlight - Sunlight level (full_shade, part_shade, sun-part_shade, full_sun)
 * @param {string} options.cycle - Plant cycle (perennial, annual, biennial)
 */
export const getPlantList = async (options = {}) => {
  try {
    const params = {
      key: PERENUAL_API_KEY,
      page: options.page || 1,
    };

    // Add optional filters
    if (options.q) params.q = options.q;
    if (options.order) params.order = options.order;
    if (options.edible !== undefined) params.edible = options.edible ? 1 : 0;
    if (options.indoor !== undefined) params.indoor = options.indoor ? 1 : 0;
    if (options.poisonous !== undefined) params.poisonous = options.poisonous ? 1 : 0;
    if (options.watering) params.watering = options.watering;
    if (options.sunlight) params.sunlight = options.sunlight;
    if (options.cycle) params.cycle = options.cycle;
    if (options.hardiness) params.hardiness = options.hardiness;

    console.log("Fetching plants from Perenual API...", params);

    const response = await perenualClient.get("/v2/species-list", { params });

    if (response.data && response.data.data) {
      console.log(`Fetched ${response.data.data.length} plants from Perenual`);
      return {
        plants: response.data.data.map(transformPlantData),
        total: response.data.total,
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        perPage: response.data.per_page,
      };
    }

    return { plants: [], total: 0, currentPage: 1, lastPage: 1 };
  } catch (error) {
    console.error("Error fetching plant list:", error.message);
    throw error;
  }
};

/**
 * Get detailed information for a specific plant
 * @param {number} plantId - Plant ID
 */
export const getPlantDetails = async (plantId) => {
  try {
    console.log("Fetching plant details for ID:", plantId);

    const response = await perenualClient.get(`/v2/species/details/${plantId}`, {
      params: { key: PERENUAL_API_KEY },
    });

    if (response.data) {
      console.log("Fetched plant details:", response.data.common_name);
      return transformPlantDetails(response.data);
    }

    return null;
  } catch (error) {
    console.error("Error fetching plant details:", error.message);
    throw error;
  }
};

/**
 * Search plants by name
 * @param {string} query - Search query
 * @param {number} page - Page number
 */
export const searchPlants = async (query, page = 1) => {
  return getPlantList({ q: query, page });
};

// ==========================
// Disease APIs
// ==========================

/**
 * Get list of plant diseases/pests
 * @param {Object} options - Filter options
 * @param {number} options.page - Page number
 * @param {string} options.q - Search query
 * @param {number} options.id - Specific disease ID
 */
export const getDiseaseList = async (options = {}) => {
  try {
    const params = {
      key: PERENUAL_API_KEY,
      page: options.page || 1,
    };

    if (options.q) params.q = options.q;
    if (options.id) params.id = options.id;

    console.log("Fetching diseases from Perenual API...");

    const response = await perenualClient.get("/pest-disease-list", { params });

    if (response.data && response.data.data) {
      console.log(`Fetched ${response.data.data.length} diseases from Perenual`);
      return {
        diseases: response.data.data.map(transformDiseaseData),
        total: response.data.total,
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
      };
    }

    return { diseases: [], total: 0, currentPage: 1, lastPage: 1 };
  } catch (error) {
    console.error("Error fetching disease list:", error.message);
    throw error;
  }
};

/**
 * Search diseases by name
 * @param {string} query - Search query
 */
export const searchDiseases = async (query) => {
  return getDiseaseList({ q: query });
};

// ==========================
// Care Guides APIs
// ==========================

/**
 * Get care guides for plants
 * @param {Object} options - Filter options
 * @param {number} options.species_id - Plant species ID
 * @param {string} options.q - Search query
 * @param {string} options.type - Guide type (watering, sunlight, etc.)
 */
export const getCareGuides = async (options = {}) => {
  try {
    const params = {
      key: PERENUAL_API_KEY,
      page: options.page || 1,
    };

    if (options.species_id) params.species_id = options.species_id;
    if (options.q) params.q = options.q;
    if (options.type) params.type = options.type;

    const response = await perenualClient.get("/species-care-guide-list", { params });

    if (response.data && response.data.data) {
      return {
        guides: response.data.data,
        total: response.data.total,
      };
    }

    return { guides: [], total: 0 };
  } catch (error) {
    console.error("Error fetching care guides:", error.message);
    throw error;
  }
};

// ==========================
// Data Transformers
// ==========================

/**
 * Transform Perenual plant data to app format
 */
const transformPlantData = (plant) => ({
  plant_id: plant.id,
  common_name: plant.common_name,
  scientific_name: Array.isArray(plant.scientific_name)
    ? plant.scientific_name[0]
    : plant.scientific_name,
  other_names: plant.other_name,
  family: plant.family,
  genus: plant.genus,
  cycle: plant.cycle,
  watering: plant.watering,
  sunlight: Array.isArray(plant.sunlight) ? plant.sunlight : [plant.sunlight],
  image_url: plant.default_image?.medium_url || plant.default_image?.regular_url || null,
  thumbnail: plant.default_image?.thumbnail || plant.default_image?.small_url || null,
});

/**
 * Transform detailed plant data to app format
 */
const transformPlantDetails = (plant) => ({
  plant_id: plant.id,
  common_name: plant.common_name,
  scientific_name: Array.isArray(plant.scientific_name)
    ? plant.scientific_name[0]
    : plant.scientific_name,
  other_names: plant.other_name,
  family: plant.family,
  genus: plant.genus,
  origin: plant.origin,
  type: plant.type,
  cycle: plant.cycle,
  watering: plant.watering,
  watering_period: plant.watering_general_benchmark,
  sunlight: Array.isArray(plant.sunlight) ? plant.sunlight : [plant.sunlight],
  pruning_month: plant.pruning_month,
  growth_rate: plant.growth_rate,
  maintenance: plant.maintenance,
  care_level: plant.care_level,
  soil: plant.soil,
  hardiness: plant.hardiness,
  indoor: plant.indoor,
  description: plant.description,
  // Images
  image_url: plant.default_image?.regular_url || plant.default_image?.medium_url || null,
  thumbnail: plant.default_image?.thumbnail || null,
  // Characteristics
  dimensions: plant.dimensions,
  flowers: plant.flowers,
  flowering_season: plant.flowering_season,
  fruits: plant.fruits,
  edible_fruit: plant.edible_fruit,
  edible_leaf: plant.edible_leaf,
  leaf: plant.leaf,
  medicinal: plant.medicinal,
  poisonous_to_humans: plant.poisonous_to_humans,
  poisonous_to_pets: plant.poisonous_to_pets,
  drought_tolerant: plant.drought_tolerant,
  tropical: plant.tropical,
  invasive: plant.invasive,
  rare: plant.rare,
  // Pests and propagation
  pest_susceptibility: plant.pest_susceptibility,
  propagation: plant.propagation,
  attracts: plant.attracts,
});

/**
 * Transform disease data to app format
 */
const transformDiseaseData = (disease) => ({
  disease_id: disease.id,
  disease_name: disease.common_name,
  scientific_name: disease.scientific_name,
  other_names: disease.other_name,
  family: disease.family,
  description: disease.description,
  solution: disease.solution,
  host_plants: disease.host,
  image_url: disease.images?.[0]?.medium_url || disease.images?.[0]?.regular_url || null,
  thumbnail: disease.images?.[0]?.thumbnail || null,
});

// ==========================
// Default Export
// ==========================

export default {
  // Plants
  getPlantList,
  getPlantDetails,
  searchPlants,
  // Diseases
  getDiseaseList,
  searchDiseases,
  // Care Guides
  getCareGuides,
};
