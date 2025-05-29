import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

const Testimonials = ({ darkMode }) => {
  const testimonials = [
    {
      quote: "GraphNova has completely transformed how I understand complex news topics. The visual connections make it so much easier to see the big picture.",
      author: "Sarah J., Journalist",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    {
      quote: "As a researcher, I've found the knowledge graphs invaluable for discovering connections I would have otherwise missed. It's like having a research assistant that never sleeps.",
      author: "Dr. Michael T., Academic", 
      avatar: "https://randomuser.me/api/portraits/men/54.jpg"
    },
    {
      quote: "The pattern recognition capabilities have given our company a competitive edge in understanding market trends before they become obvious to others.",
      author: "Elena R., Business Analyst",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    }
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
          What Our Users Say
        </Text>
        <Text style={[
          styles.subtitle,
          { color: darkMode ? '#cbd5e1' : '#64748b' }
        ]}>
          Join thousands of satisfied users who are discovering new insights every day
        </Text>
      </View>

      <View style={styles.testimonialsGrid}>
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={index}
            testimonial={testimonial}
            darkMode={darkMode}
            index={index}
          />
        ))}
      </View>
    </View>
  );
};

const TestimonialCard = ({ testimonial, darkMode, index }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 200, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(index * 200, withTiming(0, { duration: 500 }));
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
      <View style={styles.authorSection}>
        <Image
          source={{ uri: testimonial.avatar }}
          style={[
            styles.avatar,
            { borderColor: darkMode ? '#6366f1' : '#4f46e5' }
          ]}
        />
        <Text style={[
          styles.authorName,
          { color: darkMode ? '#ffffff' : '#1e293b' }
        ]}>
          {testimonial.author}
        </Text>
      </View>
      <Text style={[
        styles.quote,
        { color: darkMode ? '#cbd5e1' : '#64748b' }
      ]}>
        "{testimonial.quote}"
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
  testimonialsGrid: {
    gap: 20,
  },
  card: {
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
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  quote: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default Testimonials;