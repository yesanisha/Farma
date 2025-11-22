import { useState, useEffect } from 'react';
import { Dimensions, Platform, PixelRatio } from 'react-native';

// Detect if we're on web
const isWeb = Platform.OS === 'web';

const getScreen = () => {
  if (isWeb) {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

let { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = getScreen();

export const DEVICE_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  TABLET: 'tablet',
};

export const getDeviceSize = () => {
  if (SCREEN_WIDTH >= 768) return DEVICE_SIZES.TABLET;
  if (SCREEN_WIDTH >= 414) return DEVICE_SIZES.LARGE;
  if (SCREEN_WIDTH >= 375) return DEVICE_SIZES.MEDIUM;
  return DEVICE_SIZES.SMALL;
};

const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;

export const responsiveDimensions = {
  width: (size) => scale(size),
  height: (size) => verticalScale(size),
  padding: (size) => scale(size),
  margin: (size) => scale(size),
  icon: (size) => scale(size),

  getCardWidth: () => {
    const deviceSize = getDeviceSize();
    const padding = 32;
    const gap = 8;
    switch (deviceSize) {
      case DEVICE_SIZES.TABLET:
        return (SCREEN_WIDTH - padding - gap * 2) / 3;
      default:
        return (SCREEN_WIDTH - padding - gap) / 2;
    }
  },

  getCardHeight: () => {
    const deviceSize = getDeviceSize();
    switch (deviceSize) {
      case DEVICE_SIZES.SMALL: return 220;
      case DEVICE_SIZES.MEDIUM: return 240;
      case DEVICE_SIZES.LARGE: return 260;
      case DEVICE_SIZES.TABLET: return 280;
      default: return 240;
    }
  },

  getCardImageHeight: () => {
    const deviceSize = getDeviceSize();
    switch (deviceSize) {
      case DEVICE_SIZES.SMALL: return 120;
      case DEVICE_SIZES.MEDIUM: return 130;
      case DEVICE_SIZES.LARGE: return 140;
      case DEVICE_SIZES.TABLET: return 160;
      default: return 130;
    }
  },

  getGridColumns: () => (getDeviceSize() === DEVICE_SIZES.TABLET ? 3 : 2),

  getContainerPadding: () => {
    const deviceSize = getDeviceSize();
    switch (deviceSize) {
      case DEVICE_SIZES.SMALL: return 12;
      case DEVICE_SIZES.TABLET: return 24;
      default: return 16;
    }
  },

  getSemicircleWidth: () => {
    const deviceSize = getDeviceSize();
    switch (deviceSize) {
      case DEVICE_SIZES.SMALL: return SCREEN_WIDTH * 0.85;
      case DEVICE_SIZES.MEDIUM: return SCREEN_WIDTH * 0.8;
      case DEVICE_SIZES.LARGE: return SCREEN_WIDTH * 0.75;
      case DEVICE_SIZES.TABLET: return SCREEN_WIDTH * 0.6;
      default: return SCREEN_WIDTH * 0.8;
    }
  },
};

export const responsiveFonts = {
  small: (size) => {
    const factor = isWeb ? 1 : PixelRatio.getFontScale();
    switch (getDeviceSize()) {
      case DEVICE_SIZES.SMALL: return (size * 0.9) / factor;
      case DEVICE_SIZES.LARGE: return (size * 1.05) / factor;
      case DEVICE_SIZES.TABLET: return (size * 1.2) / factor;
      default: return size / factor;
    }
  },
  medium: (size) => {
    const factor = isWeb ? 1 : PixelRatio.getFontScale();
    switch (getDeviceSize()) {
      case DEVICE_SIZES.SMALL: return (size * 0.92) / factor;
      case DEVICE_SIZES.LARGE: return (size * 1.03) / factor;
      case DEVICE_SIZES.TABLET: return (size * 1.15) / factor;
      default: return size / factor;
    }
  },
  large: (size) => {
    const factor = isWeb ? 1 : PixelRatio.getFontScale();
    switch (getDeviceSize()) {
      case DEVICE_SIZES.SMALL: return (size * 0.95) / factor;
      case DEVICE_SIZES.TABLET: return (size * 1.1) / factor;
      default: return size / factor;
    }
  },
};

export const screenDimensions = {
  get width() {
    return SCREEN_WIDTH;
  },
  get height() {
    return SCREEN_HEIGHT;
  },
  get isSmallDevice() {
    return SCREEN_WIDTH < 375;
  },
  get isMediumDevice() {
    return SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
  },
  get isLargeDevice() {
    return SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768;
  },
  get isTablet() {
    return SCREEN_WIDTH >= 768;
  },
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb,
};

export const safeAreaAdjustments = {
  getTabBarHeight: () => (Platform.OS === 'ios' ? (SCREEN_HEIGHT >= 812 ? 85 : 75) : 70),
  getHeaderHeight: () => (Platform.OS === 'ios' ? 44 : 56),
  getStatusBarHeight: () => (Platform.OS === 'ios' ? (SCREEN_HEIGHT >= 812 ? 44 : 20) : 24),
};

// 🪄 Hook to listen for resize (for Web responsiveness)
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(getScreen());

  useEffect(() => {
    if (isWeb) {
      const handleResize = () => {
        SCREEN_WIDTH = window.innerWidth;
        SCREEN_HEIGHT = window.innerHeight;
        setDimensions(getScreen());
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      const subscription = Dimensions.addEventListener('change', ({ window }) => {
        SCREEN_WIDTH = window.width;
        SCREEN_HEIGHT = window.height;
        setDimensions(window);
      });
      return () => subscription?.remove();
    }
  }, []);

  return { ...dimensions, deviceSize: getDeviceSize() };
};

export default {
  getDeviceSize,
  responsiveDimensions,
  responsiveFonts,
  screenDimensions,
  safeAreaAdjustments,
  DEVICE_SIZES,
  useResponsive,
};
