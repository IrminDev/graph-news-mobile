import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { useTheme } from '../hooks/useTheme';
import newsService from '../services/news.service';

const SearchScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { darkMode } = useTheme();
  
  // Fix: Safely get query from route params
  const [query, setQuery] = useState(() => {
    const routeQuery = route.params?.query;
    return typeof routeQuery === 'string' ? routeQuery : '';
  });
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (query) {
      performSearch(query, 0, true);
    }
  }, []);

  const performSearch = async (searchQuery, pageNumber = 0, isNewSearch = false) => {
    if (isNewSearch) {
      setLoading(true);
      setResults([]);
      setPage(0);
      setHasMore(true);
    }

    try {
      // Get token from storage
      const token = await AsyncStorage.getItem('token');
      
      const response = await newsService.searchNews(token, searchQuery, pageNumber, 10);
      
      if (response && response.newsList) {
        const newResults = response.newsList.map(news => ({
          id: news.id,
          title: news.title || 'Untitled News',
          description: news.content ? news.content.substring(0, 200) + '...' : 'No description available',
          // Fix: Ensure entities are always strings
          entities: Array.isArray(news.entities) 
            ? news.entities.map(entity => 
                typeof entity === 'string' ? entity : entity.name || entity.label || String(entity)
              )
            : [],
          connections: news.connectionCount || 0,
          createdAt: news.createdAt,
          url: news.url,
          // Fix: Ensure author is a string
          author: typeof news.author === 'string' ? news.author : 
                  (news.author?.name || news.author?.email || 'Unknown Author'),
        }));

        if (isNewSearch) {
          setResults(newResults);
        } else {
          setResults(prev => [...prev, ...newResults]);
        }

        setTotalResults(response.totalCount || newResults.length);
        setHasMore(newResults.length === 10 && (pageNumber + 1) * 10 < (response.totalCount || 0));
        setPage(pageNumber);
      } else {
        // Fallback to mock data if API doesn't return expected format
        const mockResults = [
          {
            id: 1,
            title: 'Climate Change Impact on Global Economy',
            description: 'A comprehensive analysis of how climate change affects worldwide economic systems.',
            entities: ['Climate Change', 'Economy', 'Global Impact'],
            connections: 15,
            createdAt: new Date().toISOString(),
            author: 'Research Team',
          },
          {
            id: 2,
            title: 'AI Technology Breakthrough in Healthcare',
            description: 'Revolutionary AI system demonstrates unprecedented accuracy in medical diagnosis.',
            entities: ['AI', 'Healthcare', 'Technology'],
            connections: 23,
            createdAt: new Date().toISOString(),
            author: 'Tech Analyst',
          },
          {
            id: 3,
            title: 'Renewable Energy Investment Trends',
            description: 'Analysis of investment patterns in renewable energy sector across different regions.',
            entities: ['Renewable Energy', 'Investment', 'Trends'],
            connections: 18,
            createdAt: new Date().toISOString(),
            author: 'Energy Expert',
          },
        ];
        
        setResults(mockResults);
        setTotalResults(mockResults.length);
        setHasMore(false);

        Toast.show({
          type: 'info',
          text1: 'Demo Mode',
          text2: 'Showing sample results - API not available',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Search Failed',
        text2: error.message || 'Please try again',
        position: 'top',
      });

      // Show empty state on error
      if (isNewSearch) {
        setResults([]);
        setTotalResults(0);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      performSearch(query.trim(), 0, true);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      performSearch(query, page + 1, false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (query.trim()) {
      performSearch(query.trim(), 0, true);
    } else {
      setRefreshing(false);
    }
  };

  const handleResultPress = (item) => {
    Toast.show({
      type: 'info',
      text1: 'Opening News',
      text2: item.title,
      position: 'top',
    });
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.resultCard,
        {
          backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
        }
      ]}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.resultTitle,
        { color: darkMode ? '#ffffff' : '#1e293b' }
      ]}>
        {item.title}
      </Text>
      <Text style={[
        styles.resultDescription,
        { color: darkMode ? '#cbd5e1' : '#64748b' }
      ]}>
        {item.description}
      </Text>
      
      {/* Metadata */}
      {(item.author || item.createdAt) && (
        <View style={styles.metadata}>
          {item.author && (
            <Text style={[
              styles.metadataText,
              { color: darkMode ? '#94a3b8' : '#94a3b8' }
            ]}>
              By {String(item.author)}
            </Text>
          )}
          {item.createdAt && (
            <Text style={[
              styles.metadataText,
              { color: darkMode ? '#94a3b8' : '#94a3b8' }
            ]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      <View style={styles.resultFooter}>
        <View style={styles.entities}>
          {/* Fix: Safely render entities as strings */}
          {Array.isArray(item.entities) && item.entities.slice(0, 3).map((entity, index) => (
            <View
              key={index}
              style={[
                styles.entityTag,
                { backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.1)' }
              ]}
            >
              <Text style={[
                styles.entityText,
                { color: darkMode ? '#a5b4fc' : '#4f46e5' }
              ]}>
                {String(entity)}
              </Text>
            </View>
          ))}
          {Array.isArray(item.entities) && item.entities.length > 3 && (
            <Text style={[
              styles.moreEntities,
              { color: darkMode ? '#64748b' : '#94a3b8' }
            ]}>
              +{item.entities.length - 3} more
            </Text>
          )}
        </View>
        <View style={styles.connections}>
          <Icon name="share-2" size={16} color={darkMode ? '#6366f1' : '#4f46e5'} />
          <Text style={[
            styles.connectionsText,
            { color: darkMode ? '#6366f1' : '#4f46e5' }
          ]}>
            {item.connections} connections
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLoadMoreButton = () => {
    if (!hasMore) return null;

    return (
      <TouchableOpacity
        style={[
          styles.loadMoreButton,
          { 
            backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.1)',
            borderColor: darkMode ? '#6366f1' : '#4f46e5',
          }
        ]}
        onPress={handleLoadMore}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={darkMode ? '#6366f1' : '#4f46e5'} />
        ) : (
          <Text style={[
            styles.loadMoreText,
            { color: darkMode ? '#6366f1' : '#4f46e5' }
          ]}>
            Load More Results
          </Text>
        )}
      </TouchableOpacity>
    );
  };

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
            Search Results
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchBox,
            {
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
            }
          ]}>
            <TextInput
              style={[
                styles.searchInput,
                { color: darkMode ? '#ffffff' : '#1e293b' }
              ]}
              placeholder="Search knowledge graphs..."
              placeholderTextColor={darkMode ? '#64748b' : '#94a3b8'}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              editable={!loading}
            />
            <TouchableOpacity 
              onPress={handleSearch} 
              style={styles.searchButton}
              disabled={loading || !query.trim()}
            >
              <LinearGradient
                colors={darkMode ? ['#6366f1', '#8b5cf6'] : ['#4f46e5', '#7c3aed']}
                style={[
                  styles.searchButtonGradient,
                  { opacity: (loading || !query.trim()) ? 0.5 : 1 }
                ]}
              >
                <Icon name="search" size={20} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {loading && results.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={darkMode ? '#6366f1' : '#4f46e5'} />
              <Text style={[
                styles.loadingText,
                { color: darkMode ? '#cbd5e1' : '#64748b' }
              ]}>
                Searching knowledge graphs...
              </Text>
            </View>
          ) : results.length > 0 ? (
            <>
              <Text style={[
                styles.resultsCount,
                { color: darkMode ? '#cbd5e1' : '#64748b' }
              ]}>
                Found {totalResults} knowledge graph{totalResults !== 1 ? 's' : ''} for "{query}"
              </Text>
              <FlatList
                data={results}
                renderItem={renderSearchResult}
                keyExtractor={item => String(item.id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={darkMode ? '#6366f1' : '#4f46e5'}
                  />
                }
                ListFooterComponent={renderLoadMoreButton}
              />
            </>
          ) : query ? (
            <View style={styles.noResultsContainer}>
              <Icon name="search" size={48} color={darkMode ? '#64748b' : '#94a3b8'} />
              <Text style={[
                styles.noResultsText,
                { color: darkMode ? '#cbd5e1' : '#64748b' }
              ]}>
                No results found for "{query}"
              </Text>
              <Text style={[
                styles.noResultsSubtext,
                { color: darkMode ? '#94a3b8' : '#94a3b8' }
              ]}>
                Try adjusting your search terms or check your spelling
              </Text>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Icon name="compass" size={48} color={darkMode ? '#64748b' : '#94a3b8'} />
              <Text style={[
                styles.emptyStateText,
                { color: darkMode ? '#cbd5e1' : '#64748b' }
              ]}>
                Enter a search term to explore knowledge graphs
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Styles remain the same
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsCount: {
    fontSize: 14,
    marginBottom: 16,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 6,
    alignItems: 'center',
  },
  entityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  entityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreEntities: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  connections: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 16,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
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
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default SearchScreen;