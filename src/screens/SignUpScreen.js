import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import Button from '../components/common/Button';
import { useTheme } from '../hooks/useTheme';
import authService from '../services/auth.service';

const SignUpScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    // Check if all fields are filled
    if (!formData.name.trim() || !formData.email.trim() || 
        !formData.password.trim() || !formData.confirmPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all fields',
        position: 'top',
      });
      return false;
    }

    // Validate name length
    if (formData.name.trim().length < 2) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Name must be at least 2 characters long',
        position: 'top',
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid email address',
        position: 'top',
      });
      return false;
    }

    // Validate password length
    if (formData.password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Password must be at least 6 characters long',
        position: 'top',
      });
      return false;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Passwords do not match',
        position: 'top',
      });
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const signUpRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim()
      };

      const response = await authService.register(signUpRequest);
      
      // Store the token
      await AsyncStorage.setItem('token', response.token);
      
      // Store user data if available
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }

      Toast.show({
        type: 'success',
        text1: 'Welcome to GraphNova!',
        text2: 'Your account has been created successfully',
        position: 'top',
      });

      // Navigate to home and reset the navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Registration error:', error);
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message || 'Please try again later',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const gradientColors = darkMode 
    ? ['#0f172a', '#1e1b4b'] 
    : ['#eff6ff', '#e0e7ff'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            disabled={loading}
          >
            <Icon name="arrow-left" size={24} color={darkMode ? '#ffffff' : '#1e293b'} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            <Icon 
              name="share-2" 
              size={40} 
              color={darkMode ? '#6366f1' : '#4f46e5'} 
              style={styles.logo} 
            />
            <Text style={[
              styles.title,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]}>
              Join GraphNova
            </Text>
            <Text style={[
              styles.subtitle,
              { color: darkMode ? '#cbd5e1' : '#64748b' }
            ]}>
              Create your account to start exploring knowledge graphs
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[
                styles.label,
                { color: darkMode ? '#ffffff' : '#1e293b' }
              ]}>
                Full Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
                    color: darkMode ? '#ffffff' : '#1e293b',
                  }
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                autoComplete="name"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[
                styles.label,
                { color: darkMode ? '#ffffff' : '#1e293b' }
              ]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
                    color: darkMode ? '#ffffff' : '#1e293b',
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[
                styles.label,
                { color: darkMode ? '#ffffff' : '#1e293b' }
              ]}>
                Password
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
                      color: darkMode ? '#ffffff' : '#1e293b',
                    }
                  ]}
                  placeholder="Create a password"
                  placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={darkMode ? '#64748b' : '#94a3b8'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[
                styles.label,
                { color: darkMode ? '#ffffff' : '#1e293b' }
              ]}>
                Confirm Password
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
                      color: darkMode ? '#ffffff' : '#1e293b',
                    }
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  <Icon
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={darkMode ? '#64748b' : '#94a3b8'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title={loading ? "Creating Account..." : "Create Account"}
              onPress={handleSignUp}
              disabled={loading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword}
              style={[
                styles.signUpButton,
                { 
                  backgroundColor: darkMode ? '#6366f1' : '#4f46e5',
                  opacity: (loading || !formData.name || !formData.email || !formData.password || !formData.confirmPassword) ? 0.6 : 1
                }
              ]}
              textStyle={styles.signUpButtonText}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[
              styles.footerText,
              { color: darkMode ? '#cbd5e1' : '#64748b' }
            ]}>
              Already have an account?
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SignIn')}
              disabled={loading}
            >
              <Text style={[
                styles.signInLink,
                { color: darkMode ? '#a5b4fc' : '#4f46e5' }
              ]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 50,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  signUpButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 16,
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignUpScreen;