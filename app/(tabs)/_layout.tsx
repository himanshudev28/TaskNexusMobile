import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontSize: 18, fontWeight: '700' },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#8a8a8a',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e5e5',
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
          headerTitle: 'TaskNexus',
        }}
      />

      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarLabel: 'Notes',
          tabBarIcon: ({ color }) => (
            <Ionicons name="document" size={24} color={color} />
          ),
          headerTitle: 'Notes',
        }}
      />

      <Tabs.Screen
        name="todo"
        options={{
          title: 'To-Do',
          tabBarLabel: 'To-Do',
          tabBarIcon: ({ color }) => (
            <Ionicons name="checkmark-circle" size={24} color={color} />
          ),
          headerTitle: 'To-Do',
        }}
      />

      <Tabs.Screen
        name="timer"
        options={{
          title: 'Timer',
          tabBarLabel: 'Timer',
          tabBarIcon: ({ color }) => (
            <Ionicons name="time" size={24} color={color} />
          ),
          headerTitle: 'Timer',
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarLabel: 'More',
          tabBarIcon: ({ color }) => (
            <Ionicons name="ellipsis-horizontal" size={24} color={color} />
          ),
          headerTitle: 'More Tools',
        }}
      />
    </Tabs>
  );
}
