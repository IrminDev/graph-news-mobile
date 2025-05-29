import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';

const SearchBar = ({ darkMode, navigation }) => {
  const [query, setQuery] = useState('');
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(900, withTiming(1, { duration: 700 }));
    translateY.value = withDelay(900, withTiming(0, { duration: 700 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleSearch = () => {
    if (query.trim()) {
      navigation.navigate('Search', { query: query.trim() });
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.searchContainer, animatedStyle]}>
        <View style={[
          styles.searchBox,
          {
            backgroundColor: darkMode 
              ? 'rgba(30, 41, 59, 0.5)' 
              : 'rgba(255, 255, 255, 0.8)',
            borderColor: darkMode 
              ? 'rgba(100, 116, 139, 0.3)' 
              : 'rgba(79, 70, 229, 0.2)',
          }
        ]}>
          <TextInput
            style={[
              styles.input,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]}
            placeholder="Search knowledge graphs..."
            placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <LinearGradient
              colors={darkMode ? ['#6366f1', '#8b5cf6'] : ['#4f46e5', '#7c3aed']}
              style={styles.searchButtonGradient}
            >
              <Icon name="search" size={20} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchContainer: {
    width: '100%',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchBar;