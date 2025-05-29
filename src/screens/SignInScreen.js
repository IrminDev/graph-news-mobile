import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import Button from '../components/common/Button';
import { useTheme } from '../hooks/useTheme';
import authService from '../services/auth.service';

const SignInScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    // Validate inputs
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all fields',
        position: 'top',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid email address',
        position: 'top',
      });
      return;
    }

    setLoading(true);
    try {
      const loginRequest = {
        email: email.trim(),
        password: password.trim()
      };

      const response = await authService.login(loginRequest);
      
      // Store the token
      await AsyncStorage.setItem('token', response.token);
      
      // Store user data if available
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }

      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'You have been signed in successfully',
        position: 'top',
      });

      // Navigate to home and reset the navigation stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign In Failed',
        text2: error.message || 'Please check your credentials and try again',
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
          >
            <Icon name="arrow-left" size={24} color={darkMode ? '#ffffff' : '#1e293b'} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
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
              Welcome Back
            </Text>
            <Text style={[
              styles.subtitle,
              { color: darkMode ? '#cbd5e1' : '#64748b' }
            ]}>
              Sign in to your GraphNova account
            </Text>
          </View>

          <View style={styles.form}>
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
                value={email}
                onChangeText={setEmail}
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
                  placeholder="Enter your password"
                  placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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

            <Button
              title={loading ? "Signing In..." : "Sign In"}
              onPress={handleSignIn}
              disabled={loading || !email || !password}
              style={[
                styles.signInButton,
                { 
                  backgroundColor: darkMode ? '#6366f1' : '#4f46e5',
                  opacity: (loading || !email || !password) ? 0.6 : 1
                }
              ]}
              textStyle={styles.signInButtonText}
            />

            <TouchableOpacity style={styles.forgotPassword} disabled={loading}>
              <Text style={[
                styles.forgotPasswordText,
                { color: darkMode ? '#a5b4fc' : '#4f46e5' }
              ]}>
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[
              styles.footerText,
              { color: darkMode ? '#cbd5e1' : '#64748b' }
            ]}>
              Don't have an account?
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('SignUp')}
              disabled={loading}
            >
              <Text style={[
                styles.signUpLink,
                { color: darkMode ? '#a5b4fc' : '#4f46e5' }
              ]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
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
  signInButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
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
  signUpLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignInScreen;