import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../../src/store/app';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const notes = useAppStore((state) => state.notes);
  const todos = useAppStore((state) => state.todos);
  const reminders = useAppStore((state) => state.reminders);
  const transactions = useAppStore((state) => state.transactions);

  const pendingTodos = todos.filter((t) => !t.done).length;
  const dueReminders = reminders.filter(
    (r) => !r.done && r.at && r.at <= Date.now()
  ).length;

  const balance = transactions.reduce(
    (sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount),
    0
  );

  const StatCard = ({ label, value, icon, color }: any) => (
    <View className="flex-1 bg-white rounded-lg p-4 m-2 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-gray-500 text-sm mb-1">{label}</Text>
          <Text className="text-2xl font-bold text-gray-900">{value}</Text>
        </View>
        <View className={`w-12 h-12 rounded-lg justify-center items-center`}
              style={{ backgroundColor: color }}>
          <Ionicons name={icon} size={24} color="#fff" />
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      <View className="px-4 py-6">
        <Text className="text-3xl font-bold text-gray-900 mb-6">
          Welcome back!
        </Text>

        <View className="flex-row flex-wrap">
          <StatCard
            label="Notes"
            value={notes.length}
            icon="document"
            color="#4f46e5"
          />
          <StatCard
            label="Pending Todos"
            value={pendingTodos}
            icon="checkmark-circle"
            color="#10b981"
          />
        </View>

        <View className="flex-row flex-wrap">
          <StatCard
            label="Due Reminders"
            value={dueReminders}
            icon="notifications"
            color="#f59e0b"
          />
          <StatCard
            label="Balance"
            value={`$${balance.toFixed(0)}`}
            icon="wallet"
            color="#ec4899"
          />
        </View>

        <Text className="text-lg font-semibold text-gray-900 mt-8 mb-4">
          Quick Links
        </Text>

        <View className="flex-row flex-wrap">
          {[
            { name: 'Notes', icon: 'document', route: 'notes', color: '#4f46e5' },
            { name: 'Todos', icon: 'checkmark-circle', route: 'todo', color: '#10b981' },
            { name: 'Timer', icon: 'time', route: 'timer', color: '#f59e0b' },
            { name: 'Budget', icon: 'wallet', route: 'more', color: '#ec4899' },
          ].map((item) => (
            <TouchableOpacity
              key={item.name}
              onPress={() => router.push(`/(tabs)/${item.route}`)}
              className="w-1/2 p-2"
            >
              <View className="bg-white rounded-lg p-4 items-center justify-center">
                <View
                  className="w-12 h-12 rounded-lg justify-center items-center mb-2"
                  style={{ backgroundColor: item.color }}
                >
                  <Ionicons name={item.icon as any} size={20} color="#fff" />
                </View>
                <Text className="text-sm font-semibold text-gray-900">
                  {item.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
