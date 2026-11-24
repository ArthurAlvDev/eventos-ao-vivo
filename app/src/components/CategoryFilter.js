// src/components/CategoryFilter.js
import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME } from '../constants/config';

export const CategoryFilter = React.memo(({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <TouchableOpacity
            key={cat}
            activeOpacity={0.7}
            style={[styles.chip, isSelected && styles.chipActive]}
            onPress={() => onSelectCategory(cat)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: 1,
    borderColor: THEME.surfaceBorder,
  },
  chipActive: {
    backgroundColor: THEME.accentGreen,
    borderColor: THEME.accentGreen,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  chipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
});
