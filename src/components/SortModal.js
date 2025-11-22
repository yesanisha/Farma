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
import Animated, { SlideInUp, FadeIn } from 'react-native-reanimated';
import { responsiveFonts } from '../utils/responsive';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SortModal = ({ visible, selectedSort = 'name_asc', onApply, onClose }) => {
    const [currentSort, setCurrentSort] = useState(selectedSort);

    useEffect(() => {
        if (visible) setCurrentSort(selectedSort);
    }, [visible, selectedSort]);

    const sortOptions = [
        { id: 'name_asc', title: 'Name (A-Z)', icon: 'text', description: 'Alphabetical order' },
        { id: 'name_desc', title: 'Name (Z-A)', icon: 'text', description: 'Reverse alphabetical' },
        { id: 'difficulty_asc', title: 'Difficulty (Easy first)', icon: 'bar-chart', description: 'Beginner to Advanced' },
        { id: 'difficulty_desc', title: 'Difficulty (Hard first)', icon: 'bar-chart', description: 'Advanced to Beginner' },
        { id: 'maturity_asc', title: 'Quick Growing', icon: 'speedometer', description: 'Shortest maturity time' },
        { id: 'maturity_desc', title: 'Long Growing', icon: 'hourglass', description: 'Longest maturity time' },
        { id: 'popularity', title: 'Most Popular', icon: 'star', description: 'Based on favorites' },
        { id: 'newest', title: 'Recently Added', icon: 'time', description: 'Latest additions' },
    ];

    const handleApply = () => {
        onApply(currentSort);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            statusBarTranslucent={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={styles.modalContainer}
                            entering={SlideInUp.duration(400)}
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                    <Ionicons name="close" size={24} color="#1C1C1E" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>Sort Plants</Text>
                                <View style={styles.placeholder} />
                            </View>

                            {/* Sort Options */}
                            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                                {sortOptions.map((option, index) => {
                                    const isSelected = currentSort === option.id;
                                    return (
                                        <Animated.View
                                            key={option.id}
                                            entering={FadeIn.delay(index * 50).duration(300)}
                                        >
                                            <TouchableOpacity
                                                style={[
                                                    styles.sortOption,
                                                    isSelected && styles.selectedSortOption,
                                                ]}
                                                onPress={() => setCurrentSort(option.id)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.sortOptionContent}>
                                                    <View
                                                        style={[
                                                            styles.iconContainer,
                                                            isSelected && styles.selectedIconContainer,
                                                        ]}
                                                    >
                                                        <Ionicons
                                                            name={option.icon}
                                                            size={20}
                                                            color={isSelected ? '#FFFFFF' : '#4A7C59'}
                                                        />
                                                    </View>
                                                    <View style={styles.textContainer}>
                                                        <Text
                                                            style={[
                                                                styles.sortTitle,
                                                                isSelected && styles.selectedSortTitle,
                                                            ]}
                                                        >
                                                            {option.title}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.sortDescription,
                                                                isSelected &&
                                                                styles.selectedSortDescription,
                                                            ]}
                                                        >
                                                            {option.description}
                                                        </Text>
                                                    </View>
                                                    {isSelected && (
                                                        <View style={styles.checkmarkContainer}>
                                                            <Ionicons
                                                                name="checkmark-circle"
                                                                size={24}
                                                                color="#4A7C59"
                                                            />
                                                        </View>
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    );
                                })}
                            </ScrollView>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={handleApply}
                                >
                                    <Text style={styles.applyButtonText}>Apply</Text>
                                </TouchableOpacity>
                                <Text style={styles.footerText}>
                                    Select how you want to organize your plant list
                                </Text>
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
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.75,
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
    placeholder: { width: 32 },
    content: { paddingHorizontal: 20, paddingVertical: 8 },
    sortOption: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    selectedSortOption: {
        backgroundColor: '#F0F8F0',
        borderColor: '#4A7C59',
        borderWidth: 2,
    },
    sortOptionContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    selectedIconContainer: { backgroundColor: '#4A7C59' },
    textContainer: { flex: 1 },
    sortTitle: {
        fontSize: responsiveFonts.medium(16),
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 2,
    },
    selectedSortTitle: { color: '#4A7C59' },
    sortDescription: { fontSize: responsiveFonts.small(13), color: '#8E8E93', lineHeight: 18 },
    selectedSortDescription: { color: '#6B7C6B' },
    checkmarkContainer: { marginLeft: 12 },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        alignItems: 'center',
    },
    footerText: {
        fontSize: responsiveFonts.small(13),
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 18,
        marginTop: 8,
    },
    applyButton: {
        backgroundColor: '#4A7C59',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 40,
        marginBottom: 8,
    },
    applyButtonText: {
        fontSize: responsiveFonts.medium(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default SortModal;
