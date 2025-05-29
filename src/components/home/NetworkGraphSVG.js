import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Circle,
  Line,
  Defs,
  Marker,
  Polygon,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NetworkGraphSVG = ({ darkMode }) => {
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    pulseAnimation.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    const radius = interpolate(pulseAnimation.value, [0, 0.5, 1], [45, 55, 45]);
    const opacity = interpolate(pulseAnimation.value, [0, 0.5, 1], [0.8, 0.2, 0.8]);
    
    return {
      r: radius,
      opacity: opacity,
    };
  });

  const svgWidth = width - 40; // Account for padding
  const svgHeight = 300;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Define node positions relative to center
  const nodes = [
    { id: 'center', x: centerX, y: centerY, r: 40, level: 0 },
    { id: 'node1', x: centerX - 150, y: centerY - 75, r: 30, level: 1 },
    { id: 'node2', x: centerX + 150, y: centerY - 75, r: 30, level: 1 },
    { id: 'node3', x: centerX - 200, y: centerY + 75, r: 25, level: 2 },
    { id: 'node4', x: centerX - 50, y: centerY + 125, r: 25, level: 2 },
    { id: 'node5', x: centerX + 50, y: centerY + 125, r: 25, level: 2 },
    { id: 'node6', x: centerX + 200, y: centerY + 75, r: 25, level: 2 },
    { id: 'node7', x: centerX + 250, y: centerY - 25, r: 20, level: 3 },
    { id: 'node8', x: centerX - 250, y: centerY - 25, r: 20, level: 3 },
  ];

  // Define connections
  const edges = [
    { from: 'center', to: 'node1' },
    { from: 'center', to: 'node2' },
    { from: 'center', to: 'node4' },
    { from: 'center', to: 'node5' },
    { from: 'node1', to: 'node8' },
    { from: 'node1', to: 'node3' },
    { from: 'node2', to: 'node7' },
    { from: 'node2', to: 'node6' },
  ];

  // Color scheme based on theme
  const colors = {
    primary: darkMode ? '#4f46e5' : '#3b82f6',
    secondary: darkMode ? '#8b5cf6' : '#6366f1',
    tertiary: darkMode ? '#a78bfa' : '#818cf8',
    quaternary: darkMode ? '#c4b5fd' : '#a5b4fc',
    edge: darkMode ? '#8b5cf6' : '#6366f1',
  };

  const getNodeColor = (level) => {
    switch (level) {
      case 0: return colors.primary;
      case 1: return colors.secondary;
      case 2: return colors.tertiary;
      case 3: return colors.quaternary;
      default: return colors.primary;
    }
  };

  const getNodeById = (id) => nodes.find(node => node.id === id);

  return (
    <View style={styles.container}>
      <View style={[
        styles.graphCard,
        {
          backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: darkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.2)',
        }
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.networkIcon, { backgroundColor: darkMode ? '#4f46e5' : '#3b82f6' }]} />
            <Animated.Text style={[
              styles.headerText,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]}>
              Knowledge Graph Explorer
            </Animated.Text>
          </View>
          <View style={styles.windowControls}>
            <View style={[styles.control, { backgroundColor: '#ef4444' }]} />
            <View style={[styles.control, { backgroundColor: '#f59e0b' }]} />
            <View style={[styles.control, { backgroundColor: '#10b981' }]} />
          </View>
        </View>

        {/* SVG Graph */}
        <View style={[
          styles.svgContainer,
          {
            backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(239, 246, 255, 0.9)',
          }
        ]}>
          <Svg width={svgWidth} height={svgHeight - 60}>
            <Defs>
              <Marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <Polygon
                  points="0,0 10,3.5 0,7"
                  fill={colors.edge}
                />
              </Marker>
              
              <LinearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
                <Stop offset="100%" stopColor={colors.secondary} stopOpacity="0.8" />
              </LinearGradient>
            </Defs>

            {/* Draw edges */}
            {edges.map((edge, index) => {
              const fromNode = getNodeById(edge.from);
              const toNode = getNodeById(edge.to);
              if (!fromNode || !toNode) return null;

              return (
                <Line
                  key={index}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={colors.edge}
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  opacity="0.8"
                />
              );
            })}

            {/* Draw nodes */}
            {nodes.map((node) => (
              <Circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={getNodeColor(node.level)}
                opacity="0.9"
              />
            ))}

            {/* Animated pulse on center node */}
            <AnimatedCircle
              cx={centerX}
              cy={centerY}
              fill="none"
              stroke={colors.primary}
              strokeWidth="3"
              animatedProps={animatedProps}
            />
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  graphCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  windowControls: {
    flexDirection: 'row',
    gap: 4,
  },
  control: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  svgContainer: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NetworkGraphSVG;