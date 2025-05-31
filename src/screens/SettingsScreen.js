import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../hooks/useTheme';
import userService from '../services/user.service';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.182:8080";

const SettingsScreen = () => {
    const navigation = useNavigation();
    const { darkMode, toggleTheme } = useTheme();
    
    const [user, setUser] = useState({ id: '', name: '', email: '', role: '' });
    const [userImageUrl, setUserImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    // Modal states
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  
      // Form states
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await userService.getMe(token);
            const userData = {
                id: response.user.id || '',
                name: response.user.name,
                email: response.user.email,
                role: response.user.role,
            };
            
            setUser(userData);
            setEditForm({ name: userData.name, email: userData.email });
            
            if (userData.id) {
                const timestamp = new Date().getTime();
                const imageUrl = `${API_URL}/api/user/image/${userData.id}?t=${timestamp}`;
                Image.getSize(
                    imageUrl,
                    () => setUserImageUrl(imageUrl),
                    () => setUserImageUrl(null)
                );
            }
        } catch (error) {
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message || 'Failed to load user data',
            position: 'top',
        });
        } finally {
        setLoading(false);
        }
    };

    const handleImagePicker = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
            Toast.show({
                type: 'error',
                text1: 'Permission Required',
                text2: 'Permission to access camera roll is required',
                position: 'top',
           });
        return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
        }
    };

    const handleUpdateProfile = async () => {
        // Validation (same as before)
        if (!editForm.name.trim() || editForm.name.trim().length < 3) {
        Toast.show({
            type: 'error',
            text1: 'Invalid Name',
            text2: 'Name must be at least 3 characters long',
            position: 'top',
        });
        return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editForm.email.trim())) {
        Toast.show({
            type: 'error',
            text1: 'Invalid Email',
            text2: 'Please enter a valid email address',
            position: 'top',
        });
        return;
        }

        try {
        const token = await AsyncStorage.getItem('token');
        const updateRequest = {
            name: editForm.name.trim(),
            email: editForm.email.trim(),
        };

        // Call exactly like the web app: updateMeWithImage(token, request, file)
        // Pass null instead of a file when no image
        const response = await userService.updateMeWithImage(token, updateRequest, null);
        
        setUser(prev => ({ 
            ...prev, 
            name: updateRequest.name, 
            email: updateRequest.email 
        }));
        
        setEditModalVisible(false);
        
        Toast.show({
            type: 'success',
            text1: 'Profile Updated',
            text2: 'Your profile has been updated successfully',
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
        }
    };

    const uploadProfileImage = async (imageUri) => {
        setUploadingImage(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const updateRequest = { 
            name: user.name, 
            email: user.email 
            };
            
            // Convert image URI to file-like object (similar to web File API)
            const response = await fetch(imageUri);
            const blob = await response.blob();
            
            // Get file info
            const filename = imageUri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const fileType = match ? `image/${match[1]}` : blob.type || 'image/jpeg';
            
            // Create a File-like object that mimics web File API
            const imageFile = {
            name: filename,
            type: fileType,
            size: blob.size,
            blob: blob,
            // Add methods that File objects have
            stream: () => blob.stream(),
            text: () => blob.text(),
            arrayBuffer: () => blob.arrayBuffer(),
            // For compatibility with FormData
            [Symbol.toStringTag]: 'File'
            };
            
            // Call the service with the file-like object
            await userService.updateMeWithImage(token, updateRequest, imageFile);
            
            Toast.show({
            type: 'success',
            text1: 'Profile Updated',
            text2: 'Profile image updated successfully',
            position: 'top',
            });
            
            // Refresh image with timestamp to avoid cache
            setTimeout(() => {
            const timestamp = new Date().getTime();
            const imageUrl = `${API_URL}/api/user/image/${user.id}?t=${timestamp}`;
            setUserImageUrl(imageUrl);
            }, 1000);
            
        } catch (error) {
            console.error('Upload image error:', error);
            Toast.show({
            type: 'error',
            text1: 'Upload Failed',
            text2: error.message || 'Failed to update profile image',
            position: 'top',
            });
        } finally {
            setUploadingImage(false);
        }
    };
    
    const handleUpdatePassword = async () => {
    // Validate password inputs
    if (!passwordForm.currentPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Current Password Required',
        text2: 'Please enter your current password',
        position: 'top',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Password Too Short',
        text2: 'New password must be at least 6 characters long',
        position: 'top',
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'New passwords do not match',
        position: 'top',
      });
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await userService.updatePassword(token, {
        oldPassword: passwordForm.currentPassword, // Note: backend expects 'oldPassword'
        newPassword: passwordForm.newPassword,
      });
      
      setPasswordModalVisible(false);
      setPasswordForm({ 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      });
      
      Toast.show({
        type: 'success',
        text1: 'Password Updated',
        text2: 'Your password has been updated successfully',
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
    }
  };


  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await userService.deleteMe(token);
              
              await AsyncStorage.multiRemove(['token', 'user']);
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              
              Toast.show({
                type: 'success',
                text1: 'Account Deleted',
                text2: 'Your account has been deleted successfully',
                position: 'top',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: error.message || 'Failed to delete account',
                position: 'top',
              });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#0f172a' : '#ffffff' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={darkMode ? '#6366f1' : '#4f46e5'} />
          <Text style={[styles.loadingText, { color: darkMode ? '#cbd5e1' : '#64748b' }]}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const gradientColors = darkMode ? ['#0f172a', '#1e1b4b'] : ['#eff6ff', '#e0e7ff'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={darkMode ? '#ffffff' : '#1e293b'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
            Settings
          </Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <Icon name={darkMode ? 'sun' : 'moon'} size={24} color={darkMode ? '#ffffff' : '#1e293b'} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Profile Section */}
          <View style={[styles.section, { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }]}>
            <Text style={[styles.sectionTitle, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
              Profile Information
            </Text>
            
            <View style={styles.profileImageSection}>
              <TouchableOpacity onPress={handleImagePicker} disabled={uploadingImage}>
                {userImageUrl ? (
                  <Image source={{ uri: userImageUrl }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImagePlaceholder, { backgroundColor: darkMode ? '#374151' : '#6366f1' }]}>
                    <Text style={styles.profileImageText}>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#ffffff" />
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Icon name="camera" size={16} color="#ffffff" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
                  {user.name}
                </Text>
                <Text style={[styles.profileEmail, { color: darkMode ? '#cbd5e1' : '#64748b' }]}>
                  {user.email}
                </Text>
                <Text style={[styles.profileRole, { color: darkMode ? '#a5b4fc' : '#4f46e5' }]}>
                  {user.role?.toLowerCase() || 'user'}
                </Text>
              </View>
            </View>
          </View>

          {/* Settings Options */}
          <View style={styles.settingsContainer}>
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }]}
              onPress={() => setEditModalVisible(true)}
            >
              <Icon name="edit-3" size={20} color={darkMode ? '#6366f1' : '#4f46e5'} />
              <Text style={[styles.settingText, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
                Edit Profile
              </Text>
              <Icon name="chevron-right" size={20} color={darkMode ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }]}
              onPress={() => setPasswordModalVisible(true)}
            >
              <Icon name="lock" size={20} color={darkMode ? '#6366f1' : '#4f46e5'} />
              <Text style={[styles.settingText, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
                Change Password
              </Text>
              <Icon name="chevron-right" size={20} color={darkMode ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }]}
              onPress={handleDeleteAccount}
            >
              <Icon name="trash-2" size={20} color="#dc2626" />
              <Text style={[styles.settingText, { color: '#dc2626' }]}>
                Delete Account
              </Text>
              <Icon name="chevron-right" size={20} color={darkMode ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: darkMode ? '#0f172a' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.modalButton, { color: darkMode ? '#64748b' : '#64748b' }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: darkMode ? '#ffffff' : '#1e293b' }]}>Edit Profile</Text>
              <TouchableOpacity onPress={handleUpdateProfile}>
                <Text style={[styles.modalButton, { color: darkMode ? '#6366f1' : '#4f46e5' }]}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: darkMode ? '#ffffff' : '#1e293b' }]}>Name</Text>
                <TextInput
                  style={[styles.modalInput, {
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 1)',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(226, 232, 240, 1)',
                    color: darkMode ? '#ffffff' : '#1e293b',
                  }]}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your name"
                  placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: darkMode ? '#ffffff' : '#1e293b' }]}>Email</Text>
                <TextInput
                  style={[styles.modalInput, {
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 1)',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(226, 232, 240, 1)',
                    color: darkMode ? '#ffffff' : '#1e293b',
                  }]}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                  placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={passwordModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setPasswordModalVisible(false)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: darkMode ? '#0f172a' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Text style={[styles.modalButton, { color: darkMode ? '#64748b' : '#64748b' }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: darkMode ? '#ffffff' : '#1e293b' }]}>Change Password</Text>
              <TouchableOpacity onPress={handleUpdatePassword}>
                <Text style={[styles.modalButton, { color: darkMode ? '#6366f1' : '#4f46e5' }]}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: darkMode ? '#ffffff' : '#1e293b' }]}>Current Password</Text>
                <TextInput
                  style={[styles.modalInput, {
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 1)',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(226, 232, 240, 1)',
                    color: darkMode ? '#ffffff' : '#1e293b',
                  }]}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Enter current password"
                  placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: darkMode ? '#ffffff' : '#1e293b' }]}>New Password</Text>
                <TextInput
                  style={[styles.modalInput, {
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 1)',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(226, 232, 240, 1)',
                    color: darkMode ? '#ffffff' : '#1e293b',
                  }]}
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                  placeholder="Enter new password"
                  placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: darkMode ? '#ffffff' : '#1e293b' }]}>Confirm New Password</Text>
                <TextInput
                  style={[styles.modalInput, {
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 1)',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(226, 232, 240, 1)',
                    color: darkMode ? '#ffffff' : '#1e293b',
                  }]}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Confirm new password"
                  placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
                  secureTextEntry
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', flex: 1, textAlign: 'center' },
  themeButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  profileImageSection: { flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginRight: 16 },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImageText: { fontSize: 32, fontWeight: 'bold', color: '#ffffff' },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  profileEmail: { fontSize: 16, marginBottom: 4 },
  profileRole: { fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  settingsContainer: { gap: 12 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingText: { flex: 1, fontSize: 16, marginLeft: 12 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalButton: { fontSize: 16, fontWeight: '500' },
  modalContent: { flex: 1, padding: 20 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  modalInput: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
});

export default SettingsScreen;