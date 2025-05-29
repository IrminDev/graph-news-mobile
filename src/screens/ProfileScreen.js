import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const ProfileScreen = () => {
  const { darkMode } = useTheme();

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: darkMode ? '#0f172a' : '#ffffff' }
    ]}>
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: darkMode ? '#ffffff' : '#1e293b' }
        ]}>
          Profile Screen
        </Text>
        <Text style={[
          styles.subtitle,
          { color: darkMode ? '#cbd5e1' : '#64748b' }
        ]}>
          User profile and dashboard coming soon...
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProfileScreen;