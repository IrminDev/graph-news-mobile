import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import Button from '../components/common/Button';
import { useTheme } from '../hooks/useTheme';
import userService from '../services/user.service';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.182:8080";

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { darkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingImage, setUpdatingImage] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [userImageUrl, setUserImageUrl] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('SignIn');
        return;
      }

      const response = await userService.getMe(token);
      setUser(response.user);
      setProfileForm({
        name: response.user.name || '',
        email: response.user.email || '',
      });

      // Fetch profile image if user ID exists
      if (response.user.id) {
        fetchUserProfileImage(response.user.id);
      }
    } catch (error) {
      console.error('Load profile error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load profile',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfileImage = (userId) => {
    const timestamp = new Date().getTime();
    const imageUrl = `${API_URL}/api/user/image/${userId}?t=${timestamp}`;
    
    // Test if image exists
    Image.getSize(
      imageUrl,
      () => setUserImageUrl(imageUrl),
      () => setUserImageUrl(null)
    );
  };

  const handleProfileUpdate = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all fields',
        position: 'top',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid email address',
        position: 'top',
      });
      return;
    }

    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const updateRequest = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      };

      const response = await userService.updateMeInfo(token, updateRequest);
      setUser(response.user);
      
      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully',
        position: 'top',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update profile',
        position: 'top',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to select an image',
      [
        {
          text: 'Camera',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Gallery',
          onPress: () => pickImage('library'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image',
        position: 'top',
      });
    }
  };

  const uploadImage = async (imageAsset) => {
    setUpdatingImage(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const imageData = {
        uri: imageAsset.uri,
        type: imageAsset.type || 'image/jpeg',
        name: imageAsset.fileName || 'profile.jpg',
      };

      const response = await userService.updateMeImage(token, imageData);
      setUser(response.user);
      
      // Update stored user data
      await AsyncStorage.setItem('user', JSON.stringify(response.user));

      // Refresh the profile image
      if (response.user.id) {
        fetchUserProfileImage(response.user.id);
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile image updated successfully',
        position: 'top',
      });
    } catch (error) {
      console.error('Upload image error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.message || 'Failed to update profile image',
        position: 'top',
      });
    } finally {
      setUpdatingImage(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all password fields',
        position: 'top',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'New password must be at least 6 characters long',
        position: 'top',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'New passwords do not match',
        position: 'top',
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const passwordRequest = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      };

      await userService.updatePassword(token, passwordRequest);
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password updated successfully',
        position: 'top',
      });
    } catch (error) {
      console.error('Update password error:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update password',
        position: 'top',
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['token', 'user']);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: darkMode ? '#0f172a' : '#eff6ff' }
      ]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={darkMode ? '#6366f1' : '#4f46e5'} 
          />
          <Text style={[
            styles.loadingText,
            { color: darkMode ? '#ffffff' : '#1e293b' }
          ]}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const gradientColors = darkMode 
    ? ['#0f172a', '#1e1b4b'] 
    : ['#eff6ff', '#e0e7ff'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={darkMode ? '#ffffff' : '#1e293b'} />
          </TouchableOpacity>
          <Text style={[
            styles.headerTitle,
            { color: darkMode ? '#ffffff' : '#1e293b' }
          ]}>
            Settings
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture Section */}
          <View style={[
            styles.section,
            { 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
            }
          ]}>
            <Text style={[
              styles.sectionTitle,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]}>
              Profile Picture
            </Text>
            
            <View style={styles.profileImageContainer}>
              <View style={styles.imageWrapper}>
                {userImageUrl ? (
                  <Image 
                    source={{ uri: userImageUrl }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={[
                    styles.profileImagePlaceholder,
                    { backgroundColor: darkMode ? '#374151' : '#6366f1' }
                  ]}>
                    <Text style={styles.avatarText}>
                      {user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity
                  onPress={handleImagePicker}
                  style={[
                    styles.editImageButton,
                    { backgroundColor: darkMode ? '#6366f1' : '#4f46e5' }
                  ]}
                  disabled={updatingImage}
                >
                  {updatingImage ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Icon name="camera" size={16} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
              
              <Text style={[
                styles.imageHint,
                { color: darkMode ? '#cbd5e1' : '#64748b' }
              ]}>
                Tap to change your profile picture
              </Text>
            </View>
          </View>

          {/* Profile Information Section */}
          <View style={[
            styles.section,
            { 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
            }
          ]}>
            <Text style={[
              styles.sectionTitle,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]}>
              Profile Information
            </Text>

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
                    backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.5)' : 'rgba(79, 70, 229, 0.3)',
                    color: darkMode ? '#ffffff' : '#1e293b',
                  }
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                value={profileForm.name}
                onChangeText={(value) => setProfileForm(prev => ({ ...prev, name: value }))}
                editable={!updating}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[
                styles.label,
                { color: darkMode ? '#ffffff' : '#1e293b' }
              ]}>
                Email Address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.5)' : 'rgba(79, 70, 229, 0.3)',
                    color: darkMode ? '#ffffff' : '#1e293b',
                  }
                ]}
                placeholder="Enter your email address"
                placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                value={profileForm.email}
                onChangeText={(value) => setProfileForm(prev => ({ ...prev, email: value }))}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!updating}
              />
            </View>

            <Button
              title={updating ? "Updating..." : "Update Profile"}
              onPress={handleProfileUpdate}
              disabled={updating}
              style={[
                styles.updateButton,
                { 
                  backgroundColor: darkMode ? '#6366f1' : '#4f46e5',
                  opacity: updating ? 0.6 : 1
                }
              ]}
              textStyle={styles.updateButtonText}
            />
          </View>

          {/* Password Section */}
          <View style={[
            styles.section,
            { 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
            }
          ]}>
            <View style={styles.sectionHeader}>
              <Text style={[
                styles.sectionTitle,
                { color: darkMode ? '#ffffff' : '#1e293b' }
              ]}>
                Password
              </Text>
              <TouchableOpacity
                onPress={() => setShowPasswordForm(!showPasswordForm)}
                style={[
                  styles.toggleButton,
                  { borderColor: darkMode ? '#6366f1' : '#4f46e5' }
                ]}
              >
                <Text style={[
                  styles.toggleButtonText,
                  { color: darkMode ? '#6366f1' : '#4f46e5' }
                ]}>
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>

            {showPasswordForm && (
              <View style={styles.passwordForm}>
                <View style={styles.inputContainer}>
                  <Text style={[
                    styles.label,
                    { color: darkMode ? '#ffffff' : '#1e293b' }
                  ]}>
                    Current Password
                  </Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                          borderColor: darkMode ? 'rgba(100, 116, 139, 0.5)' : 'rgba(79, 70, 229, 0.3)',
                          color: darkMode ? '#ffffff' : '#1e293b',
                        }
                      ]}
                      placeholder="Enter current password"
                      placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                      value={passwordForm.currentPassword}
                      onChangeText={(value) => setPasswordForm(prev => ({ ...prev, currentPassword: value }))}
                      secureTextEntry={!showPasswords.current}
                      editable={!updatingPassword}
                    />
                    <TouchableOpacity
                      onPress={() => togglePasswordVisibility('current')}
                      style={styles.eyeButton}
                    >
                      <Icon
                        name={showPasswords.current ? 'eye-off' : 'eye'}
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
                    New Password
                  </Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                          borderColor: darkMode ? 'rgba(100, 116, 139, 0.5)' : 'rgba(79, 70, 229, 0.3)',
                          color: darkMode ? '#ffffff' : '#1e293b',
                        }
                      ]}
                      placeholder="Enter new password"
                      placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                      value={passwordForm.newPassword}
                      onChangeText={(value) => setPasswordForm(prev => ({ ...prev, newPassword: value }))}
                      secureTextEntry={!showPasswords.new}
                      editable={!updatingPassword}
                    />
                    <TouchableOpacity
                      onPress={() => togglePasswordVisibility('new')}
                      style={styles.eyeButton}
                    >
                      <Icon
                        name={showPasswords.new ? 'eye-off' : 'eye'}
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
                    Confirm New Password
                  </Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.9)',
                          borderColor: darkMode ? 'rgba(100, 116, 139, 0.5)' : 'rgba(79, 70, 229, 0.3)',
                          color: darkMode ? '#ffffff' : '#1e293b',
                        }
                      ]}
                      placeholder="Confirm new password"
                      placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                      value={passwordForm.confirmPassword}
                      onChangeText={(value) => setPasswordForm(prev => ({ ...prev, confirmPassword: value }))}
                      secureTextEntry={!showPasswords.confirm}
                      editable={!updatingPassword}
                    />
                    <TouchableOpacity
                      onPress={() => togglePasswordVisibility('confirm')}
                      style={styles.eyeButton}
                    >
                      <Icon
                        name={showPasswords.confirm ? 'eye-off' : 'eye'}
                        size={20}
                        color={darkMode ? '#64748b' : '#94a3b8'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Button
                  title={updatingPassword ? "Updating..." : "Update Password"}
                  onPress={handlePasswordUpdate}
                  disabled={updatingPassword}
                  style={[
                    styles.updateButton,
                    { 
                      backgroundColor: darkMode ? '#6366f1' : '#4f46e5',
                      opacity: updatingPassword ? 0.6 : 1
                    }
                  ]}
                  textStyle={styles.updateButtonText}
                />
              </View>
            )}
          </View>

          {/* App Settings Section */}
          <View style={[
            styles.section,
            { 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
            }
          ]}>
            <Text style={[
              styles.sectionTitle,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]}>
              App Settings
            </Text>

            <TouchableOpacity
              onPress={toggleTheme}
              style={styles.settingItem}
            >
              <View style={styles.settingItemLeft}>
                <Icon 
                  name={darkMode ? 'sun' : 'moon'} 
                  size={20} 
                  color={darkMode ? '#6366f1' : '#4f46e5'} 
                />
                <Text style={[
                  styles.settingItemText,
                  { color: darkMode ? '#ffffff' : '#1e293b' }
                ]}>
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </Text>
              </View>
              <Icon 
                name="chevron-right" 
                size={20} 
                color={darkMode ? '#64748b' : '#94a3b8'} 
              />
            </TouchableOpacity>
          </View>

          {/* Sign Out Section */}
          <View style={[
            styles.section,
            { 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
            }
          ]}>
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              style={[
                styles.signOutButton,
                { backgroundColor: '#ef4444' }
              ]}
              textStyle={styles.signOutButtonText}
            />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  passwordForm: {
    marginTop: 16,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  updateButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  signOutButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;