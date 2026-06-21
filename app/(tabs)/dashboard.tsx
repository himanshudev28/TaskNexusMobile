import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../../src/store/app';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const QUICK_ACCESS = [
  { name: 'Notes', icon: 'document-text', route: '/(tabs)/notes', color: '#4f46e5', bg: '#eef2ff' },
  { name: 'Todos', icon: 'checkmark-circle', route: '/(tabs)/todo', color: '#10b981', bg: '#ecfdf5' },
  { name: 'Budget', icon: 'wallet', route: '/tools/budget', color: '#ec4899', bg: '#fdf2f8' },
  { name: 'AI Image', icon: 'sparkles', route: '/tools/aigen', color: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Generators', icon: 'dice', route: '/tools/generators', color: '#f59e0b', bg: '#fffbeb' },
  { name: 'Dev Tools', icon: 'code-slash', route: '/tools/devtools', color: '#6366f1', bg: '#eef2ff' },
  { name: 'QR Code', icon: 'qr-code', route: '/tools/qrcode', color: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Network', icon: 'wifi', route: '/tools/network', color: '#0ea5e9', bg: '#f0f9ff' },
  { name: 'All Tools', icon: 'apps', route: '/(tabs)/more', color: '#374151', bg: '#f3f4f6' },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const notes = useAppStore((s) => s.notes);
  const todos = useAppStore((s) => s.todos);
  const reminders = useAppStore((s) => s.reminders);
  const transactions = useAppStore((s) => s.transactions);

  const pendingTodos = todos.filter((t) => !t.done).length;
  const dueReminders = reminders.filter((r) => !r.done && r.at && r.at <= Date.now()).length;
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

      {/* Hero Gradient */}
      <LinearGradient colors={['#4f46e5', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}>
        <Animated.View entering={FadeIn.delay(50)}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' }}>{greeting} 👋</Text>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 }}>TaskNexus</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>Your all-in-one productivity suite</Text>
        </Animated.View>

        {/* Balance Pill */}
        <Animated.View entering={FadeInDown.delay(100).springify()}
          style={{ flexDirection: 'row', marginTop: 20, backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 16, padding: 14, gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>BALANCE</Text>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 }}>${balance.toFixed(2)}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>INCOME</Text>
            <Text style={{ color: '#4ade80', fontSize: 18, fontWeight: '700', marginTop: 2 }}>+${income.toFixed(0)}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>SPEND</Text>
            <Text style={{ color: '#f87171', fontSize: 18, fontWeight: '700', marginTop: 2 }}>-${expense.toFixed(0)}</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Stats Cards */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={{ flexDirection: 'row', padding: 12, gap: 8, marginTop: -16 }}>
        {[
          { label: 'Notes', value: notes.length, icon: 'document-text', color: '#4f46e5', bg: '#eef2ff' },
          { label: 'To-Dos', value: pendingTodos, icon: 'checkmark-done', color: '#10b981', bg: '#ecfdf5' },
          { label: 'Overdue', value: dueReminders, icon: 'alarm', color: dueReminders > 0 ? '#dc2626' : '#6b7280', bg: dueReminders > 0 ? '#fef2f2' : '#f9fafb' },
        ].map((stat, i) => (
          <Animated.View key={stat.label} entering={ZoomIn.delay(200 + i * 60).springify()}
            style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
              shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 4 }}>
            <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: stat.bg,
              justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#111', letterSpacing: -0.5 }}>{stat.value}</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: '500' }}>{stat.label}</Text>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Quick Access */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827' }}>Quick Access</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/more' as any)}>
            <Text style={{ fontSize: 13, color: '#4f46e5', fontWeight: '600' }}>See all →</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }}>
        {QUICK_ACCESS.map((item, i) => (
          <Animated.View key={item.name} entering={ZoomIn.delay(300 + i * 40).springify()}
            style={{ width: '33.33%', padding: 5 }}>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(item.route as any); }}
              activeOpacity={0.8}
              style={{ backgroundColor: '#fff', borderRadius: 16, padding: 13, alignItems: 'center',
                shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
              <View style={{ width: 46, height: 46, borderRadius: 13, justifyContent: 'center',
                alignItems: 'center', marginBottom: 8, backgroundColor: item.bg }}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#374151', textAlign: 'center' }}>{item.name}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Recent Notes Preview */}
      {notes.length > 0 && (
        <Animated.View entering={FadeInDown.delay(500).springify()} style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827' }}>Recent Notes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/notes' as any)}>
              <Text style={{ fontSize: 13, color: '#4f46e5', fontWeight: '600' }}>View all →</Text>
            </TouchableOpacity>
          </View>
          {notes.slice(0, 3).map((note, i) => (
            <Animated.View key={note.id} entering={FadeInDown.delay(550 + i * 60).springify()}
              style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
                borderLeftWidth: 3, borderLeftColor: '#4f46e5',
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontWeight: '700', fontSize: 14, color: '#111' }} numberOfLines={1}>{note.title || 'Untitled'}</Text>
              <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }} numberOfLines={2}>{note.body}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {/* Recent Todos */}
      {todos.filter(t => !t.done).length > 0 && (
        <Animated.View entering={FadeInDown.delay(600).springify()} style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827' }}>Pending Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/todo' as any)}>
              <Text style={{ fontSize: 13, color: '#4f46e5', fontWeight: '600' }}>View all →</Text>
            </TouchableOpacity>
          </View>
          {todos.filter(t => !t.done).slice(0, 3).map((todo, i) => (
            <Animated.View key={todo.id} entering={FadeInDown.delay(650 + i * 60).springify()}
              style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
                flexDirection: 'row', alignItems: 'center', gap: 12,
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db' }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: '#111' }} numberOfLines={1}>{todo.title}</Text>
                {todo.priority && (
                  <Text style={{ fontSize: 11, color: todo.priority === 'high' ? '#dc2626' : todo.priority === 'medium' ? '#f59e0b' : '#10b981',
                    fontWeight: '600', marginTop: 2, textTransform: 'capitalize' }}>{todo.priority} priority</Text>
                )}
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      )}
      </ScrollView>
    </>
  );
}
