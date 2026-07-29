import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DashboardScreen from '../screens/admin/DashboardScreen';
import BiometricHubScreen from '../screens/admin/BiometricHubScreen';
import RosterScreen from '../screens/admin/RosterScreen';
import TierAnalyticsScreen from '../screens/admin/TierAnalyticsScreen';

const Tab = createBottomTabNavigator();

const ICONS = { Dashboard: '📊', Biometric: '🔒', Roster: '📋', Tiers: '🏆' };


export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#4F46E5',
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Biometric" component={BiometricHubScreen} options={{ title: 'Biometric Hub' }} />
      <Tab.Screen name="Roster" component={RosterScreen} options={{ title: 'Course & Roster' }} />
      <Tab.Screen name="Tiers" component={TierAnalyticsScreen} options={{ title: 'Performance Tiers' }} />
    </Tab.Navigator>
  );
}
