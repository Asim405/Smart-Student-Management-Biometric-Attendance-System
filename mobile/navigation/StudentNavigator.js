import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import AcademicOverviewScreen from '../screens/student/AcademicOverviewScreen';
import EnrollmentScreen from '../screens/student/EnrollmentScreen';
import PerformanceTrackerScreen from '../screens/student/PerformanceTrackerScreen';

const Tab = createBottomTabNavigator();

// The icons are just emojis for now, but we can replace them with proper icons later if needed.
const ICONS = { Overview: '🎓', Enroll: '📚', Performance: '📈' }; 

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#5e57e8',
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Overview" component={AcademicOverviewScreen} options={{ title: 'Academic Overview' }} />
      <Tab.Screen name="Enroll" component={EnrollmentScreen} options={{ title: 'Enrollment Portal' }} />
      <Tab.Screen name="Performance" component={PerformanceTrackerScreen} options={{ title: 'Attendance & Performance' }} />
    </Tab.Navigator>
  );
}
