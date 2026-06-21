import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, useWindowDimensions, TextInput } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const CATEGORIES = [
  {
    title: 'AI & Media',
    emoji: '✨',
    tools: [
      { name: 'AI Image Gen', icon: 'sparkles', color: '#8b5cf6', bg: '#f5f3ff', route: '/tools/aigen', desc: 'Generate images with AI' },
      { name: 'Image Tools', icon: 'image', color: '#ec4899', bg: '#fdf2f8', route: '/tools/imagetools', desc: 'Resize, compress, convert' },
      { name: 'Signature', icon: 'create', color: '#0ea5e9', bg: '#f0f9ff', route: '/tools/signature', desc: 'Draw your signature' },
    ],
  },
  {
    title: 'PDF Tools',
    emoji: '📄',
    tools: [
      { name: 'PDF Tools', icon: 'document-text', color: '#dc2626', bg: '#fef2f2', route: '/tools/pdftools', desc: 'Merge, compress, split' },
      { name: 'PDF Editor', icon: 'pencil', color: '#b45309', bg: '#fef9c3', route: '/tools/pdfeditor', desc: 'Annotate & edit PDFs' },
    ],
  },
  {
    title: 'Finance',
    emoji: '💰',
    tools: [
      { name: 'Budget', icon: 'wallet', color: '#ec4899', bg: '#fdf2f8', route: '/tools/budget', desc: 'Track income & expenses' },
      { name: 'Calculator', icon: 'calculator', color: '#f59e0b', bg: '#fffbeb', route: '/tools/calculator', desc: 'Quick calculations' },
    ],
  },
  {
    title: 'Utilities',
    emoji: '🔧',
    tools: [
      { name: 'Converter', icon: 'shuffle', color: '#3b82f6', bg: '#eff6ff', route: '/tools/converter', desc: 'Convert any unit' },
      { name: 'QR Code', icon: 'qr-code', color: '#8b5cf6', bg: '#f5f3ff', route: '/tools/qrcode', desc: 'Generate QR codes' },
      { name: 'Generators', icon: 'dice', color: '#10b981', bg: '#ecfdf5', route: '/tools/generators', desc: 'Password, UUID, colors' },
      { name: 'DateTime', icon: 'time', color: '#6366f1', bg: '#eef2ff', route: '/tools/datetime', desc: 'Clock, convert, countdown' },
      { name: 'Quick Links', icon: 'link', color: '#0ea5e9', bg: '#f0f9ff', route: '/tools/quicklinks', desc: 'Save & open URLs' },
      { name: 'Reminders', icon: 'notifications', color: '#f43f5e', bg: '#fff1f2', route: '/tools/reminders', desc: 'Set reminders' },
    ],
  },
  {
    title: 'Developer',
    emoji: '💻',
    tools: [
      { name: 'Text Tools', icon: 'text', color: '#10b981', bg: '#ecfdf5', route: '/tools/texttools', desc: 'Case, count, encode' },
      { name: 'Dev Tools', icon: 'code-slash', color: '#6366f1', bg: '#eef2ff', route: '/tools/devtools', desc: 'JSON, regex, colors' },
      { name: 'Code Editor', icon: 'terminal', color: '#1e293b', bg: '#f8fafc', route: '/tools/codeeditor', desc: 'HTML/JS/CSS editor' },
      { name: 'JSX Preview', icon: 'shapes', color: '#4f46e5', bg: '#eef2ff', route: '/tools/jsxpreview', desc: 'Preview React components' },
      { name: 'Data Testing', icon: 'analytics', color: '#0891b2', bg: '#ecfeff', route: '/tools/datatesting', desc: 'JSON, CSV, Regex' },
    ],
  },
  {
    title: 'Web & Network',
    emoji: '🌐',
    tools: [
      { name: 'Network', icon: 'wifi', color: '#0ea5e9', bg: '#f0f9ff', route: '/tools/network', desc: 'DNS, HTTP, IP info' },
      { name: 'SEO Tools', icon: 'search', color: '#16a34a', bg: '#f0fdf4', route: '/tools/seotools', desc: 'Analyze & optimize' },
      { name: 'RSS Reader', icon: 'newspaper', color: '#f59e0b', bg: '#fffbeb', route: '/tools/rsstools', desc: 'Read news feeds' },
    ],
  },
];

const ALL_TOOLS = CATEGORIES.flatMap(c => c.tools);

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? ALL_TOOLS.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()))
    : null;

  const renderTool = (tool: typeof ALL_TOOLS[0], index: number, colCount = 2) => (
    <Animated.View key={tool.name} entering={ZoomIn.delay(index * 40).springify()}
      style={{ width: `${100 / colCount}%`, padding: 5 }}>
      <TouchableOpacity activeOpacity={0.8}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(tool.route as any); }}
        style={{ backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center',
          shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
        <View style={{ width: 52, height: 52, borderRadius: 15, justifyContent: 'center',
          alignItems: 'center', marginBottom: 8, backgroundColor: tool.bg }}>
          <Ionicons name={tool.icon as any} size={24} color={tool.color} />
        </View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#111', textAlign: 'center' }}>{tool.name}</Text>
        <Text style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 2 }} numberOfLines={1}>{tool.desc}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const cols = width > 600 ? 3 : 2;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 30 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>All Tools</Text>
          <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{ALL_TOOLS.length} tools available</Text>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14,
            paddingHorizontal: 14, paddingVertical: 12, gap: 10,
            shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
            <Ionicons name="search" size={18} color="#9ca3af" />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search tools..."
              placeholderTextColor="#9ca3af" style={{ flex: 1, fontSize: 15, color: '#111' }} />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Search Results */}
        {filtered ? (
          <View style={{ paddingHorizontal: 12 }}>
            {filtered.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 40 }}>🔍</Text>
                <Text style={{ fontSize: 16, color: '#9ca3af', marginTop: 12 }}>No tools found</Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '600', paddingHorizontal: 4,
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {filtered.map((tool, i) => renderTool(tool, i, cols))}
                </View>
              </>
            )}
          </View>
        ) : (
          /* Categorized list */
          CATEGORIES.map((cat, ci) => (
            <Animated.View key={cat.title} entering={FadeInDown.delay(ci * 60).springify()} style={{ marginBottom: 24, paddingHorizontal: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {cat.title}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb', marginLeft: 6 }} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {cat.tools.map((tool, i) => renderTool(tool, ci * 10 + i, cols))}
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
