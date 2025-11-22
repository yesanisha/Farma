// utils/imagePicker.js - Cross-platform image picker
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const pickImageFromGallery = async () => {
    try {
        if (Platform.OS === 'web') {
            // Web-specific image picker
            return new Promise((resolve, reject) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';

                input.onchange = (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve({
                                canceled: false,
                                assets: [{
                                    uri: reader.result,
                                    type: 'image',
                                    width: 0, // Will be determined later
                                    height: 0,
                                }]
                            });
                        };
                        reader.onerror = () => reject(new Error('Failed to read file'));
                        reader.readAsDataURL(file);
                    } else {
                        resolve({ canceled: true });
                    }
                };

                input.click();
            });
        } else {
            // Native mobile implementation
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Permission to access media library denied');
            }

            return await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });
        }
    } catch (error) {
        console.error('Image picker error:', error);
        throw error;
    }
};

export const takePhoto = async () => {
    try {
        if (Platform.OS === 'web') {
            // Web camera capture
            return new Promise((resolve, reject) => {
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        const video = document.createElement('video');
                        video.srcObject = stream;
                        video.play();

                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');

                        video.addEventListener('loadedmetadata', () => {
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;

                            // Create a simple UI for capture (in a real app, you'd want a proper modal)
                            const captureButton = document.createElement('button');
                            captureButton.textContent = 'Capture Photo';
                            captureButton.style.position = 'fixed';
                            captureButton.style.top = '50%';
                            captureButton.style.left = '50%';
                            captureButton.style.transform = 'translate(-50%, -50%)';
                            captureButton.style.zIndex = '10000';

                            document.body.appendChild(video);
                            document.body.appendChild(captureButton);

                            captureButton.onclick = () => {
                                context.drawImage(video, 0, 0);
                                const dataURL = canvas.toDataURL('image/jpeg');

                                // Clean up
                                stream.getTracks().forEach(track => track.stop());
                                document.body.removeChild(video);
                                document.body.removeChild(captureButton);

                                resolve({
                                    canceled: false,
                                    assets: [{
                                        uri: dataURL,
                                        type: 'image',
                                        width: canvas.width,
                                        height: canvas.height,
                                    }]
                                });
                            };
                        });
                    })
                    .catch(error => {
                        reject(new Error('Camera access denied or not available'));
                    });
            });
        } else {
            // Native mobile implementation
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Permission to access camera denied');
            }

            return await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });
        }
    } catch (error) {
        console.error('Camera error:', error);
        throw error;
    }
};