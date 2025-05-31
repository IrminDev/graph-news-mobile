import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Share,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTheme } from '../hooks/useTheme';
import newsService from '../services/news.service';

const NewsDetailScreen = ({ route, navigation }) => {
  const { newsId } = route.params;
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [news, setNews] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadNewsDetail();
    loadUserData();
  }, [newsId]);

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

  const loadNewsDetail = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please log in to view news details',
          position: 'top',
        });
        navigation.navigate('SignIn');
        return;
      }

      const response = await newsService.getNewsById(newsId);
      setNews(response.news || response);
      
      // Load related news after main news is loaded
      await loadRelatedNews(newsId);
    } catch (error) {
      console.error('Load news detail error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load news details',
        position: 'top',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedNews = async (currentNewsId) => {
    try {
      setLoadingRelated(true);
      const response = await newsService.getRelatedNews(currentNewsId);
      if (response && response.newsList) {
        // Filter out the current article
        const filtered = response.newsList.filter(item => 
          item.id !== parseInt(currentNewsId)
        );
        console.log('Related news loaded:', filtered.length);
        setRelatedNews(filtered);
      }
    } catch (error) {
      console.error('Load related news error:', error);
      // Don't show toast for related news failure as it's not critical
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNewsDetail();
    setRefreshing(false);
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete News Article',
      'Are you sure you want to delete this news article? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const token = await AsyncStorage.getItem('token');
              await newsService.deleteNews(token, newsId);
              
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'News article deleted successfully',
                position: 'top',
              });
              
              navigation.goBack();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to delete news',
                position: 'top',
              });
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      let shareContent = `${news.title}\n\n`;
      
      if (news.content) {
        shareContent += `${news.content.substring(0, 200)}${news.content.length > 200 ? '...' : ''}`;
      } else if (news.url) {
        shareContent += `Read more: ${news.url}`;
      }

      await Share.share({
        message: shareContent,
        title: news.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleOpenUrl = async () => {
    if (news.url) {
      try {
        const supported = await Linking.canOpenURL(news.url);
        if (supported) {
          await Linking.openURL(news.url);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Cannot open this URL',
            position: 'top',
          });
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to open URL',
          position: 'top',
        });
      }
    }
  };

  const handleViewGraph = async () => {
    try {
      // Check if graph data exists first
      const hasGraph = await checkGraphAvailability();
      if (hasGraph) {
        navigation.navigate('KnowledgeGraph', { newsId: newsId });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Graph Not Available',
          text2: 'Knowledge graph is being processed for this article',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('View graph error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to load knowledge graph',
        position: 'top',
      });
    }
  };

  const checkGraphAvailability = async () => {
    try {
      await newsService.getNewsGraph(newsId);
      return true;
    } catch (error) {
      console.error('Check graph availability error:', error);
      return false;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
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
    const baseStyle = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (label) {
      case 'Today':
        return `${baseStyle} ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`;
      case 'Yesterday':
        return `${baseStyle} ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`;
      case 'This Week':
        return `${baseStyle} ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800'}`;
      case 'This Month':
        return `${baseStyle} ${darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-800'}`;
      default:
        return `${baseStyle} ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`;
    }
  };

  const renderRelatedNewsItem = ({ item }) => {
    const timeLabel = getTimeLabel(item.createdAt);
    
    return (
      <TouchableOpacity key={item.id}
        onPress={() => navigation.push('NewsDetail', { newsId: item.id })}
        style={[
          styles.relatedNewsCard,
          {
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
          }
        ]}
      >
        <Text style={[
          styles.relatedNewsTitle,
          { color: darkMode ? '#ffffff' : '#1e293b' }
        ]}>
          {item.title}
        </Text>
        
        <Text style={[
          styles.relatedNewsContent,
          { color: darkMode ? '#cbd5e1' : '#64748b' }
        ]} numberOfLines={2}>
          {item.content 
            ? item.content.substring(0, 120) + (item.content.length > 120 ? '...' : '')
            : "No content available."}
        </Text>
        
        <View style={styles.relatedNewsFooter}>
          <View style={styles.relatedNewsDate}>
            <Ionicons 
              name="calendar-outline" 
              size={12} 
              color={darkMode ? '#94a3b8' : '#64748b'} 
            />
            <Text style={[
              styles.relatedNewsDateText,
              { color: darkMode ? '#94a3b8' : '#64748b' }
            ]}>
              {formatDate(item.createdAt).split(',')[0]}
            </Text>
          </View>
          
          <View style={[
            styles.timeLabelBadge,
            getTimeLabelStyle(timeLabel).includes('green') && { backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7' },
            getTimeLabelStyle(timeLabel).includes('blue') && { backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe' },
            getTimeLabelStyle(timeLabel).includes('purple') && { backgroundColor: darkMode ? 'rgba(147, 51, 234, 0.2)' : '#f3e8ff' },
            getTimeLabelStyle(timeLabel).includes('orange') && { backgroundColor: darkMode ? 'rgba(249, 115, 22, 0.2)' : '#fed7aa' },
            getTimeLabelStyle(timeLabel).includes('gray') && { backgroundColor: darkMode ? 'rgba(107, 114, 128, 0.2)' : '#f3f4f6' },
          ]}>
            <Text style={[
              styles.timeLabelText,
              getTimeLabelStyle(timeLabel).includes('green') && { color: darkMode ? '#10b981' : '#16a34a' },
              getTimeLabelStyle(timeLabel).includes('blue') && { color: darkMode ? '#3b82f6' : '#2563eb' },
              getTimeLabelStyle(timeLabel).includes('purple') && { color: darkMode ? '#9333ea' : '#7c3aed' },
              getTimeLabelStyle(timeLabel).includes('orange') && { color: darkMode ? '#f97316' : '#ea580c' },
              getTimeLabelStyle(timeLabel).includes('gray') && { color: darkMode ? '#6b7280' : '#4b5563' },
            ]}>
              {timeLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
            Loading news details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!news) {
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }
      ]}>
        <View style={styles.errorContainer}>
          <Ionicons 
            name="alert-circle" 
            size={64} 
            color={darkMode ? '#64748b' : '#94a3b8'} 
          />
          <Text style={[
            styles.errorTitle,
            { color: darkMode ? '#ffffff' : '#1e293b' }
          ]}>
            News Not Found
          </Text>
          <Text style={[
            styles.errorText,
            { color: darkMode ? '#94a3b8' : '#64748b' }
          ]}>
            The requested news article could not be found.
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: darkMode ? '#6366f1' : '#4f46e5' }
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const gradientColors = darkMode 
    ? ['#0f172a', '#1e1b4b'] 
    : ['#f8fafc', '#e0e7ff'];

  const timeLabel = getTimeLabel(news.createdAt);

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
            News Details
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
              <Ionicons 
                name="share-outline" 
                size={20} 
                color={darkMode ? '#ffffff' : '#6366f1'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={darkMode ? '#6366f1' : '#4f46e5'}
            />
          }
        >
          {/* Main Content Card */}
          <View style={[
            styles.mainCard,
            { 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
            }
          ]}>
            {/* News Header */}
            <View style={[
              styles.newsHeader,
              { borderBottomColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0' }
            ]}>
              <Text style={[
                styles.title,
                { color: darkMode ? '#ffffff' : '#1e293b' }
              ]}>
                {news.title}
              </Text>

              <View style={styles.metaInfo}>
                <View style={styles.metaRow}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={16} 
                    color={darkMode ? '#94a3b8' : '#64748b'} 
                  />
                  <Text style={[
                    styles.metaText,
                    { color: darkMode ? '#94a3b8' : '#64748b' }
                  ]}>
                    {formatDate(news.createdAt)}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons 
                    name="person-outline" 
                    size={16} 
                    color={darkMode ? '#94a3b8' : '#64748b'} 
                  />
                  <Text style={[
                    styles.metaText,
                    { color: darkMode ? '#94a3b8' : '#64748b' }
                  ]}>
                    {news.author?.name || user?.name || "Unknown Author"}
                  </Text>
                </View>

                <View style={[
                  styles.timeLabelBadge,
                  getTimeLabelStyle(timeLabel).includes('green') && { backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7' },
                  getTimeLabelStyle(timeLabel).includes('blue') && { backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe' },
                  getTimeLabelStyle(timeLabel).includes('purple') && { backgroundColor: darkMode ? 'rgba(147, 51, 234, 0.2)' : '#f3e8ff' },
                  getTimeLabelStyle(timeLabel).includes('orange') && { backgroundColor: darkMode ? 'rgba(249, 115, 22, 0.2)' : '#fed7aa' },
                  getTimeLabelStyle(timeLabel).includes('gray') && { backgroundColor: darkMode ? 'rgba(107, 114, 128, 0.2)' : '#f3f4f6' },
                ]}>
                  <Text style={[
                    styles.timeLabelText,
                    getTimeLabelStyle(timeLabel).includes('green') && { color: darkMode ? '#10b981' : '#16a34a' },
                    getTimeLabelStyle(timeLabel).includes('blue') && { color: darkMode ? '#3b82f6' : '#2563eb' },
                    getTimeLabelStyle(timeLabel).includes('purple') && { color: darkMode ? '#9333ea' : '#7c3aed' },
                    getTimeLabelStyle(timeLabel).includes('orange') && { color: darkMode ? '#f97316' : '#ea580c' },
                    getTimeLabelStyle(timeLabel).includes('gray') && { color: darkMode ? '#6b7280' : '#4b5563' },
                  ]}>
                    {timeLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={handleViewGraph}
                  style={[
                    styles.actionButton,
                    { backgroundColor: darkMode ? '#6366f1' : '#4f46e5' }
                  ]}
                >
                  <Ionicons name="git-network" size={16} color="#ffffff" />
                  <Text style={styles.actionButtonText}>View Graph</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={deleting}
                  style={[
                    styles.actionButton,
                    styles.deleteButton,
                    deleting && styles.disabledButton
                  ]}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="trash-outline" size={16} color="#ffffff" />
                  )}
                  <Text style={styles.actionButtonText}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* URL Section */}
            {news.url && (
              <TouchableOpacity
                onPress={handleOpenUrl}
                style={[
                  styles.urlContainer,
                  { backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.1)' : '#eef2ff' }
                ]}
              >
                <Ionicons 
                  name="link" 
                  size={16} 
                  color={darkMode ? '#a5b4fc' : '#6366f1'} 
                />
                <Text style={[
                  styles.urlText,
                  { color: darkMode ? '#a5b4fc' : '#6366f1' }
                ]} 
                numberOfLines={2}
                >
                  {news.url}
                </Text>
                <Ionicons 
                  name="open-outline" 
                  size={16} 
                  color={darkMode ? '#a5b4fc' : '#6366f1'} 
                />
              </TouchableOpacity>
            )}

            {/* Content Section */}
            <View style={styles.contentSection}>
              {news.content ? (
                <View>
                  {news.content.split('\n').map((paragraph, idx) => (
                    paragraph.trim() ? (
                      <Text key={idx} style={[
                        styles.contentParagraph,
                        { color: darkMode ? '#cbd5e1' : '#64748b' }
                      ]}>
                        {paragraph}
                      </Text>
                    ) : (
                      <View key={idx} style={styles.paragraphBreak} />
                    )
                  ))}
                </View>
              ) : (
                <View style={[
                  styles.noContentContainer,
                  { 
                    backgroundColor: darkMode ? 'rgba(71, 85, 105, 0.3)' : '#f1f5f9',
                    borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0'
                  }
                ]}>
                  <Ionicons 
                    name="document-text-outline" 
                    size={24} 
                    color={darkMode ? '#94a3b8' : '#64748b'} 
                  />
                  <Text style={[
                    styles.noContentText,
                    { color: darkMode ? '#94a3b8' : '#64748b' }
                  ]}>
                    No content available for this news article.
                  </Text>
                </View>
              )}

              {/* File Info */}
              {news.fileName && (
                <View style={[
                  styles.fileInfoContainer,
                  { backgroundColor: darkMode ? 'rgba(71, 85, 105, 0.3)' : '#f1f5f9' }
                ]}>
                  <Ionicons 
                    name="document-attach" 
                    size={20} 
                    color={darkMode ? '#a5b4fc' : '#6366f1'} 
                  />
                  <Text style={[
                    styles.fileName,
                    { color: darkMode ? '#ffffff' : '#1e293b' }
                  ]}>
                    {news.fileName}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Related News Section */}
          <View style={[
            styles.relatedSection,
            { 
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
            }
          ]}>
            <Text style={[
              styles.relatedTitle,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]}>
              Related News
            </Text>

            {loadingRelated ? (
              <View style={styles.relatedLoadingContainer}>
                <ActivityIndicator 
                  size="small" 
                  color={darkMode ? '#6366f1' : '#4f46e5'} 
                />
                <Text style={[
                  styles.relatedLoadingText,
                  { color: darkMode ? '#94a3b8' : '#64748b' }
                ]}>
                  Loading related articles...
                </Text>
              </View>
            ) : relatedNews.length > 0 ? (
              <View style={styles.relatedNewsContainer}>
                {/* Scroll hint */}
                <View style={styles.scrollHintContainer}>
                  <View style={styles.scrollHintLeft}>
                    <Ionicons 
                      name="chevron-back" 
                      size={16} 
                      color={darkMode ? '#64748b' : '#94a3b8'} 
                    />
                  </View>
                  <View style={styles.scrollDots}>
                    {relatedNews.slice(0, Math.min(3, relatedNews.length)).map((_, index) => (
                      <View 
                        key={index}
                        style={[
                          styles.scrollDot,
                          { 
                            backgroundColor: index === 0 
                              ? (darkMode ? '#6366f1' : '#4f46e5')
                              : (darkMode ? '#374151' : '#e5e7eb')
                          }
                        ]} 
                      />
                    ))}
                    {relatedNews.length > 3 && (
                      <Text style={[
                        styles.moreIndicator,
                        { color: darkMode ? '#64748b' : '#94a3b8' }
                      ]}>
                        +{relatedNews.length - 3}
                      </Text>
                    )}
                  </View>
                  <View style={styles.scrollHintRight}>
                    <Ionicons 
                      name="chevron-forward" 
                      size={16} 
                      color={darkMode ? '#64748b' : '#94a3b8'} 
                    />
                  </View>
                </View>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.relatedScrollView}
                  contentContainerStyle={styles.relatedScrollContent}
                  decelerationRate="fast"
                  snapToInterval={296} // width of card + margin
                  snapToAlignment="start"
                >
                  {relatedNews.map((item, idx) => renderRelatedNewsItem({ item }))}
                  
                  {/* End indicator */}
                  {relatedNews.length > 1 && (
                    <View style={[
                      styles.scrollEndIndicator,
                      { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.5)' }
                    ]}>
                      <Ionicons 
                        name="chevron-back" 
                        size={20} 
                        color={darkMode ? '#64748b' : '#94a3b8'} 
                      />
                      <Text style={[
                        styles.scrollEndText,
                        { color: darkMode ? '#94a3b8' : '#64748b' }
                      ]}>
                        Scroll for more
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Bottom scroll hint with swipe gesture */}
                {relatedNews.length > 1 && (
                  <View style={styles.swipeHintContainer}>
                    <View style={styles.swipeHint}>
                      <Ionicons 
                        name="swap-horizontal" 
                        size={16} 
                        color={darkMode ? '#64748b' : '#94a3b8'} 
                      />
                      <Text style={[
                        styles.swipeHintText,
                        { color: darkMode ? '#64748b' : '#94a3b8' }
                      ]}>
                        Swipe to see more articles
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={[
                styles.noRelatedContainer,
                { backgroundColor: darkMode ? 'rgba(71, 85, 105, 0.2)' : '#f8fafc' }
              ]}>
                <Ionicons 
                  name="chatbubbles-outline" 
                  size={32} 
                  color={darkMode ? '#64748b' : '#94a3b8'} 
                />
                <Text style={[
                  styles.noRelatedText,
                  { color: darkMode ? '#94a3b8' : '#64748b' }
                ]}>
                  No related articles found based on shared entities
                </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  mainCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  newsHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 30,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    marginLeft: 6,
  },
  timeLabelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
  },
  urlText: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
  },
  contentSection: {
    padding: 20,
  },
  contentParagraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  paragraphBreak: {
    height: 8,
  },
  noContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  noContentText: {
    marginLeft: 12,
    fontSize: 16,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  fileName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  relatedSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  relatedLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  relatedLoadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  relatedScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  relatedNewsCard: {
    width: 280,
    marginRight: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  relatedNewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  relatedNewsContent: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 12,
  },
  relatedNewsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relatedNewsDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relatedNewsDateText: {
    fontSize: 12,
    marginLeft: 4,
  },
  noRelatedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 12,
  },
  noRelatedText: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  relatedNewsContainer: {
    position: 'relative',
  },
  scrollHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  scrollHintLeft: {
    width: 24,
    alignItems: 'center',
  },
  scrollHintRight: {
    width: 24,
    alignItems: 'center',
  },
  scrollDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreIndicator: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  relatedScrollContent: {
    paddingRight: 20,
  },
  scrollEndIndicator: {
    width: 120,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderStyle: 'dashed',
  },
  scrollEndText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  swipeHintContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  swipeHintText: {
    fontSize: 12,
    marginLeft: 6,
    fontStyle: 'italic',
  },
});

export default NewsDetailScreen;