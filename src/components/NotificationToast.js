import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    SlideInUp,
    SlideOutUp
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const NotificationToast = ({
    visible,
    type = 'info',
    title,
    message,
    onDismiss,
    duration = 5000
}) => {
    const insets = useSafeAreaInsets();

    const getIconAndColor = () => {
        switch (type) {
            case 'success':
                return { icon: 'checkmark-circle', color: '#34C759', bgColor: '#E8F7EA' };
            case 'warning':
                return { icon: 'warning', color: '#FF9500', bgColor: '#FFF4E6' };
            case 'error':
                return { icon: 'close-circle', color: '#FF3B30', bgColor: '#FFEBEE' };
            case 'info':
            default:
                return { icon: 'information-circle', color: '#007AFF', bgColor: '#E6F4FF' };
        }
    };

    const { icon, color, bgColor } = getIconAndColor();

    useEffect(() => {
        if (visible && duration > 0) {
            const timer = setTimeout(() => {
                onDismiss?.();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, duration, onDismiss]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: bgColor,
                    top: insets.top + 16
                }
            ]}
            entering={SlideInUp.springify().damping(20).stiffness(200)}
            exiting={SlideOutUp.springify().damping(20).stiffness(200)}
        >
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: color }]}>
                    <Ionicons name={icon} size={16} color="#FFFFFF" />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {message && <Text style={styles.message}>{message}</Text>}
                </View>

                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onDismiss}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close" size={18} color="#8E8E93" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 1000,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        color: '#6B7C6B',
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
});

export default NotificationToast;