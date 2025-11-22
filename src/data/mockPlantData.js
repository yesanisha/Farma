// data/mockPlantData.js - Mock Plant and Disease Data for Local Testing

export const MOCK_PLANTS = [
    {
        id: 'plant_001',
        name: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        description: 'Common garden tomato plant. A widely cultivated plant bearing typically red, edible fruit.',
        imageUrl: null,
        category: 'Vegetable',
        growingConditions: {
            sunlight: 'Full sun (6-8 hours)',
            water: 'Regular watering',
            soil: 'Well-drained, fertile soil',
            temperature: '65-85°F (18-29°C)',
        },
        commonDiseases: ['Early Blight', 'Late Blight', 'Septoria Leaf Spot'],
    },
    {
        id: 'plant_002',
        name: 'Rose',
        scientificName: 'Rosa',
        description: 'A woody flowering plant known for its beautiful blooms and fragrance.',
        imageUrl: null,
        category: 'Flower',
        growingConditions: {
            sunlight: 'Full sun (6+ hours)',
            water: 'Deep watering 2-3 times per week',
            soil: 'Rich, well-drained soil',
            temperature: '60-75°F (15-24°C)',
        },
        commonDiseases: ['Black Spot', 'Powdery Mildew', 'Rust'],
    },
    {
        id: 'plant_003',
        name: 'Basil',
        scientificName: 'Ocimum basilicum',
        description: 'An aromatic herb commonly used in cooking, especially in Italian cuisine.',
        imageUrl: null,
        category: 'Herb',
        growingConditions: {
            sunlight: 'Full sun (6-8 hours)',
            water: 'Regular, keep soil moist',
            soil: 'Well-drained, nutrient-rich soil',
            temperature: '70-80°F (21-27°C)',
        },
        commonDiseases: ['Fusarium Wilt', 'Downy Mildew', 'Leaf Spot'],
    },
    {
        id: 'plant_004',
        name: 'Pepper',
        scientificName: 'Capsicum annuum',
        description: 'Bell peppers and chili peppers, popular in many cuisines worldwide.',
        imageUrl: null,
        category: 'Vegetable',
        growingConditions: {
            sunlight: 'Full sun (6-8 hours)',
            water: 'Regular watering',
            soil: 'Well-drained, fertile soil',
            temperature: '70-85°F (21-29°C)',
        },
        commonDiseases: ['Bacterial Spot', 'Anthracnose', 'Mosaic Virus'],
    },
    {
        id: 'plant_005',
        name: 'Cucumber',
        scientificName: 'Cucumis sativus',
        description: 'A widely cultivated vine plant producing cylindrical green fruits.',
        imageUrl: null,
        category: 'Vegetable',
        growingConditions: {
            sunlight: 'Full sun (6-8 hours)',
            water: 'Consistent moisture',
            soil: 'Rich, well-drained soil',
            temperature: '70-90°F (21-32°C)',
        },
        commonDiseases: ['Powdery Mildew', 'Downy Mildew', 'Angular Leaf Spot'],
    },
];

export const MOCK_DISEASES = [
    {
        id: 'disease_001',
        name: 'Early Blight',
        description: 'A fungal disease causing dark spots with concentric rings on leaves. Common in tomatoes and potatoes.',
        symptoms: [
            'Dark brown spots with target-like rings',
            'Yellowing of leaves around spots',
            'Lower leaves affected first',
            'Leaf drop',
        ],
        causes: [
            'Alternaria solani fungus',
            'Warm, humid conditions',
            'Overhead watering',
            'Poor air circulation',
        ],
        treatment: [
            'Remove affected leaves immediately',
            'Apply copper-based fungicide',
            'Improve air circulation',
            'Water at soil level, not on leaves',
            'Rotate crops yearly',
        ],
        prevention: [
            'Use disease-resistant varieties',
            'Mulch around plants',
            'Space plants properly',
            'Avoid overhead irrigation',
        ],
        severity: 'Medium',
        affectedPlants: ['Tomato', 'Potato', 'Pepper'],
    },
    {
        id: 'disease_002',
        name: 'Powdery Mildew',
        description: 'A common fungal disease appearing as white powdery coating on leaves and stems.',
        symptoms: [
            'White, powdery spots on leaves',
            'Yellowing and wilting leaves',
            'Distorted new growth',
            'Premature leaf drop',
        ],
        causes: [
            'Various fungal species',
            'Warm days with cool nights',
            'High humidity',
            'Poor air circulation',
        ],
        treatment: [
            'Remove heavily infected leaves',
            'Apply neem oil or sulfur-based fungicide',
            'Spray with baking soda solution',
            'Improve air circulation',
        ],
        prevention: [
            'Choose resistant varieties',
            'Ensure proper spacing',
            'Water in the morning',
            'Avoid excess nitrogen fertilizer',
        ],
        severity: 'Low to Medium',
        affectedPlants: ['Rose', 'Cucumber', 'Squash', 'Grapes'],
    },
    {
        id: 'disease_003',
        name: 'Black Spot',
        description: 'A fungal disease primarily affecting roses, causing black spots on leaves.',
        symptoms: [
            'Circular black spots with fringed edges',
            'Yellow halos around spots',
            'Premature leaf yellowing and drop',
            'Weakened plant growth',
        ],
        causes: [
            'Diplocarpon rosae fungus',
            'Wet conditions',
            'Splashing water',
            'Infected plant debris',
        ],
        treatment: [
            'Remove all infected leaves',
            'Apply fungicide weekly',
            'Clean up fallen leaves',
            'Prune for better air circulation',
        ],
        prevention: [
            'Plant disease-resistant rose varieties',
            'Water at ground level',
            'Mulch around plants',
            'Ensure good air flow',
        ],
        severity: 'Medium',
        affectedPlants: ['Rose'],
    },
    {
        id: 'disease_004',
        name: 'Healthy Plant',
        description: 'No disease detected. The plant appears to be in good health.',
        symptoms: [],
        causes: [],
        treatment: [
            'Continue regular care routine',
            'Monitor for any changes',
            'Maintain proper watering schedule',
        ],
        prevention: [
            'Regular inspection',
            'Proper nutrition',
            'Adequate sunlight',
            'Good air circulation',
        ],
        severity: 'None',
        affectedPlants: [],
    },
];

// Generate random mock prediction
export const generateMockPrediction = () => {
    const randomIndex = Math.floor(Math.random() * MOCK_DISEASES.length);
    const disease = MOCK_DISEASES[randomIndex];
    const confidence = (70 + Math.random() * 25).toFixed(1); // 70-95% confidence

    return [
        {
            name: disease.name,
            confidence: parseFloat(confidence),
            disease_id: disease.id,
            description: disease.description,
            symptoms: disease.symptoms,
            treatment: disease.treatment,
            prevention: disease.prevention,
            severity: disease.severity,
        },
    ];
};

// Get disease by name
export const getDiseaseByName = (name) => {
    return MOCK_DISEASES.find(d =>
        d.name.toLowerCase() === name.toLowerCase()
    ) || MOCK_DISEASES[MOCK_DISEASES.length - 1]; // Return "Healthy" if not found
};

// Get plant by name
export const getPlantByName = (name) => {
    return MOCK_PLANTS.find(p =>
        p.name.toLowerCase().includes(name.toLowerCase())
    );
};

// Search plants
export const searchPlants = (query) => {
    const lowerQuery = query.toLowerCase();
    return MOCK_PLANTS.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.scientificName.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
};

// Search diseases
export const searchDiseases = (query) => {
    const lowerQuery = query.toLowerCase();
    return MOCK_DISEASES.filter(d =>
        d.name.toLowerCase().includes(lowerQuery) ||
        d.description.toLowerCase().includes(lowerQuery)
    );
};

export default {
    MOCK_PLANTS,
    MOCK_DISEASES,
    generateMockPrediction,
    getDiseaseByName,
    getPlantByName,
    searchPlants,
    searchDiseases,
};
