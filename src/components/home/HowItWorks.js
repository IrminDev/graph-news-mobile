import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const HowItWorks = ({ darkMode }) => {
  const steps = [
    {
      number: '01',
      title: 'News Collection',
      description: 'Our system continuously gathers news from trusted sources around the world.',
    },
    {
      number: '02',
      title: 'AI Processing',
      description: 'Advanced NLP algorithms analyze and extract structured data from unstructured news text.',
    },
    {
      number: '03',
      title: 'Knowledge Extraction',
      description: 'Entities, relationships, and key facts are identified and connected to existing knowledge.',
    },
    {
      number: '04',
      title: 'Graph Generation',
      description: 'The processed information is transformed into interactive, navigable knowledge graphs.',
    },
  ];

  const gradientColors = darkMode
    ? ['#0f172a', '#1e1b4b']
    : ['#ffffff', '#eff6ff'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <View style={styles.header}>
        <Text style={[
          styles.title,
          { color: darkMode ? '#ffffff' : '#1e293b' }
        ]}>
          How It Works
        </Text>
        <Text style={[
          styles.subtitle,
          { color: darkMode ? '#cbd5e1' : '#64748b' }
        ]}>
          From news to knowledge in four powerful steps
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <StepCard
            key={index}
            step={step}
            darkMode={darkMode}
            index={index}
            isLast={index === steps.length - 1}
          />
        ))}
      </View>
    </LinearGradient>
  );
};

const StepCard = ({ step, darkMode, index, isLast }) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  useEffect(() => {
    opacity.value = withDelay(index * 200, withTiming(1, { duration: 500 }));
    translateX.value = withDelay(index * 200, withTiming(0, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.stepContainer, animatedStyle]}>
      <View style={styles.stepLeft}>
        <View style={[
          styles.stepNumber,
          { backgroundColor: darkMode ? '#6366f1' : '#4f46e5' }
        ]}>
          <Text style={styles.stepNumberText}>{step.number}</Text>
        </View>
        {!isLast && (
          <View style={[
            styles.connector,
            { backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.2)' }
          ]} />
        )}
      </View>
      <View style={[
        styles.stepContent,
        {
          backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(79, 70, 229, 0.2)',
        }
      ]}>
        <Text style={[
          styles.stepTitle,
          { color: darkMode ? '#ffffff' : '#1e293b' }
        ]}>
          {step.title}
        </Text>
        <Text style={[
          styles.stepDescription,
          { color: darkMode ? '#cbd5e1' : '#64748b' }
        ]}>
          {step.description}
        </Text>
      </View>
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
  stepsContainer: {
    maxWidth: 600,
    alignSelf: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connector: {
    width: 2,
    flex: 1,
    marginTop: 8,
  },
  stepContent: {
    width: 200,
    padding: 10,
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
  stepTitle: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 8,
    lineHeight: 20,
  },
});

export default HowItWorks;