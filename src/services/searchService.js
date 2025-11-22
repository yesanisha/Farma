import Fuse from 'fuse.js';

// Fuzzy search configuration optimized for elderly users
const SEARCH_OPTIONS = {
  // Lower threshold means more fuzzy matching (0.0 = exact, 1.0 = match anything)
  threshold: 0.4, // More lenient for typos and variations
  
  // Location of the match matters (0 = no location bias, 1 = start of string matters most)
  location: 0,
  
  // How much distance from the expected location matters
  distance: 100,
  
  // Minimum character length to trigger search
  minMatchCharLength: 2,
  
  // Include score and matches in results
  includeScore: true,
  includeMatches: true,
  
  // Fields to search in (with weights)
  keys: [
    { name: 'common_name', weight: 0.4 },          // Most important - common names
    { name: 'scientific_name', weight: 0.2 },       // Scientific names
    { name: 'description', weight: 0.2 },           // Description text
    { name: 'plant_type', weight: 0.15 },           // Plant categories
    { name: 'family', weight: 0.05 }                // Botanical family
  ]
};

// Disease search options
const DISEASE_SEARCH_OPTIONS = {
  threshold: 0.3,
  location: 0,
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  includeMatches: true,
  keys: [
    { name: 'disease_name', weight: 0.5 },
    { name: 'symptoms_description', weight: 0.3 },
    { name: 'disease_type', weight: 0.2 }
  ]
};

// Common search aliases and synonyms for better matching
const PLANT_ALIASES = {
  'tomato': ['tamatar', 'tamato', 'tometo', 'red fruit'],
  'lettuce': ['salad leaves', 'green leaves', 'salad'],
  'basil': ['tulsi', 'holy basil', 'sweet basil', 'herb'],
  'spinach': ['palak', 'green leafy', 'iron rich'],
  'potato': ['aloo', 'potatoes'],
  'onion': ['pyaz', 'onions', 'pyaaz'],
  'chili': ['mirch', 'pepper', 'hot pepper'],
  'herb': ['herbs', 'spice', 'seasoning'],
  'vegetable': ['vegetables', 'veggies', 'sabzi'],
  'fruit': ['fruits', 'phal'],
  'flower': ['flowers', 'phool', 'bloom'],
  'tree': ['trees', 'ped'],
  'plant': ['plants', 'paudha']
};

const DISEASE_ALIASES = {
  'blight': ['leaf spot', 'brown spots', 'dying leaves'],
  'wilt': ['wilting', 'drooping', 'sagging'],
  'rot': ['rotting', 'decay', 'decompose'],
  'fungus': ['fungal', 'mold', 'mould'],
  'pest': ['insects', 'bugs', 'caterpillar'],
  'virus': ['viral', 'infection']
};

// Expand query with aliases and synonyms
const expandQuery = (query, aliases) => {
  const words = query.toLowerCase().split(' ');
  const expandedWords = [...words];
  
  words.forEach(word => {
    Object.entries(aliases).forEach(([key, synonyms]) => {
      if (word.includes(key) || synonyms.some(syn => word.includes(syn))) {
        expandedWords.push(key, ...synonyms);
      }
    });
  });
  
  return [...new Set(expandedWords)].join(' ');
};

// Preprocess plants data for better searching
const preprocessPlantsData = (plants) => {
  return plants.map(plant => ({
    ...plant,
    searchableText: [
      plant.common_name,
      plant.scientific_name,
      plant.description,
      plant.plant_type,
      plant.family,
      // Add climate keywords for better matching
      plant.climate_requirements?.sunlight,
      plant.climate_requirements?.temperature,
      plant.growth_conditions
    ].filter(Boolean).join(' ').toLowerCase()
  }));
};

export class SearchService {
  constructor() {
    this.plantsFuse = null;
    this.diseasesFuse = null;
  }

  // Initialize search indexes
  initializePlantSearch(plants) {
    const processedPlants = preprocessPlantsData(plants);
    this.plantsFuse = new Fuse(processedPlants, SEARCH_OPTIONS);
  }

  initializeDiseaseSearch(diseases) {
    this.diseasesFuse = new Fuse(diseases, DISEASE_SEARCH_OPTIONS);
  }

  // Smart plant search with fuzzy matching
  searchPlants(query, category = 'all') {
    if (!this.plantsFuse || !query || query.trim().length < 2) {
      return [];
    }

    // Expand query with aliases
    const expandedQuery = expandQuery(query, PLANT_ALIASES);
    
    // Perform fuzzy search
    const results = this.plantsFuse.search(expandedQuery);
    
    // Filter by category if specified
    let filteredResults = results;
    if (category !== 'all') {
      filteredResults = results.filter(result => 
        result.item.plant_type.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Sort by relevance score and return items
    return filteredResults
      .sort((a, b) => a.score - b.score) // Lower score = better match
      .slice(0, 20) // Limit results
      .map(result => result.item);
  }

  // Search diseases with symptoms
  searchDiseases(query) {
    if (!this.diseasesFuse || !query || query.trim().length < 2) {
      return [];
    }

    const expandedQuery = expandQuery(query, DISEASE_ALIASES);
    const results = this.diseasesFuse.search(expandedQuery);
    
    return results
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)
      .map(result => result.item);
  }

  // Smart suggestions for autocomplete
  getSuggestions(query, type = 'plants') {
    if (!query || query.length < 2) return [];
    
    const searchResults = type === 'plants' 
      ? this.searchPlants(query)
      : this.searchDiseases(query);
    
    // Extract unique suggestions
    const suggestions = new Set();
    
    searchResults.forEach(item => {
      if (type === 'plants') {
        suggestions.add(item.common_name);
        if (item.scientific_name) {
          suggestions.add(item.scientific_name);
        }
      } else {
        suggestions.add(item.disease_name);
      }
    });
    
    return Array.from(suggestions).slice(0, 8);
  }

  // Contextual search based on user's farming context
  contextualSearch(query, context = {}) {
    const { location, season, cropType } = context;
    let results = this.searchPlants(query);
    
    // Apply contextual filtering if available
    if (season) {
      // TODO: Filter by seasonal appropriateness
    }
    
    if (cropType) {
      results = results.filter(plant => 
        plant.plant_type.toLowerCase().includes(cropType.toLowerCase())
      );
    }
    
    return results;
  }

  // Helper method to check if query might be in local language
  isLocalLanguageQuery(query) {
    // Simple check for non-English characters or known local terms
    const localTerms = ['tamatar', 'palak', 'aloo', 'pyaz', 'mirch', 'tulsi'];
    return localTerms.some(term => query.toLowerCase().includes(term)) ||
           /[^\x00-\x7F]/.test(query); // Non-ASCII characters
  }

  // Handle voice-to-text variations
  normalizeVoiceInput(query) {
    // Common voice-to-text corrections
    const corrections = {
      'tometo': 'tomato',
      'letuce': 'lettuce',
      'basill': 'basil',
      'spinnach': 'spinach',
      'desease': 'disease',
      'funguss': 'fungus'
    };
    
    let normalized = query.toLowerCase();
    Object.entries(corrections).forEach(([wrong, correct]) => {
      normalized = normalized.replace(new RegExp(wrong, 'g'), correct);
    });
    
    return normalized;
  }
}

// Create singleton instance
export const searchService = new SearchService();
export default searchService;