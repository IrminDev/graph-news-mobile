import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { useTheme } from '../hooks/useTheme';
import newsService from '../services/news.service';

const MyNewsScreen = () => {
  const navigation = useNavigation();
  const { darkMode } = useTheme();
  
  const [newsArticles, setNewsArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState(null);

  const PAGE_SIZE = 20;

  useFocusEffect(
    useCallback(() => {
      loadUserNews(true);
    }, [])
  );

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, newsArticles]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Load user data error:', error);
    }
  };

  const loadUserNews = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please sign in to view your articles',
          position: 'top',
        });
        navigation.navigate('SignIn');
        return;
      }

      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }

      const user = JSON.parse(userData);
      const page = reset ? 0 : currentPage;
      
      const response = await newsService.getUserNewsPaged(token, user.id, page, PAGE_SIZE);
      
      if (response && response.newsList) {
        const newArticles = response.newsList;
        
        if (reset) {
          setNewsArticles(newArticles);
        } else {
          setNewsArticles(prev => [...prev, ...newArticles]);
        }
        
        setHasMore(newArticles.length === PAGE_SIZE);
        setCurrentPage(page + 1);
      }
    } catch (error) {
      console.error('Load news error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load articles',
        position: 'top',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const filterArticles = () => {
    if (!searchQuery.trim()) {
      setFilteredArticles(newsArticles);
    } else {
      const filtered = newsArticles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.content && article.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredArticles(filtered);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    loadUserNews(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !searchQuery.trim()) {
      loadUserNews(false);
    }
  };

  const handleNewsPress = (article) => {
    navigation.navigate('NewsDetail', { newsId: article.id });
  };

  const handleDeleteNews = async (newsId) => {
    Alert.alert(
      'Delete Article',
      'Are you sure you want to delete this article? This action cannot be undone.',
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

  const getTimeLabel = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) return 'Today';
      if (diffInHours < 48) return 'Yesterday';
      if (diffInHours < 168) return 'This Week';
      if (diffInHours < 720) return 'This Month';
      return 'Older';
    } catch (error) {
      return 'Unknown';
    }
  };

  const getTimeLabelStyle = (label) => {
    const styles = {
      Today: { backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7', color: darkMode ? '#10b981' : '#16a34a' },
      Yesterday: { backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe', color: darkMode ? '#3b82f6' : '#2563eb' },
      'This Week': { backgroundColor: darkMode ? 'rgba(147, 51, 234, 0.2)' : '#f3e8ff', color: darkMode ? '#9333ea' : '#7c3aed' },
      'This Month': { backgroundColor: darkMode ? 'rgba(249, 115, 22, 0.2)' : '#fed7aa', color: darkMode ? '#f97316' : '#ea580c' },
      Older: { backgroundColor: darkMode ? 'rgba(107, 114, 128, 0.2)' : '#f3f4f6', color: darkMode ? '#6b7280' : '#4b5563' },
    };
    return styles[label] || styles.Older;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderNewsItem = ({ item }) => {
    const timeLabel = getTimeLabel(item.createdAt);
    const timeLabelStyle = getTimeLabelStyle(timeLabel);

    return (
      <TouchableOpacity
        style={[
          styles.newsCard,
          { 
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
          }
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
            style={[
              styles.deleteButton,
              { backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2' }
            ]}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
        
        <Text 
          style={[styles.newsContent, { color: darkMode ? '#cbd5e1' : '#64748b' }]}
          numberOfLines={3}
        >
          {item.content ? item.content.substring(0, 150) + (item.content.length > 150 ? '...' : '') : 'No content available'}
        </Text>
        
        <View style={styles.newsFooter}>
          <View style={styles.newsMetaLeft}>
            <Ionicons 
              name="calendar-outline" 
              size={14} 
              color={darkMode ? '#94a3b8' : '#64748b'} 
            />
            <Text style={[styles.newsDate, { color: darkMode ? '#94a3b8' : '#64748b' }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <View style={styles.newsMetaRight}>
            {item.connectionCount > 0 && (
              <View style={styles.connectionsContainer}>
                <Ionicons name="git-network-outline" size={14} color={darkMode ? '#6366f1' : '#4f46e5'} />
                <Text style={[styles.connectionsText, { color: darkMode ? '#6366f1' : '#4f46e5' }]}>
                  {item.connectionCount}
                </Text>
              </View>
            )}
            
            <View style={[styles.timeLabelBadge, timeLabelStyle]}>
              <Text style={[styles.timeLabelText, { color: timeLabelStyle.color }]}>
                {timeLabel}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={[
      styles.emptyState,
      { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
    ]}>
      <Ionicons 
        name={searchQuery ? "search-outline" : "document-text-outline"} 
        size={64} 
        color={darkMode ? '#64748b' : '#94a3b8'} 
      />
      <Text style={[styles.emptyStateTitle, { color: darkMode ? '#cbd5e1' : '#64748b' }]}>
        {searchQuery ? 'No articles found' : 'No Articles Yet'}
      </Text>
      <Text style={[styles.emptyStateText, { color: darkMode ? '#94a3b8' : '#94a3b8' }]}>
        {searchQuery 
          ? `No articles match "${searchQuery}". Try a different search term.`
          : "You haven't published any articles yet. Start by uploading your first news article."
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => navigation.navigate('UploadNews')}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.uploadButtonGradient}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.uploadButtonText}>Upload Article</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={darkMode ? '#6366f1' : '#4f46e5'} />
        <Text style={[styles.footerLoaderText, { color: darkMode ? '#94a3b8' : '#64748b' }]}>
          Loading more articles...
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }
      ]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={darkMode ? '#6366f1' : '#4f46e5'} 
          />
          <Text style={[
            styles.loadingText,
            { color: darkMode ? '#ffffff' : '#64748b' }
          ]}>
            Loading your articles...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const gradientColors = darkMode 
    ? ['#0f172a', '#1e1b4b'] 
    : ['#f8fafc', '#e0e7ff'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        {/* Header */}
        <View style={[
          styles.header,
          { 
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            borderBottomColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0',
          }
        ]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={darkMode ? '#ffffff' : '#6366f1'} 
            />
          </TouchableOpacity>
          <Text style={[
            styles.headerTitle,
            { color: darkMode ? '#ffffff' : '#1e293b' }
          ]}>
            My Articles
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('UploadNews')} 
            style={styles.addButton}
          >
            <Ionicons 
              name="add" 
              size={24} 
              color={darkMode ? '#ffffff' : '#6366f1'} 
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchInputContainer,
            { 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0',
            }
          ]}>
            <Ionicons 
              name="search" 
              size={20} 
              color={darkMode ? '#94a3b8' : '#64748b'} 
            />
            <TextInput
              style={[
                styles.searchInput,
                { color: darkMode ? '#ffffff' : '#1e293b' }
              ]}
              placeholder="Search articles..."
              placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={darkMode ? '#94a3b8' : '#64748b'} 
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Articles List */}
        <FlatList
          data={filteredArticles}
          renderItem={renderNewsItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={darkMode ? '#6366f1' : '#4f46e5'}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  newsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  newsContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  newsMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  timeLabelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeLabelText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
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
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerLoaderText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default MyNewsScreen;