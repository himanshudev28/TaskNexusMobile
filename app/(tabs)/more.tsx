import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const TOOLS = [
  { name: 'Budget', icon: 'wallet', color: '#ec4899', route: '/tools/budget', desc: 'Track income & expenses' },
  { name: 'Calculator', icon: 'calculator', color: '#f59e0b', route: '/tools/calculator', desc: 'Quick calculations' },
  { name: 'Converter', icon: 'shuffle', color: '#3b82f6', route: '/tools/converter', desc: 'Convert any unit' },
  { name: 'QR Code', icon: 'qr-code', color: '#8b5cf6', route: '/tools/qrcode', desc: 'Generate QR codes' },
  { name: 'Text Tools', icon: 'text', color: '#10b981', route: '/tools/texttools', desc: 'Case, count, encode' },
  { name: 'Dev Tools', icon: 'code-slash', color: '#6366f1', route: '/tools/devtools', desc: 'JSON, regex, colors' },
  { name: 'Reminders', icon: 'notifications', color: '#f43f5e', route: '/tools/reminders', desc: 'Set reminders' },
  { name: 'Quick Links', icon: 'link', color: '#0ea5e9', route: '/tools/quicklinks', desc: 'Save & open URLs' },
  { name: 'Code Editor', icon: 'terminal', color: '#1e293b', route: '/tools/codeeditor', desc: 'HTML/JS/CSS editor' },
  { name: 'JSX Preview', icon: 'shapes', color: '#4f46e5', route: '/tools/jsxpreview', desc: 'Preview React components' },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cols = width > 600 ? 3 : 2;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 12, paddingBottom: 20 }}
    >
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#9ca3af', marginBottom: 12,
        paddingHorizontal: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        All Tools
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {TOOLS.map((tool) => (
          <View key={tool.name} style={{ width: (100 / cols) + '%', padding: 5 }}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push(tool.route as any)}
              style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center',
                shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 16, justifyContent: 'center',
                alignItems: 'center', marginBottom: 10, backgroundColor: tool.color }}>
                <Ionicons name={tool.icon as any} size={26} color="#fff" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#111', textAlign: 'center' }}>
                {tool.name}
              </Text>
              <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 3 }}>
                {tool.desc}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
