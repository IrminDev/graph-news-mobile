import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingSpinner = ({ darkMode }) => {
  const gradientColors = darkMode 
    ? ['#0f172a', '#1e1b4b'] 
    : ['#eff6ff', '#e0e7ff'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <ActivityIndicator 
        size="large" 
        color={darkMode ? '#6366f1' : '#4f46e5'} 
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;