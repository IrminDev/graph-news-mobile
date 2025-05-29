import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';

import Button from '../common/Button';

const Navbar = ({ user, darkMode, toggleTheme, navigation }) => {
  const themeIconRotation = useSharedValue(0);

  const handleThemeToggle = () => {
    themeIconRotation.value = withTiming(themeIconRotation.value + 180, { duration: 300 });
    toggleTheme();
  };

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${themeIconRotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Icon 
          name="share-2" 
          size={24} 
          color={darkMode ? '#6366f1' : '#4f46e5'} 
          style={styles.logo} 
        />
        <Text style={[
          styles.brandText,
          { color: darkMode ? '#ffffff' : '#1e293b' }
        ]}>
          GraphNova
        </Text>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          onPress={handleThemeToggle}
          style={[
            styles.themeButton,
            {
              backgroundColor: darkMode 
                ? 'rgba(99, 102, 241, 0.2)' 
                : 'rgba(79, 70, 229, 0.1)',
            }
          ]}
        >
          <Animated.View style={animatedIconStyle}>
            <Icon
              name={darkMode ? "sun" : "moon"}
              size={20}
              color={darkMode ? '#fbbf24' : '#6366f1'}
            />
          </Animated.View>
        </TouchableOpacity>

        {user ? (
          <View style={styles.userSection}>
            <Text style={[
              styles.welcomeText,
              { color: darkMode ? '#cbd5e1' : '#64748b' }
            ]}>
              Hello, {user.name.split(' ')[0]}
            </Text>
            <Button
              title="Dashboard"
              onPress={() => navigation.navigate('Profile')}
              style={[
                styles.dashboardButton,
                { backgroundColor: darkMode ? '#6366f1' : '#4f46e5' }
              ]}
              textStyle={styles.dashboardButtonText}
            />
          </View>
        ) : (
          <View style={styles.authButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={[
                styles.signInText,
                { color: darkMode ? '#a5b4fc' : '#4f46e5' }
              ]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <Button
              title="Sign Up"
              onPress={() => navigation.navigate('SignUp')}
              style={[
                styles.signUpButton,
                { backgroundColor: darkMode ? '#6366f1' : '#4f46e5' }
              ]}
              textStyle={styles.signUpButtonText}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50, // Account for status bar
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    marginRight: 8,
  },
  brandText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dashboardButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dashboardButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signUpButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Navbar;