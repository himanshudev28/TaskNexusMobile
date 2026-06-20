import React from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const tools = [
  { name: 'Budget Tracker', icon: 'wallet', color: '#ec4899', desc: 'Track income and expenses' },
  { name: 'Calculator', icon: 'calculator', color: '#f59e0b', desc: 'Quick calculations' },
  { name: 'Unit Converter', icon: 'shuffle', color: '#3b82f6', desc: 'Convert units' },
  { name: 'QR Generator', icon: 'qr-code', color: '#8b5cf6', desc: 'Create QR codes' },
  { name: 'Text Tools', icon: 'text', color: '#10b981', desc: 'Text utilities' },
  { name: 'Dev Tools', icon: 'code-slash', color: '#6366f1', desc: 'Developer tools' },
  { name: 'Image Tools', icon: 'image', color: '#ec4899', desc: 'Resize, crop, compress' },
  { name: 'PDF Tools', icon: 'document', color: '#f97316', desc: 'Merge, compress PDFs' },
  { name: 'Code Editor', icon: 'terminal', color: '#1e293b', desc: 'Edit & preview code' },
  { name: 'JSX Preview', icon: 'shapes', color: '#0ea5e9', desc: 'Preview React components' },
  { name: 'Reminders', icon: 'notifications', color: '#f43f5e', desc: 'Set reminders' },
  { name: 'Settings', icon: 'settings', color: '#64748b', desc: 'App settings' },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const numCols = width > 600 ? 2 : 2;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 20 }}
    >
      <View className="px-4">
        <View className="flex-row flex-wrap">
          {tools.map((tool) => (
            <View
              key={tool.name}
              style={{ width: `${100 / numCols}%` }}
              className="p-2"
            >
              <TouchableOpacity
                activeOpacity={0.7}
                className="bg-white rounded-lg p-4 items-center shadow-sm"
              >
                <View
                  className="w-16 h-16 rounded-full justify-center items-center mb-3"
                  style={{ backgroundColor: tool.color }}
                >
                  <Ionicons
                    name={tool.icon as any}
                    size={28}
                    color="#fff"
                  />
                </View>
                <Text className="text-sm font-semibold text-gray-900 text-center">
                  {tool.name}
                </Text>
                <Text className="text-xs text-gray-500 text-center mt-1">
                  {tool.desc}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
