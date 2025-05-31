import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { useTheme } from '../hooks/useTheme';
import userService from '../services/user.service';
import newsService from '../services/news.service';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.182:8000";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { darkMode, toggleTheme } = useTheme();
  
  // User data state
  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
  });
  const [userImageUrl, setUserImageUrl] = useState(null);
  const [newsArticles, setNewsArticles] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please sign in to view your profile',
          position: 'top',
        });
        navigation.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
        return;
      }

      const response = await userService.getMe(token);
      const userData = {
        id: response.user.id || '',
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };
      
      setUser(userData);
      
      // Fetch profile image
      if (userData.id) {
        fetchUserProfileImage(userData.id);
        fetchUserNews(token, userData.id);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      Toast.show({
        type: 'error',
        text1: 'Profile Error',
        text2: error.message || 'Failed to load profile',
        position: 'top',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const fetchUserNews = async (token, userId) => {
    setNewsLoading(true);
    try {
      const response = await newsService.getUserNewsPaged(token, userId, 0, 10);
      if (response && response.newsList) {
        setNewsArticles(response.newsList);
      }
    } catch (error) {
      console.error('News fetch error:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['token', 'user']);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
            Toast.show({
              type: 'success',
              text1: 'Signed Out',
              text2: 'You have been signed out successfully',
              position: 'top',
            });
          },
        },
      ]
    );
  };

  const handleNewsPress = (article) => {
    // Navigate to NewsDetail screen
    navigation.navigate('NewsDetail', { newsId: article.id });
  };

  const handleDeleteNews = async (newsId) => {
    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await newsService.deleteNews(token, newsId);
              
              setNewsArticles(prev => prev.filter(article => article.id !== newsId));
              Toast.show({
                type: 'success',
                text1: 'Article Deleted',
                text2: 'The article has been deleted successfully',
                position: 'top',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: error.message || 'Failed to delete article',
                position: 'top',
              });
            }
          },
        },
      ]
    );
  };

  const renderNewsItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.newsCard,
        { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
      ]}
      onPress={() => handleNewsPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.newsHeader}>
        <Text 
          style={[styles.newsTitle, { color: darkMode ? '#ffffff' : '#1e293b' }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteNews(item.id);
          }}
          style={styles.deleteButton}
        >
          <Icon name="trash-2" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <Text 
        style={[styles.newsContent, { color: darkMode ? '#cbd5e1' : '#64748b' }]}
        numberOfLines={3}
      >
        {item.content || 'No content available'}
      </Text>
      
      <View style={styles.newsFooter}>
        <Text style={[styles.newsDate, { color: darkMode ? '#94a3b8' : '#94a3b8' }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.connectionCount > 0 && (
          <View style={styles.connectionsContainer}>
            <Icon name="share-2" size={12} color={darkMode ? '#6366f1' : '#4f46e5'} />
            <Text style={[styles.connectionsText, { color: darkMode ? '#6366f1' : '#4f46e5' }]}>
              {item.connectionCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#0f172a' : '#ffffff' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={darkMode ? '#6366f1' : '#4f46e5'} />
          <Text style={[styles.loadingText, { color: darkMode ? '#cbd5e1' : '#64748b' }]}>
            Loading profile...
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
          <Text style={[styles.headerTitle, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
            Profile
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleTheme} style={styles.actionButton}>
              <Icon 
                name={darkMode ? 'sun' : 'moon'} 
                size={20} 
                color={darkMode ? '#ffffff' : '#1e293b'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Settings')} 
              style={styles.actionButton}
            >
              <Icon name="settings" size={20} color={darkMode ? '#ffffff' : '#1e293b'} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={darkMode ? '#6366f1' : '#4f46e5'}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={[
            styles.profileHeader,
            { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
          ]}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.profileBanner}
            />
            
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                {userImageUrl ? (
                  <Image source={{ uri: userImageUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: darkMode ? '#374151' : '#6366f1' }]}>
                    <Text style={styles.avatarText}>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
                  {user.name}
                </Text>
                <Text style={[styles.userEmail, { color: darkMode ? '#cbd5e1' : '#64748b' }]}>
                  {user.email}
                </Text>
                <View style={styles.roleContainer}>
                  <Icon name="shield" size={14} color={darkMode ? '#a5b4fc' : '#4f46e5'} />
                  <Text style={[styles.userRole, { color: darkMode ? '#a5b4fc' : '#4f46e5' }]}>
                    {user.role?.toLowerCase() || 'user'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={[
              styles.statCard,
              { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
            ]}>
              <Icon name="file-text" size={28} color={darkMode ? '#6366f1' : '#4f46e5'} />
              <Text style={[styles.statNumber, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
                {newsArticles.length}
              </Text>
              <Text style={[styles.statLabel, { color: darkMode ? '#cbd5e1' : '#64748b' }]}>
                Articles Published
              </Text>
            </View>

            <View style={[
              styles.statCard,
              { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
            ]}>
              <Icon name="share-2" size={28} color={darkMode ? '#10b981' : '#059669'} />
              <Text style={[styles.statNumber, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
                {newsArticles.reduce((total, article) => total + (article.connectionCount || 0), 0)}
              </Text>
              <Text style={[styles.statLabel, { color: darkMode ? '#cbd5e1' : '#64748b' }]}>
                Total Connections
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionCard,
                { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
              ]}
              onPress={() => navigation.navigate('UploadNews')}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.actionIconContainer}
              >
                <Icon name="plus" size={24} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.actionText, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
                Upload News
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
              ]}
              onPress={handleSignOut}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#ef4444' }]}>
                <Icon name="log-out" size={24} color="#ffffff" />
              </View>
              <Text style={[styles.actionText, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

          {/* News Articles */}
          <View style={styles.newsSection}>
            <View style={styles.newsSectionHeader}>
              <Text style={[styles.sectionTitle, { color: darkMode ? '#ffffff' : '#1e293b' }]}>
                Your Articles
              </Text>
              {newsArticles.length > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('MyNews')}>
                  <Text style={[styles.seeAllText, { color: darkMode ? '#6366f1' : '#4f46e5' }]}>
                    See All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {newsLoading ? (
              <View style={styles.newsLoadingContainer}>
                <ActivityIndicator size="large" color={darkMode ? '#6366f1' : '#4f46e5'} />
                <Text style={[styles.loadingText, { color: darkMode ? '#cbd5e1' : '#64748b' }]}>
                  Loading articles...
                </Text>
              </View>
            ) : newsArticles.length > 0 ? (
              <FlatList
                data={newsArticles}
                renderItem={renderNewsItem}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              <View style={[
                styles.emptyState,
                { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
              ]}>
                <Icon name="file-text" size={48} color={darkMode ? '#64748b' : '#94a3b8'} />
                <Text style={[styles.emptyStateTitle, { color: darkMode ? '#cbd5e1' : '#64748b' }]}>
                  No Articles Yet
                </Text>
                <Text style={[styles.emptyStateText, { color: darkMode ? '#94a3b8' : '#94a3b8' }]}>
                  You haven't published any articles yet. Start by uploading your first news article.
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => navigation.navigate('UploadNews')}
                >
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={styles.uploadButtonGradient}
                  >
                    <Icon name="plus" size={20} color="#ffffff" />
                    <Text style={styles.uploadButtonText}>Upload Article</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileBanner: {
    height: 100,
  },
  profileContent: {
    padding: 20,
    alignItems: 'center',
    marginTop: -50,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  avatarPlaceholder: {
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
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  newsSection: {
    marginBottom: 20,
  },
  newsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  newsLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  newsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  newsContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsDate: {
    fontSize: 12,
  },
  connectionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  uploadButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;