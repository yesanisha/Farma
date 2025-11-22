// services/geminiService.js - Gemini API Service for Plant Disease Detection
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";

// Gemini API Key (from environment)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Get the vision model for image analysis
const getVisionModel = () => {
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096,
    },
  });
};

/**
 * Convert image URI to base64 - works on both native and web
 * @param {string} uri - The image URI
 * @returns {Promise<{base64: string, mimeType: string}>}
 */
const imageToBase64 = async (uri) => {
  try {
    // Determine MIME type from URI
    const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const mimeType = mimeTypes[extension] || "image/jpeg";

    // For web platform, use fetch approach
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          const base64 = base64data.split(",")[1];
          resolve({ base64, mimeType: blob.type || mimeType });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // For native platforms, use expo-image-manipulator which reliably outputs base64
    // This is more compatible than FileSystem.readAsStringAsync in newer Expo versions
    try {
      console.log("Using ImageManipulator for base64 conversion...");
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [], // No transformations
        { base64: true, format: ImageManipulator.SaveFormat.JPEG }
      );

      if (manipResult.base64) {
        console.log("Successfully converted image to base64 using ImageManipulator");
        return { base64: manipResult.base64, mimeType: "image/jpeg" };
      }
    } catch (manipError) {
      console.warn("ImageManipulator failed, trying FileSystem:", manipError);
    }

    // Fallback to FileSystem if ImageManipulator fails
    if (FileSystem && FileSystem.readAsStringAsync) {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      return { base64, mimeType };
    }

    throw new Error("No method available to convert image to base64");
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("Failed to process image. Please try again.");
  }
};

/**
 * Analyze plant image for diseases using Gemini Vision
 * @param {string} imageUri - The URI of the plant image
 * @param {function} onProgress - Optional progress callback
 * @returns {Promise<Object>} - Analysis results with predictions
 */
export const analyzePlantDisease = async (imageUri, onProgress) => {
  try {
    console.log("Starting plant disease analysis with Gemini...");
    onProgress?.("Converting image...", 10);

    const model = getVisionModel();

    // Convert image to base64
    const { base64, mimeType } = await imageToBase64(imageUri);
    onProgress?.("Analyzing with AI...", 40);

    // Create the prompt for plant disease analysis
    const prompt = `You are an expert plant pathologist and botanist with decades of experience. Analyze this plant image carefully and identify any diseases, health issues, or conditions.

IMPORTANT: Respond with ONLY valid JSON, no additional text or markdown.

{
  "is_plant": true or false,
  "plant_name": "Common name of the plant (be specific, e.g., 'Tomato' not just 'Vegetable')",
  "scientific_name": "Scientific/Latin name if identifiable",
  "health_status": "healthy" | "diseased" | "stressed" | "unknown",
  "predictions": [
    {
      "class_name": "Specific disease name (e.g., 'Early Blight', 'Powdery Mildew')",
      "confidence": 0.0 to 1.0,
      "description": "Clear description of what this disease is",
      "symptoms": ["visible symptom 1", "visible symptom 2"],
      "treatment": ["specific treatment 1", "specific treatment 2"],
      "prevention": ["prevention measure 1", "prevention measure 2"]
    }
  ],
  "overall_assessment": "A helpful 1-2 sentence summary of the plant's condition",
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"]
}

Guidelines:
- If not a plant image, set is_plant to false and explain in overall_assessment
- If plant is healthy, set health_status to "healthy" and predictions to empty array
- Be specific about disease names - use common agricultural disease names
- Confidence should reflect your certainty (0.5-0.7 for possible, 0.7-0.85 for likely, 0.85+ for confident)
- Provide practical, actionable treatments and recommendations`;

    // Prepare image part for Gemini
    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    };

    onProgress?.("Processing results...", 70);

    // Generate content with image
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini raw response:", text.substring(0, 500));
    onProgress?.("Parsing response...", 90);

    // Parse the JSON response
    let analysisResult;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      // Try to extract JSON
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      // Return a fallback response
      analysisResult = {
        is_plant: true,
        plant_name: "Unknown Plant",
        health_status: "unknown",
        predictions: [],
        overall_assessment:
          "Unable to fully analyze the image. Please try again with a clearer photo.",
        recommendations: [
          "Take a photo with better lighting",
          "Ensure the plant is in focus",
          "Show the affected area clearly",
        ],
      };
    }

    onProgress?.("Complete!", 100);

    // Format the response to match the expected structure
    const formattedResult = {
      status: "inference_done",
      is_plant: analysisResult.is_plant ?? true,
      plant_name: analysisResult.plant_name || "Unknown Plant",
      scientific_name: analysisResult.scientific_name || null,
      health_status: analysisResult.health_status || "unknown",
      prediction: (analysisResult.predictions || []).map((pred, index) => ({
        index: index,
        class_name: pred.class_name || "Unknown Condition",
        confidence: Math.min(Math.max(pred.confidence || 0.5, 0), 1),
        description: pred.description || "",
        symptoms: Array.isArray(pred.symptoms) ? pred.symptoms : [],
        treatment: Array.isArray(pred.treatment) ? pred.treatment : [],
        prevention: Array.isArray(pred.prevention) ? pred.prevention : [],
      })),
      overall_assessment:
        analysisResult.overall_assessment || "Analysis complete.",
      recommendations: Array.isArray(analysisResult.recommendations)
        ? analysisResult.recommendations
        : [],
      analyzed_at: new Date().toISOString(),
    };

    console.log("Formatted analysis result:", formattedResult);
    return formattedResult;
  } catch (error) {
    console.error("Error in Gemini plant analysis:", error);

    // Provide user-friendly error messages
    let errorMessage = "Failed to analyze plant image";
    if (error.message?.includes("API key")) {
      errorMessage = "API configuration error. Please check settings.";
    } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
      errorMessage = "Network error. Please check your connection.";
    } else if (error.message?.includes("image")) {
      errorMessage = "Image processing failed. Please try a different photo.";
    }

    throw {
      status: "error",
      message: errorMessage,
      error: error,
    };
  }
};

/**
 * Identify a plant from an image
 * @param {string} imageUri - The URI of the plant image
 * @returns {Promise<Object>} - Plant identification results
 */
export const identifyPlant = async (imageUri) => {
  try {
    console.log("Starting plant identification with Gemini...");

    const model = getVisionModel();
    const { base64, mimeType } = await imageToBase64(imageUri);

    const prompt = `You are an expert botanist. Identify this plant and provide detailed information.

IMPORTANT: Respond with ONLY valid JSON, no additional text or markdown.

{
  "is_plant": true or false,
  "common_name": "Common name of the plant",
  "scientific_name": "Scientific/Latin name",
  "family": "Plant family name",
  "confidence": 0.0 to 1.0,
  "description": "Brief description of the plant",
  "characteristics": {
    "type": "herb/shrub/tree/vine/succulent/etc",
    "height": "Typical height range",
    "leaves": "Leaf description",
    "flowers": "Flower description if visible/applicable",
    "fruits": "Fruit description if visible/applicable"
  },
  "care_info": {
    "sunlight": "Light requirements",
    "water": "Watering needs",
    "soil": "Soil preferences",
    "temperature": "Temperature range"
  },
  "uses": ["Common use 1", "Common use 2"],
  "interesting_facts": ["Fact 1", "Fact 2"]
}

If the image is not a plant, set is_plant to false.`;

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini plant identification response:", text.substring(0, 300));

    let identificationResult;
    try {
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        identificationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing identification response:", parseError);
      identificationResult = {
        is_plant: true,
        common_name: "Unknown Plant",
        scientific_name: "Unknown",
        confidence: 0.5,
        description: "Could not fully identify this plant. Please try with a clearer image.",
      };
    }

    return {
      status: "success",
      ...identificationResult,
      identified_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in plant identification:", error);
    throw {
      status: "error",
      message: error.message || "Failed to identify plant",
      error: error,
    };
  }
};

/**
 * Get treatment recommendations for a specific disease
 * @param {string} diseaseName - The name of the disease
 * @param {string} plantName - Optional plant name for more specific recommendations
 * @returns {Promise<Object>} - Treatment recommendations
 */
export const getTreatmentRecommendations = async (diseaseName, plantName = null) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an expert plant pathologist. Provide detailed treatment recommendations for the following plant disease:

Disease: ${diseaseName}
${plantName ? `Plant: ${plantName}` : ""}

IMPORTANT: Respond with ONLY valid JSON, no additional text or markdown.

{
  "disease_name": "${diseaseName}",
  "severity": "low" | "medium" | "high",
  "immediate_actions": ["Action 1", "Action 2"],
  "treatment_options": [
    {
      "type": "organic" | "chemical" | "cultural",
      "name": "Treatment name",
      "description": "How to apply this treatment",
      "effectiveness": "high" | "medium" | "low"
    }
  ],
  "prevention_measures": ["Prevention 1", "Prevention 2"],
  "recovery_time": "Expected timeframe for recovery",
  "when_to_seek_expert": "Conditions that need professional help",
  "additional_notes": "Any other important information"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let recommendations;
    try {
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }

      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      recommendations = {
        disease_name: diseaseName,
        severity: "medium",
        immediate_actions: ["Isolate affected plants", "Remove severely damaged leaves"],
        treatment_options: [],
        prevention_measures: ["Improve air circulation", "Avoid overwatering"],
        additional_notes: "Please consult a local plant expert for specific recommendations.",
      };
    }

    return {
      status: "success",
      ...recommendations,
    };
  } catch (error) {
    console.error("Error getting treatment recommendations:", error);
    throw {
      status: "error",
      message: error.message || "Failed to get treatment recommendations",
    };
  }
};

export default {
  analyzePlantDisease,
  identifyPlant,
  getTreatmentRecommendations,
};
