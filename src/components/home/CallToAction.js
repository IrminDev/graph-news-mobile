import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import Button from '../common/Button';

const CallToAction = ({ user, darkMode, navigation }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withTiming(1, { duration: 500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const gradientColors = darkMode
    ? ['#1e1b4b', '#581c87']
    : ['#4f46e5', '#7c3aed'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text style={styles.title}>Ready to Transform How You Understand News?</Text>
        <Text style={styles.subtitle}>
          Join our growing community of researchers, journalists, analysts, and curious minds.
        </Text>

        {user ? (
          <View style={styles.userActions}>
            <Text style={styles.welcomeBack}>
              Welcome back! Continue exploring or contribute to our knowledge database.
            </Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Go to Dashboard"
                onPress={() => navigation.navigate('Profile')}
                style={[
                  styles.primaryButton,
                  { backgroundColor: darkMode ? '#ffffff' : '#1e293b' }
                ]}
                textStyle={[
                  styles.primaryButtonText,
                  { color: darkMode ? '#1e1b4b' : '#ffffff' }
                ]}
              />
              <Button
                title="Upload News"
                onPress={() => navigation.navigate('Upload')}
                style={styles.secondaryButton}
                textStyle={styles.secondaryButtonText}
              />
            </View>
          </View>
        ) : (
          <View style={styles.guestActions}>
            <View style={styles.buttonContainer}>
              <Button
                title="Get Started — It's Free"
                onPress={() => navigation.navigate('SignUp')}
                style={[
                  styles.primaryButton,
                  { backgroundColor: darkMode ? '#ffffff' : '#1e293b' }
                ]}
                textStyle={[
                  styles.primaryButtonText,
                  { color: darkMode ? '#1e1b4b' : '#ffffff' }
                ]}
              />
              <Button
                title="Sign In"
                onPress={() => navigation.navigate('SignIn')}
                style={styles.secondaryButton}
                textStyle={styles.secondaryButtonText}
              />
            </View>
            <Text style={styles.disclaimer}>
              No credit card required. Start with our free tier today.
            </Text>
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 600,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  userActions: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeBack: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  guestActions: {
    width: '100%',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

export default CallToAction;