# FARMA - AI-Powered Plant Disease Detection App

A comprehensive mobile application for farmers and gardeners that combines AI-powered plant disease detection, plant identification, and agricultural guidance.

## Features

### Plant Disease Detection
- Scan plants using your camera or gallery images
- AI-powered analysis using Google Gemini 2.0 Flash
- Get disease predictions with confidence scores
- Receive treatment recommendations and prevention measures
- Track scan history with detailed analytics

### Plant Discovery
- Browse extensive plant database (Perenual API)
- Filter by categories: Vegetables, Fruits, Herbs, Flowers
- Search by common name, scientific name, or plant type
- View detailed plant information including climate requirements
- Save favorites for quick access

### Disease Information
- Comprehensive disease database
- Detailed symptoms and treatment methods
- Prevention measures and care guides
- AI-generated recommendations

### AI Chat Assistant
- Ask questions about plants and farming
- Get personalized agricultural advice
- Powered by Google Gemini AI

## Tech Stack

### Frontend
- **React Native** 0.81.5
- **Expo** ~54.0.25
- **React Navigation** 6.x (Stack + Bottom Tabs)

### AI & APIs
- **Google Gemini AI** - Plant disease detection & chat
- **Perenual API** - Plant & disease database

### State Management & Storage
- **Zustand** - State management
- **AsyncStorage** - Local data persistence
- **Context API** - Favorites & notifications

### UI/UX
- **React Native Reanimated** - Smooth animations
- **Lottie** - Complex animations
- **Expo Linear Gradient** - Gradient backgrounds
- **Ionicons** - Icon library

## Project Structure

```
farma/
├── App.js                    # Root component & navigation
├── src/
│   ├── screens/              # App screens
│   │   ├── HomeScreen.js     # Plant browsing & discovery
│   │   ├── PlantGalleryScreen.js
│   │   ├── PlantDetailScreen.js
│   │   ├── ScanScreen.js     # Disease scanning
│   │   ├── ScanResults.js
│   │   ├── DiseaseDetailScreen.js
│   │   ├── HistoryScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── LoginScreen.js
│   │   ├── SetupScreen.js
│   │   └── SplashScreen.js
│   ├── components/           # Reusable UI components
│   │   ├── PlantCard.js
│   │   ├── DiseaseCard.js
│   │   ├── ChatBotScreen.js
│   │   ├── SearchBar.js
│   │   ├── FilterModal.js
│   │   └── ...
│   ├── services/             # API & business logic
│   │   ├── apiService.js     # Main API wrapper
│   │   ├── perenualService.js # Perenual Plant API
│   │   ├── geminiService.js  # Google Gemini AI
│   │   ├── localAuth.js      # Authentication
│   │   ├── localDatabase.js  # User data storage
│   │   └── storage.js        # AsyncStorage wrapper
│   ├── context/              # React Context providers
│   │   ├── FavoritesContext.js
│   │   └── NotificationContext.js
│   └── utils/                # Utility functions
├── assets/                   # Images, fonts, animations
├── app.json                  # Expo configuration
└── package.json
```

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/farma.git
   cd farma
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your API keys:
   ```
   EXPO_PUBLIC_API_URL=your_graphql_api_url
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   EXPO_PUBLIC_GOOGLE_WEATHER_API_KEY=your_weather_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
   EXPO_PUBLIC_PERENUAL_API_KEY=your_perenual_key
   ```

4. **Configure Firebase (for Google Sign-In)**
   - Create a Firebase project
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the project root

5. **Start the development server**
   ```bash
   npx expo start
   ```

## Running the App

### Development
```bash
# Start Expo development server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios

# Run on web
npx expo start --web
```

### Production Build
```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## API Keys Required

| Service | Purpose | Get Key |
|---------|---------|---------|
| Google Gemini | AI disease detection & chat | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| Perenual | Plant & disease database | [Perenual](https://perenual.com/docs/api) |
| Google Maps | Location services | [Google Cloud Console](https://console.cloud.google.com) |

## Key Features Explained

### Disease Scanning
The app uses Google Gemini 2.0 Flash vision model to analyze plant images:
1. User captures/selects an image
2. Image is converted to base64 and sent to Gemini API
3. AI analyzes for disease patterns
4. Results include disease name, confidence score, symptoms, and treatment

### Offline Support
- Plant data cached for 24 hours
- Stale cache available as fallback
- Favorites stored locally
- Scan history persisted on device

### Rate Limiting
- 10 scans per day (free tier)
- Visual indicator of remaining scans
- Resets daily at midnight

## Navigation Flow

```
SplashScreen
    ↓
Login/Guest Mode
    ↓
MainTabs
├── Home (Browse Plants)
├── Gallery (Plants & Diseases)
├── Scan (Disease Detection)
└── Profile (Settings & History)
```

## Screenshots

| Home | Scan | Results | Profile |
|------|------|---------|---------|
| Browse plants | Capture image | AI analysis | User settings |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Perenual](https://perenual.com/) - Plant database API
- [Google Gemini](https://ai.google.dev/) - AI capabilities
- [Expo](https://expo.dev/) - Development framework
- [React Native](https://reactnative.dev/) - Mobile framework

## Contact

For questions or support, please open an issue on GitHub.

---

Built with love for farmers and gardeners everywhere.
