import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/app';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const notes = useAppStore((s) => s.notes);
  const todos = useAppStore((s) => s.todos);
  const reminders = useAppStore((s) => s.reminders);
  const transactions = useAppStore((s) => s.transactions);

  const pendingTodos = todos.filter((t) => !t.done).length;
  const dueReminders = reminders.filter((r) => !r.done && r.at && r.at <= Date.now()).length;
  const balance = transactions.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

  const StatCard = ({ label, value, icon, color }: any) => (
    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, margin: 5,
      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>{label}</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#111' }}>{value}</Text>
        </View>
        <View style={{ width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: color }}>
          <Ionicons name={icon} size={22} color="#fff" />
        </View>
      </View>
    </View>
  );

  const QUICK = [
    { name: 'Notes', icon: 'document', route: '/(tabs)/notes', color: '#4f46e5' },
    { name: 'Todos', icon: 'checkmark-circle', route: '/(tabs)/todo', color: '#10b981' },
    { name: 'Budget', icon: 'wallet', route: '/tools/budget', color: '#ec4899' },
    { name: 'Timer', icon: 'time', route: '/(tabs)/timer', color: '#f59e0b' },
    { name: 'Reminders', icon: 'notifications', route: '/tools/reminders', color: '#f43f5e' },
    { name: 'More Tools', icon: 'apps', route: '/(tabs)/more', color: '#6366f1' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}
      contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Hero */}
      <View style={{ backgroundColor: '#4f46e5', padding: 24, paddingTop: insets.top + 20 }}>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>Welcome back</Text>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 }}>TaskNexus</Text>
      </View>

      {/* Stats */}
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row' }}>
          <StatCard label="Notes" value={notes.length} icon="document" color="#4f46e5" />
          <StatCard label="Pending Todos" value={pendingTodos} icon="checkmark-circle" color="#10b981" />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <StatCard label="Due Reminders" value={dueReminders} icon="notifications" color="#f43f5e" />
          <StatCard label="Balance" value={`$${balance.toFixed(0)}`} icon="wallet" color="#ec4899" />
        </View>
      </View>

      {/* Quick Links */}
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', paddingHorizontal: 16, marginTop: 8, marginBottom: 12 }}>
        Quick Access
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
        {QUICK.map((item) => (
          <TouchableOpacity key={item.name} onPress={() => router.push(item.route as any)}
            style={{ width: '33.33%', padding: 5 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center',
              shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
                marginBottom: 8, backgroundColor: item.color }}>
                <Ionicons name={item.icon as any} size={20} color="#fff" />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' }}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
