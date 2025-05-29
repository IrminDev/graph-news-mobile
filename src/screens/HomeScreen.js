import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import Navbar from '../components/ui/Navbar';
import Hero from '../components/home/Hero';
import SearchBar from '../components/home/SearchBar';
import Features from '../components/home/Features';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';
import CallToAction from '../components/home/CallToAction';
import Footer from '../components/ui/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useTheme } from '../hooks/useTheme';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { darkMode, toggleTheme } = useTheme();

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setUser({ name: 'John Doe', email: 'john@example.com' });
      }
    } catch (error) {
      console.log('Error checking user status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner darkMode={darkMode} />;
  }

  const gradientColors = darkMode 
    ? ['#0f172a', '#1e1b4b'] 
    : ['#eff6ff', '#e0e7ff'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <Navbar 
          user={user} 
          darkMode={darkMode} 
          toggleTheme={toggleTheme}
          navigation={navigation}
        />
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Hero user={user} darkMode={darkMode} navigation={navigation} />
          <SearchBar darkMode={darkMode} navigation={navigation} />
          <Features darkMode={darkMode} />
          <HowItWorks darkMode={darkMode} />
          <Testimonials darkMode={darkMode} />
          <CallToAction user={user} darkMode={darkMode} navigation={navigation} />
          <Footer darkMode={darkMode} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default HomeScreen;