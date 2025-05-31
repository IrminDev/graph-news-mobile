import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import Button from '../common/Button';
import NetworkGraphSVG from './NetworkGraphSVG';

const { width } = Dimensions.get('window');

const Hero = ({ user, darkMode, navigation }) => {
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(-20);
  const descriptionOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 700 });
    titleTranslateY.value = withTiming(0, { duration: 700 });
    descriptionOpacity.value = withDelay(300, withTiming(1, { duration: 700 }));
    buttonsOpacity.value = withDelay(600, withTiming(1, { duration: 700 }));
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const descriptionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.Text style={[
          styles.title,
          { color: darkMode ? '#ffffff' : '#1e293b' },
          titleAnimatedStyle
        ]}>
          Transform News
        </Animated.Text>
        
        <LinearGradient
          colors={darkMode ? ['#6366f1', '#8b5cf6'] : ['#4f46e5', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientTextContainer}
        >
          <Text style={styles.gradientTitle}>Into Knowledge Graphs</Text>
        </LinearGradient>

        <Animated.Text style={[
          styles.description,
          { color: darkMode ? '#cbd5e1' : '#64748b' },
          descriptionAnimatedStyle
        ]}>
          Our AI-powered platform analyzes news from around the world, creating interactive knowledge graphs that reveal connections and insights hidden in the data.
        </Animated.Text>

        <Animated.View style={[styles.buttonContainer, buttonsAnimatedStyle]}>
          <Button
            title={user ? "Upload News" : "Get Started"}
            onPress={() => navigation.navigate(user ? 'Upload' : 'SignUp')}
            style={[styles.primaryButton, { backgroundColor: darkMode ? '#6366f1' : '#4f46e5' }]}
            textStyle={styles.primaryButtonText}
            icon="zap"
          />
          <Button
            title="Learn More"
            onPress={() => {/* Navigate to how it works section */}}
            style={[
              styles.secondaryButton,
              { 
                borderColor: darkMode ? '#6366f1' : '#4f46e5',
                backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
              }
            ]}
            textStyle={[
              styles.secondaryButtonText,
              { color: darkMode ? '#a5b4fc' : '#4f46e5' }
            ]}
          />
        </Animated.View>
      </View>

      <View style={styles.graphContainer}>
        <NetworkGraphSVG darkMode={darkMode} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 48,
  },
  gradientTextContainer: {
    borderRadius: 8,
    paddingHorizontal: 0,
    marginBottom: 24,
  },
  gradientTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
    opacity: 0.7,
    lineHeight: 48,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  graphContainer: {
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default Hero;