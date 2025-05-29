import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const Features = ({ darkMode }) => {
  const features = [
    {
      icon: 'cpu',
      title: 'AI-Powered Analysis',
      description: 'Our advanced AI analyzes news articles and extracts entities, relationships, and key insights automatically.',
    },
    {
      icon: 'share-2',
      title: 'Interactive Knowledge Graphs',
      description: 'Visualize complex relationships between entities in dynamic, interactive knowledge graphs.',
    },
    {
      icon: 'file-text',
      title: 'Real-time News Processing',
      description: 'Stay updated with the latest connections as our platform processes news in real-time.',
    },
    {
      icon: 'git-branch',
      title: 'Pattern Recognition',
      description: 'Discover hidden patterns and trends that might not be obvious from reading individual news articles.',
    },
    {
      icon: 'globe',
      title: 'Global News Coverage',
      description: 'Access knowledge graphs from news sources around the world, translated and connected.',
    },
    {
      icon: 'shield',
      title: 'Secure & Private',
      description: 'Your data and interactions are protected with enterprise-grade security protocols.',
    },
  ];

  return (
    <View style={[
      styles.container,
      { backgroundColor: darkMode ? '#0f172a' : '#ffffff' }
    ]}>
      <View style={styles.header}>
        <Text style={[
          styles.title,
          { color: darkMode ? '#ffffff' : '#1e293b' }
        ]}>
          Powerful Features
        </Text>
        <Text style={[
          styles.subtitle,
          { color: darkMode ? '#cbd5e1' : '#64748b' }
        ]}>
          Our platform offers a suite of cutting-edge tools to help you navigate the complex landscape of global news.
        </Text>
      </View>

      <View style={styles.grid}>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            feature={feature}
            darkMode={darkMode}
            index={index}
          />
        ))}
      </View>
    </View>
  );
};

const FeatureCard = ({ feature, darkMode, index }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(index * 100, withTiming(0, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[
      styles.card,
      {
        backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(239, 246, 255, 0.8)',
        borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
      },
      animatedStyle
    ]}>
      <View style={[
        styles.iconContainer,
        { backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.1)' }
      ]}>
        <Icon
          name={feature.icon}
          size={24}
          color={darkMode ? '#6366f1' : '#4f46e5'}
        />
      </View>
      <Text style={[
        styles.cardTitle,
        { color: darkMode ? '#ffffff' : '#1e293b' }
      ]}>
        {feature.title}
      </Text>
      <Text style={[
        styles.cardDescription,
        { color: darkMode ? '#cbd5e1' : '#64748b' }
      ]}>
        {feature.description}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    width: (width - 56) / 2, // Account for padding and gap
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default Features;