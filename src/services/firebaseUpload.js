// services/firebaseUpload.js - Local Upload Service with Mock Predictions
import localAuth from "./localAuth";
import localDatabase from "./localDatabase";
import { generateMockPrediction } from "../data/mockPlantData";

// Simulate upload and return mock prediction
export const uploadAndWatchInference = async (
    fileUri,
    fileName,
    onProgress,
    onPrediction
) => {
    const user = localAuth.getCurrentUser();
    if (!user) throw new Error("Sign in first");

    // Generate upload ID
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    console.log('Starting local upload simulation...', { uploadId, fileName });

    // Create local upload record
    await localDatabase.createUpload({
        id: uploadId,
        fileName: fileName,
        fileUri: fileUri,
        status: 'processing',
    });

    // Simulate upload progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
            onProgress?.(progress);
        }
        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, 100);

    // Wait for "upload" to complete
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Update status
    await localDatabase.updateUpload(uploadId, {
        status: 'analyzing',
    });

    // Simulate ML inference delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Generate mock prediction
    const predictions = generateMockPrediction();
    console.log('Generated mock predictions:', predictions);

    // Update upload with results
    await localDatabase.updateUpload(uploadId, {
        status: 'complete',
        predictions: predictions,
    });

    // Add to scan history
    await localDatabase.addScanResult({
        uploadId: uploadId,
        fileName: fileName,
        fileUri: fileUri,
        predictions: predictions,
        diseases: predictions.map(p => ({
            name: p.name,
            confidence: p.confidence,
        })),
    });

    // Call the prediction callback
    onPrediction(predictions);

    return uploadId;
};

// Simple version that just returns mock data immediately
export const analyzePlantImage = async (fileUri) => {
    const user = localAuth.getCurrentUser();
    if (!user) throw new Error("Sign in first");

    console.log('Analyzing plant image locally...');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock prediction
    const predictions = generateMockPrediction();

    // Add to scan history
    await localDatabase.addScanResult({
        fileUri: fileUri,
        predictions: predictions,
        diseases: predictions.map(p => ({
            name: p.name,
            confidence: p.confidence,
        })),
    });

    return predictions;
};

// Get upload status (for compatibility)
export const getUploadStatus = async (uploadId) => {
    // In local mode, uploads are processed immediately
    return {
        status: 'complete',
        uploadId: uploadId,
    };
};

export default {
    uploadAndWatchInference,
    analyzePlantImage,
    getUploadStatus,
};
