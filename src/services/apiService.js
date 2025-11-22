// src/services/apiService.js - Using Perenual Plant API
// Plant data from Perenual API, disease analysis from Gemini AI

import StorageService from "./storage";
import perenualService from "./perenualService";

// ==========================
// Config
// ==========================
const API_BASE_URL = "https://perenual.com/api";
export { API_BASE_URL };

// ==========================
// User Profile Management - Uses local storage
// ==========================
const userProfileService = {
  async updateProfile(userData) {
    console.log("Profile update handled locally");
    return { success: true, message: "Profile updated locally" };
  },

  async getUserProfile() {
    return null;
  }
};

// ==========================
// API Service - Using Perenual API for plants
// ==========================
const apiService = {
  // Auth - handled locally
  async login(username, password) {
    console.log("Login handled by local auth service");
    return { success: true };
  },

  async logout() {
    await StorageService.removeItem("firebase_auth_token");
    return { success: true };
  },

  // User Profile - handled locally
  ...userProfileService,

  // Plants - Using Perenual API
  async getPlants(filters = {}) {
    try {
      const result = await perenualService.getPlantList({
        page: filters.page || 1,
        q: filters.q || filters.common_name,
        indoor: filters.indoor,
        edible: filters.edible,
        watering: filters.watering,
        sunlight: filters.sunlight,
        cycle: filters.cycle,
      });
      return result.plants || [];
    } catch (error) {
      console.error("Failed to fetch plants from API:", error);
      return [];
    }
  },

  async getPlantById(plantId) {
    try {
      const plant = await perenualService.getPlantDetails(plantId);
      return plant;
    } catch (error) {
      console.error("Failed to fetch plant details:", error);
      return null;
    }
  },

  async searchPlants(query, page = 1) {
    try {
      const result = await perenualService.searchPlants(query, page);
      return result;
    } catch (error) {
      console.error("Failed to search plants:", error);
      return { plants: [], total: 0 };
    }
  },

  // Diseases - Using Perenual API + Gemini for analysis
  async getDiseases(filters = {}) {
    try {
      const result = await perenualService.getDiseaseList({
        page: filters.page || 1,
        q: filters.q || filters.disease_name,
      });
      return result.diseases || [];
    } catch (error) {
      console.error("Failed to fetch diseases:", error);
      return [];
    }
  },

  async getDiseaseById(diseaseId) {
    try {
      const result = await perenualService.getDiseaseList({ id: diseaseId });
      return result.diseases?.[0] || null;
    } catch (error) {
      console.error("Failed to fetch disease details:", error);
      return null;
    }
  },

  async searchDiseases(query) {
    try {
      const result = await perenualService.searchDiseases(query);
      return result;
    } catch (error) {
      console.error("Failed to search diseases:", error);
      return { diseases: [], total: 0 };
    }
  },

  // Care Guides - Using Perenual API
  async getCareGuides(plantId) {
    try {
      const result = await perenualService.getCareGuides({ species_id: plantId });
      return result.guides || [];
    } catch (error) {
      console.error("Failed to fetch care guides:", error);
      return [];
    }
  },

  // Upload and scan - handled by Gemini service
  async uploadScan(imageData) {
    return { success: false, message: "Use Gemini service for scanning" };
  },

  // User history - handled locally
  async getScanHistory() {
    return [];
  }
};

export default apiService;