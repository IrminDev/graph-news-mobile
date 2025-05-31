import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import UploadNewsScreen from './src/screens/UploadNewsScreen';
import NewsDetailScreen from './src/screens/NewsDetailScreen';
import MyNewsScreen from './src/screens/MyNewsScreen';
import KnowledgeGraphScreen from './src/screens/KnowledgeGraphScreen';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState('Home');

  useEffect(() => {
    checkInitialRoute();
  }, []);

  const checkInitialRoute = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // User is logged in, you can set different initial route if needed
        setInitialRoute('Home');
      }
    } catch (error) {
      console.log('Error checking token:', error);
    }
  };

  return (<>

    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Upload" component={UploadNewsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name='NewsDetail' component={NewsDetailScreen}/>
        <Stack.Screen name='MyNews' component={MyNewsScreen}/>
        <Stack.Screen 
          name="KnowledgeGraph" 
          component={KnowledgeGraphScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>

    <Toast />
  </>
  );
}