import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapScreen from './src/screens/MapScreen';
import AboutScreen from './src/screens/AboutScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Map">
        <Stack.Screen 
          name="Map" 
          component={MapScreen} 
          options={({ navigation }) => ({
            title: 'MWU Map Navigator',
            headerRight: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('About')}
                style={{ marginRight: 15 }}
              >
                <MaterialCommunityIcons name="information" size={24} color="#2196F3" />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen 
          name="About" 
          component={AboutScreen} 
          options={{ title: 'About the App' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
