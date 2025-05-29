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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

const SearchScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { darkMode } = useTheme();
  const [query, setQuery] = useState(route.params?.query || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, []);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      // Mock search results - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResults = [
        {
          id: 1,
          title: 'Climate Change Impact on Global Economy',
          description: 'A comprehensive analysis of how climate change affects worldwide economic systems.',
          entities: ['Climate Change', 'Economy', 'Global Impact'],
          connections: 15,
        },
        {
          id: 2,
          title: 'AI Technology Breakthrough in Healthcare',
          description: 'Revolutionary AI system demonstrates unprecedented accuracy in medical diagnosis.',
          entities: ['AI', 'Healthcare', 'Technology'],
          connections: 23,
        },
        {
          id: 3,
          title: 'Renewable Energy Investment Trends',
          description: 'Analysis of investment patterns in renewable energy sector across different regions.',
          entities: ['Renewable Energy', 'Investment', 'Trends'],
          connections: 18,
        },
      ];
      setResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity style={[
      styles.resultCard,
      {
        backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
      }
    ]}>
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
      <View style={styles.resultFooter}>
        <View style={styles.entities}>
          {item.entities.slice(0, 3).map((entity, index) => (
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
                {entity}
              </Text>
            </View>
          ))}
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
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <LinearGradient
                colors={darkMode ? ['#6366f1', '#8b5cf6'] : ['#4f46e5', '#7c3aed']}
                style={styles.searchButtonGradient}
              >
                <Icon name="search" size={20} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {loading ? (
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
                Found {results.length} knowledge graphs for "{query}"
              </Text>
              <FlatList
                data={results}
                renderItem={renderSearchResult}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
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
                Try adjusting your search terms
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
    marginBottom: 16,
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
  connections: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionsText: {
    fontSize: 12,
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