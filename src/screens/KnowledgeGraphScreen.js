import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import newsService from '../services/news.service';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const KnowledgeGraphScreen = ({ route, navigation }) => {
  const { newsId } = route.params;
  const { darkMode } = useTheme();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsData, setNewsData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [viewMode, setViewMode] = useState('graph'); // 'graph' or 'list'

  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Graph dimensions
  const graphWidth = screenWidth * 2;
  const graphHeight = screenHeight * 1.5;
  const centerX = graphWidth / 2;
  const centerY = graphHeight / 2;

  useEffect(() => {
    loadGraphData();
  }, [newsId]);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please log in to view the graph',
          position: 'top',
        });
        navigation.goBack();
        return;
      }

      // Load news data
      const newsResponse = await newsService.getNewsById(newsId);
      setNewsData(newsResponse.news || newsResponse);

      // Load graph data using the correct endpoint
      const graphResponse = await newsService.getNewsGraph(newsId);
      if (graphResponse && graphResponse.graph) {
        const transformedData = transformGraphData(graphResponse.graph);
        setGraphData(transformedData);
      } else {
        setError('No graph data available for this article');
      }
    } catch (error) {
      console.error('Load graph error:', error);
      setError(error.message || 'Failed to load graph data');
    } finally {
      setLoading(false);
    }
  };

    const transformGraphData = (rawData) => {
        const nodes = [];
        const links = [];

        // Add news node at center
        nodes.push({
            id: rawData.news.id,
            name: rawData.news.title,
            type: 'News',
            x: centerX,
            y: centerY,
            size: 30,
            color: darkMode ? '#6366f1' : '#4f46e5',
            layer: 0,
        });

        // Categorize entities by importance and type
        const categorizedEntities = categorizeEntitiesByImportance(rawData.entities);
        
        // Define radius layers
        const baseRadius = 120;
        const radiusIncrement = 100;
        
        let globalIndex = 0;

        // Distribute entities across layers
        categorizedEntities.forEach((layer, layerIndex) => {
            const layerRadius = baseRadius + (layerIndex * radiusIncrement);
            const entitiesInLayer = layer.length;
            
            layer.forEach((entity, entityIndex) => {
            // Calculate angle for even distribution
            const angle = (entityIndex / entitiesInLayer) * 2 * Math.PI;
            
            // Add some randomness to avoid perfect alignment
            const angleOffset = (Math.random() - 0.5) * 0.3;
            const radiusOffset = (Math.random() - 0.5) * 30;
            
            const finalAngle = angle + angleOffset;
            const finalRadius = layerRadius + radiusOffset;
            
            const x = centerX + Math.cos(finalAngle) * finalRadius;
            const y = centerY + Math.sin(finalAngle) * finalRadius;

            nodes.push({
                id: entity.id,
                name: entity.name,
                type: entity.type,
                mentionCount: entity.mentionCount || 1,
                x,
                y,
                size: calculateNodeSize(entity, layerIndex),
                color: getColorForType(entity.type, darkMode),
                layer: layerIndex + 1,
                importance: entity.importance || 1,
            });

            // Add link from entity to news
            links.push({
                id: `${entity.id}-${rawData.news.id}`,
                source: entity.id,
                target: rawData.news.id,
                type: 'MENTIONED_IN',
                strength: Math.max(entity.mentionCount || 1, 1),
                layer: layerIndex + 1,
            });

            globalIndex++;
            });
        });

        // Add relationship links with smart routing
        rawData.relationships.forEach((rel) => {
            const sourceNode = nodes.find(n => n.id === rel.sourceId);
            const targetNode = nodes.find(n => n.id === rel.targetId);
            
            if (sourceNode && targetNode) {
            links.push({
                id: `${rel.sourceId}-${rel.targetId}`,
                source: rel.sourceId,
                target: rel.targetId,
                type: rel.type,
                strength: rel.confidence || 1,
                crossLayer: sourceNode.layer !== targetNode.layer,
            });
            }
        });

        return { nodes, links };
    };

    const categorizeEntitiesByImportance = (entities) => {
        // Sort by mention count and type priority
        const sortedEntities = [...entities].sort((a, b) => {
            const priorityA = getTypePriority(a.type);
            const priorityB = getTypePriority(b.type);
            const mentionA = a.mentionCount || 1;
            const mentionB = b.mentionCount || 1;
            
            // First sort by mention count, then by type priority
            if (mentionB !== mentionA) {
            return mentionB - mentionA;
            }
            return priorityA - priorityB;
        });

        // Distribute entities into layers
        const layers = [];
        const maxEntitiesPerLayer = 8; // Optimal for readability
        
        for (let i = 0; i < sortedEntities.length; i += maxEntitiesPerLayer) {
            const layer = sortedEntities.slice(i, i + maxEntitiesPerLayer);
            layers.push(layer);
        }

        return layers;
    };

        // Get type priority (lower number = higher priority, closer to center)
    const getTypePriority = (type) => {
        const priorities = {
            'Person': 1,
            'Organization': 2,
            'Location': 3,
            'Concept': 4,
            'Time': 5,
            'Numerical': 6,
            'Miscellaneous': 7,
        };
        return priorities[type] || 7;
    };

        // Calculate node size based on importance and layer
    const calculateNodeSize = (entity, layerIndex) => {
        const baseSizes = [20, 16, 14, 12]; // Size per layer
        const baseSize = baseSizes[Math.min(layerIndex, baseSizes.length - 1)] || 10;
        
        const mentionBonus = Math.log(entity.mentionCount || 1) * 2;
        return Math.min(baseSize + mentionBonus, 25);
    };


  const getColorForType = (type, isDark) => {
    const colors = {
      Person: isDark ? '#ef4444' : '#dc2626',
      Organization: isDark ? '#3b82f6' : '#2563eb',
      Location: isDark ? '#10b981' : '#059669',
      Time: isDark ? '#8b5cf6' : '#7c3aed',
      Numerical: isDark ? '#f59e0b' : '#d97706',
      Miscellaneous: isDark ? '#6b7280' : '#4b5563',
      Concept: isDark ? '#ec4899' : '#db2777',
      News: isDark ? '#6366f1' : '#4f46e5',
    };
    return colors[type] || colors.Miscellaneous;
  };

  const handleNodePress = (node) => {
    setSelectedNode(node);
    // Animate to center the selected node
    const newTranslateX = screenWidth / 2 - node.x * scale.value;
    const newTranslateY = screenHeight / 2 - node.y * scale.value;
    
    translateX.value = withSpring(newTranslateX);
    translateY.value = withSpring(newTranslateY);
  };

  const handleZoomIn = () => {
    scale.value = withSpring(Math.min(scale.value * 1.5, 3));
  };

  const handleZoomOut = () => {
    scale.value = withSpring(Math.max(scale.value / 1.5, 0.3));
  };

  const handleResetView = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    setSelectedNode(null);
  };

    const getLinkColor = (link, darkMode) => {
  if (link.type === 'MENTIONED_IN') {
    return darkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.4)';
  }
  
  // Color-code relationship types
  const relationshipColors = {
    'RELATED_TO': darkMode ? 'rgba(99, 102, 241, 0.6)' : 'rgba(79, 70, 229, 0.6)',
    'LOCATED_IN': darkMode ? 'rgba(16, 185, 129, 0.6)' : 'rgba(5, 150, 105, 0.6)',
    'WORKS_FOR': darkMode ? 'rgba(245, 158, 11, 0.6)' : 'rgba(217, 119, 6, 0.6)',
    'PART_OF': darkMode ? 'rgba(239, 68, 68, 0.6)' : 'rgba(220, 38, 38, 0.6)',
  };
  
  return relationshipColors[link.type] || (darkMode ? 'rgba(139, 92, 246, 0.6)' : 'rgba(124, 58, 237, 0.6)');
};

const getLinkWidth = (link) => {
  if (link.type === 'MENTIONED_IN') {
    return Math.max(link.strength * 0.3, 1);
  }
  return Math.max(link.strength * 1.5, 2);
};

const getNodeStroke = (node, darkMode) => {
  if (node.type === 'News') {
    return darkMode ? '#ffffff' : '#1e293b';
  }
  return darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
};

const getLabelFontSize = (node) => {
  const baseSizes = {
    'News': 14,
    0: 12,  // Layer 0 (News)
    1: 11,  // Layer 1
    2: 10,  // Layer 2
    3: 9,   // Layer 3+
  };
  return baseSizes[node.layer] || baseSizes[3];
};

const getNodeLabel = (node) => {
  const maxLength = node.layer === 0 ? 20 : (node.layer === 1 ? 15 : 12);
  return node.name.length > maxLength ? 
    `${node.name.substring(0, maxLength)}...` : 
    node.name;
};

// Add focus mode functionality
const handleFocusMode = () => {
  if (selectedNode) {
    // Focus on selected node and its connections
    const connectedNodeIds = graphData.links
      .filter(link => link.source === selectedNode.id || link.target === selectedNode.id)
      .map(link => link.source === selectedNode.id ? link.target : link.source);
    
    // You can implement highlighting logic here
    console.log('Focus mode for node:', selectedNode.name, 'Connected to:', connectedNodeIds);
  }
};

  // Pan gesture handler
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Store the initial values when pan starts
    },
    onPanResponderMove: (evt, gestureState) => {
      translateX.value = translateX.value + gestureState.dx * 0.01;
      translateY.value = translateY.value + gestureState.dy * 0.01;
    },
    onPanResponderRelease: () => {
      // Optionally add constraints here
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

    const renderGraph = () => {
        if (!graphData) return null;

        return (
            <View style={styles.graphContainer}>
            <Animated.View style={[styles.svgContainer, animatedStyle]} {...panResponder.panHandlers}>
                <Svg width={graphWidth} height={graphHeight}>
                {/* Render layer circles for visual guidance */}
                {[1, 2, 3, 4].map(layer => {
                    const radius = 120 + ((layer - 1) * 100);
                    return (
                    <Circle
                        key={`layer-${layer}`}
                        cx={centerX}
                        cy={centerY}
                        r={radius}
                        fill="none"
                        stroke={darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)'}
                        strokeWidth={1}
                        strokeDasharray="5,5"
                        opacity={0.3}
                    />
                    );
                })}

                {/* Render links with improved styling */}
                {graphData.links.map((link) => {
                    const sourceNode = graphData.nodes.find(n => n.id === link.source);
                    const targetNode = graphData.nodes.find(n => n.id === link.target);
                    
                    if (!sourceNode || !targetNode) return null;

                    // Different styling for different link types
                    const linkColor = getLinkColor(link, darkMode);
                    const linkWidth = getLinkWidth(link);

                    return (
                    <Line
                        key={link.id}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={linkColor}
                        strokeWidth={linkWidth}
                        opacity={link.type === 'MENTIONED_IN' ? 0.4 : 0.7}
                        strokeDasharray={link.crossLayer ? "3,3" : "none"}
                    />
                    );
                })}

                {/* Render nodes with enhanced styling */}
                {graphData.nodes.map((node) => (
                    <G key={node.id}>
                    {/* Node shadow */}
                    <Circle
                        cx={node.x + 2}
                        cy={node.y + 2}
                        r={node.size}
                        fill="rgba(0, 0, 0, 0.1)"
                        opacity={0.3}
                    />
                    
                    {/* Main node */}
                    <Circle
                        cx={node.x}
                        cy={node.y}
                        r={node.size}
                        fill={node.color}
                        stroke={selectedNode?.id === node.id ? '#ffffff' : getNodeStroke(node, darkMode)}
                        strokeWidth={selectedNode?.id === node.id ? 4 : 2}
                        opacity={0.9}
                        onPress={() => handleNodePress(node)}
                    />
                    
                    {/* Node center highlight */}
                    <Circle
                        cx={node.x - node.size/3}
                        cy={node.y - node.size/3}
                        r={node.size/3}
                        fill="rgba(255, 255, 255, 0.3)"
                        opacity={0.6}
                    />
                    
                    {/* Node label with background */}
                    <SvgText
                        x={node.x}
                        y={node.y + node.size + 20}
                        fontSize={getLabelFontSize(node)}
                        fill={darkMode ? '#ffffff' : '#000000'}
                        textAnchor="middle"
                        fontWeight={node.type === 'News' ? 'bold' : 'normal'}
                        stroke={darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
                        strokeWidth={3}
                        paintOrder="stroke"
                    >
                        {getNodeLabel(node)}
                    </SvgText>
                    
                    {/* Mention count indicator for important nodes */}
                    {node.mentionCount > 3 && (
                        <Circle
                        cx={node.x + node.size - 5}
                        cy={node.y - node.size + 5}
                        r={8}
                        fill={darkMode ? '#ef4444' : '#dc2626'}
                        stroke="#ffffff"
                        strokeWidth={2}
                        />
                    )}
                    {node.mentionCount > 3 && (
                        <SvgText
                        x={node.x + node.size - 5}
                        y={node.y - node.size + 5}
                        fontSize="10"
                        fill="#ffffff"
                        textAnchor="middle"
                        fontWeight="bold"
                        dy="3"
                        >
                        {node.mentionCount}
                        </SvgText>
                    )}
                    </G>
                ))}
                </Svg>
            </Animated.View>

            {/* Enhanced Graph Controls */}
            <View style={[
                styles.controlsContainer,
                { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)' }
            ]}>
                <TouchableOpacity onPress={handleZoomIn} style={styles.controlButton}>
                <Ionicons name="add" size={20} color={darkMode ? '#ffffff' : '#1e293b'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleZoomOut} style={styles.controlButton}>
                <Ionicons name="remove" size={20} color={darkMode ? '#ffffff' : '#1e293b'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleResetView} style={styles.controlButton}>
                <Ionicons name="refresh" size={20} color={darkMode ? '#ffffff' : '#1e293b'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFocusMode} style={styles.controlButton}>
                <Ionicons name="eye" size={20} color={darkMode ? '#ffffff' : '#1e293b'} />
                </TouchableOpacity>
            </View>

            {/* Layer indicator */}
            <View style={[
                styles.layerIndicator,
                { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)' }
            ]}>
                <Text style={[
                styles.layerText,
                { color: darkMode ? '#ffffff' : '#1e293b' }
                ]}>
                Layers: {Math.max(...graphData.nodes.map(n => n.layer))}
                </Text>
            </View>
            </View>
        );
        };

  const renderEntityList = () => {
    if (!graphData) return null;

    const entities = graphData.nodes.filter(node => node.type !== 'News');
    const groupedEntities = entities.reduce((acc, entity) => {
      if (!acc[entity.type]) acc[entity.type] = [];
      acc[entity.type].push(entity);
      return acc;
    }, {});

    return (
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedEntities).map(([type, entities]) => (
          <View key={type} style={[
            styles.entityGroup,
            { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
          ]}>
            <Text style={[
              styles.entityGroupTitle,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]}>
              {type} ({entities.length})
            </Text>
            {entities.map((entity) => (
              <TouchableOpacity
                key={entity.id}
                style={[
                  styles.entityItem,
                  { borderLeftColor: entity.color }
                ]}
                onPress={() => {
                  setViewMode('graph');
                  handleNodePress(entity);
                }}
              >
                <View style={styles.entityInfo}>
                  <Text style={[
                    styles.entityName,
                    { color: darkMode ? '#ffffff' : '#1e293b' }
                  ]}>
                    {entity.name}
                  </Text>
                  {entity.mentionCount > 1 && (
                    <Text style={[
                      styles.entityMentions,
                      { color: darkMode ? '#94a3b8' : '#64748b' }
                    ]}>
                      {entity.mentionCount} mentions
                    </Text>
                  )}
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={darkMode ? '#94a3b8' : '#64748b'} 
                />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderSelectedNodeDetails = () => {
    if (!selectedNode) return null;

    return (
      <View style={[
        styles.nodeDetailsContainer,
        { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)' }
      ]}>
        <View style={styles.nodeDetailsHeader}>
          <View style={[styles.nodeColorIndicator, { backgroundColor: selectedNode.color }]} />
          <View style={styles.nodeDetailsInfo}>
            <Text style={[
              styles.nodeDetailsName,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]}>
              {selectedNode.name}
            </Text>
            <Text style={[
              styles.nodeDetailsType,
              { color: darkMode ? '#94a3b8' : '#64748b' }
            ]}>
              {selectedNode.type}
              {selectedNode.mentionCount && ` • ${selectedNode.mentionCount} mentions`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setSelectedNode(null)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={20} color={darkMode ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
        </View>
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
            Loading knowledge graph...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
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
            Graph Not Available
          </Text>
          <Text style={[
            styles.errorText,
            { color: darkMode ? '#94a3b8' : '#64748b' }
          ]}>
            {error}
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
            Knowledge Graph
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setViewMode(viewMode === 'graph' ? 'list' : 'graph')}
              style={styles.actionButton}
            >
              <Ionicons 
                name={viewMode === 'graph' ? 'list' : 'git-network'} 
                size={20} 
                color={darkMode ? '#ffffff' : '#6366f1'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowLegend(!showLegend)}
              style={styles.actionButton}
            >
              <Ionicons 
                name="help-circle" 
                size={20} 
                color={darkMode ? '#ffffff' : '#6366f1'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* News Info Card */}
        {newsData && (
          <View style={[
            styles.newsCard,
            { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)' }
          ]}>
            <Text style={[
              styles.newsTitle,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]} numberOfLines={2}>
              {newsData.title}
            </Text>
            <Text style={[
              styles.newsDate,
              { color: darkMode ? '#94a3b8' : '#64748b' }
            ]}>
              {newsData.createdAt ? new Date(newsData.createdAt).toLocaleDateString() : 'No date'}
            </Text>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {viewMode === 'graph' ? renderGraph() : renderEntityList()}
        </View>

        {/* Selected Node Details */}
        {selectedNode && renderSelectedNodeDetails()}

        {/* Legend Modal */}
        {showLegend && (
          <View style={styles.legendOverlay}>
            <View style={[
              styles.legendContainer,
              { backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)' }
            ]}>
              <View style={styles.legendHeader}>
                <Text style={[
                  styles.legendTitle,
                  { color: darkMode ? '#ffffff' : '#1e293b' }
                ]}>
                  Graph Legend
                </Text>
                <TouchableOpacity
                  onPress={() => setShowLegend(false)}
                  style={styles.legendCloseButton}
                >
                  <Ionicons name="close" size={20} color={darkMode ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.legendContent}>
                <Text style={[
                  styles.legendSectionTitle,
                  { color: darkMode ? '#ffffff' : '#1e293b' }
                ]}>
                  Entity Types
                </Text>
                {['Person', 'Organization', 'Location', 'Time', 'Numerical', 'Miscellaneous', 'Concept'].map(type => (
                  <View key={type} style={styles.legendItem}>
                    <View style={[
                      styles.legendColor,
                      { backgroundColor: getColorForType(type, darkMode) }
                    ]} />
                    <Text style={[
                      styles.legendText,
                      { color: darkMode ? '#cbd5e1' : '#64748b' }
                    ]}>
                      {type}
                    </Text>
                  </View>
                ))}
                
                <Text style={[
                  styles.legendSectionTitle,
                  { color: darkMode ? '#ffffff' : '#1e293b' }
                ]}>
                  Controls
                </Text>
                <Text style={[
                  styles.legendText,
                  { color: darkMode ? '#cbd5e1' : '#64748b' }
                ]}>
                  • Pinch to zoom{'\n'}
                  • Drag to pan{'\n'}
                  • Tap node to select{'\n'}
                  • Use control buttons for precise actions
                </Text>
              </ScrollView>
            </View>
          </View>
        )}
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
    padding: 5,
    marginLeft: 8,
  },
  newsCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  newsDate: {
    fontSize: 12,
  },
  mainContent: {
    flex: 1,
  },
  graphContainer: {
    flex: 1,
    position: 'relative',
  },
  svgContainer: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'column',
    borderRadius: 12,
    padding: 8,
  },
  controlButton: {
    padding: 8,
    marginVertical: 2,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  entityGroup: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  entityGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  entityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  entityMentions: {
    fontSize: 12,
  },
  nodeDetailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  nodeDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  nodeDetailsInfo: {
    flex: 1,
  },
  nodeDetailsName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nodeDetailsType: {
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
  },
  legendOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.3)',
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  legendCloseButton: {
    padding: 4,
  },
  legendContent: {
    padding: 16,
  },
  legendSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    lineHeight: 20,
  },
  layerIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  layerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default KnowledgeGraphScreen;