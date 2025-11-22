import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    SlideInUp,
    SlideOutDown,
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import { responsiveFonts } from '../utils/responsive';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FilterModal = ({ visible, filters = {}, onApply, onClose }) => {
    const [localFilters, setLocalFilters] = useState({});

    useEffect(() => {
        if (visible) setLocalFilters({ ...filters });
    }, [visible]);

    const filterOptions = {
        care_level: {
            title: 'Care Difficulty',
            icon: 'leaf',
            options: ['Beginner', 'Intermediate', 'Advanced'],
        },
        sunlight: {
            title: 'Sunlight Requirements',
            icon: 'sunny',
            options: ['Full sun', 'Partial sun', 'Shade'],
        },
        ph_range: {
            title: 'Soil pH Range',
            icon: 'flask',
            options: ['5.5-6.0', '6.0-6.5', '6.5-7.0', '7.0-7.5', '7.5-8.0'],
        },
        season: {
            title: 'Growing Season',
            icon: 'calendar',
            options: ['Spring', 'Summer', 'Fall', 'Winter'],
        },
        maturity_time: {
            title: 'Time to Maturity',
            icon: 'time',
            options: ['30-45 days', '45-60 days', '60-90 days', '90+ days'],
        },
        water_needs: {
            title: 'Water Requirements',
            icon: 'water',
            options: ['Low', 'Moderate', 'High'],
        },
        temperature: {
            title: 'Temperature Range',
            icon: 'thermometer',
            options: ['Cool (10-18°C)', 'Moderate (18-25°C)', 'Warm (25-32°C)'],
        },
        humidity: {
            title: 'Humidity Preference',
            icon: 'cloud',
            options: ['Low (30-50%)', 'Moderate (50-70%)', 'High (70-90%)'],
        },
    };

    const handleFilterToggle = (category, option) => {
        setLocalFilters((prev) => ({
            ...prev,
            [category]: prev[category] === option ? null : option,
        }));
    };

    const handleClearAll = () => {
        setLocalFilters({});
        onApply({});
    };

    const handleApply = () => {
        const cleanedFilters = Object.fromEntries(
            Object.entries(localFilters).filter(([_, value]) => value != null)
        );
        onApply(cleanedFilters);
    };

    const getActiveFilterCount = () =>
        Object.values(localFilters).filter((value) => value != null).length;

    const renderFilterSection = (key, config) => (
        <Animated.View
            key={key}
            style={styles.filterSection}
            entering={FadeIn.delay(Object.keys(filterOptions).indexOf(key) * 40)}
            exiting={FadeOut.duration(200)}
        >
            <View style={styles.filterHeader}>
                <View style={styles.filterTitleContainer}>
                    <Ionicons name={config.icon} size={20} color="#4A7C59" />
                    <Text style={styles.filterTitle}>{config.title}</Text>
                </View>
                {localFilters[key] && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => handleFilterToggle(key, null)}
                    >
                        <Ionicons name="close-circle" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.optionsContainer}>
                {config.options.map((option) => {
                    const isSelected = localFilters[key] === option;
                    return (
                        <TouchableOpacity
                            key={option}
                            style={[styles.optionButton, isSelected && styles.selectedOption]}
                            onPress={() => handleFilterToggle(key, option)}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    isSelected && styles.selectedOptionText,
                                ]}
                            >
                                {option}
                            </Text>
                            {isSelected && (
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Animated.View>
    );

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <Animated.View
                            style={styles.modalContainer}
                            entering={SlideInUp.duration(400)}
                            exiting={SlideOutDown.duration(300)}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                    <Ionicons name="close" size={24} color="#1C1C1E" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>Filter Plants</Text>
                                <TouchableOpacity
                                    style={styles.clearAllButton}
                                    onPress={handleClearAll}
                                >
                                    <Text style={styles.clearAllText}>Clear All</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Filters */}
                            <ScrollView
                                style={styles.content}
                                showsVerticalScrollIndicator={false}
                                bounces
                            >
                                {Object.entries(filterOptions).map(([key, config]) =>
                                    renderFilterSection(key, config)
                                )}
                                <View style={styles.bottomSpacing} />
                            </ScrollView>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={handleApply}
                                >
                                    <Text style={styles.applyButtonText}>
                                        {getActiveFilterCount() > 0
                                            ? `Apply (${getActiveFilterCount()})`
                                            : 'Apply'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.85,
        minHeight: SCREEN_HEIGHT * 0.6,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: responsiveFonts.large(18),
        fontWeight: '700',
        color: '#1C1C1E',
    },
    clearAllButton: { paddingHorizontal: 12, paddingVertical: 6 },
    clearAllText: {
        fontSize: responsiveFonts.medium(14),
        fontWeight: '600',
        color: '#FF3B30',
    },
    content: { flex: 1, paddingHorizontal: 20 },
    filterSection: { marginVertical: 16 },
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    filterTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    filterTitle: {
        fontSize: responsiveFonts.medium(16),
        fontWeight: '600',
        color: '#1C1C1E',
    },
    clearButton: { padding: 4 },
    optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 6,
    },
    selectedOption: { backgroundColor: '#4A7C59' },
    optionText: {
        fontSize: responsiveFonts.small(14),
        fontWeight: '500',
        color: '#1C1C1E',
    },
    selectedOptionText: { color: '#FFF', fontWeight: '600' },
    bottomSpacing: { height: 20 },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    applyButton: {
        flex: 1,
        backgroundColor: '#4A7C59',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: responsiveFonts.medium(16),
        fontWeight: '600',
        color: '#FFF',
    },
});

export default FilterModal;
