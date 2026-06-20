import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

const TABS = [
  { id: 'json', label: 'JSON', icon: 'code' },
  { id: 'regex', label: 'Regex', icon: 'search' },
  { id: 'color', label: 'Color', icon: 'color-palette' },
  { id: 'hash', label: 'Hash', icon: 'key' },
  { id: 'uuid', label: 'UUID', icon: 'finger-print' },
  { id: 'base64', label: 'Base64', icon: 'document-text' },
];

const uid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

export default function DevToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState('json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [regexStr, setRegexStr] = useState('');
  const [regexFlags, setRegexFlags] = useState('g');
  const [color, setColor] = useState('#4f46e5');
  const [uuids, setUuids] = useState<string[]>([]);

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', '');
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const hexToHsl = (hex: string) => {
    let { r, g, b } = hexToRgb(hex);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h = max === r ? (g - b) / d + (g < b ? 6 : 0)
        : max === g ? (b - r) / d + 2
        : (r - g) / d + 4;
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const renderTab = () => {
    switch (tab) {
      case 'json':
        return (
          <View style={{ gap: 12 }}>
            <TextInput value={input} onChangeText={setInput} placeholder='{"key": "value"}...'
              multiline numberOfLines={6} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14,
                fontSize: 13, fontFamily: 'monospace', borderWidth: 1, borderColor: '#e5e7eb', minHeight: 120, textAlignVertical: 'top' }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => { try { setOutput(JSON.stringify(JSON.parse(input), null, 2)); } catch (e: any) { setOutput('Error: ' + e.message); } }}
                style={{ flex: 1, backgroundColor: '#4f46e5', borderRadius: 10, padding: 12 }}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Format</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { try { setOutput(JSON.stringify(JSON.parse(input))); } catch (e: any) { setOutput('Error: ' + e.message); } }}
                style={{ flex: 1, backgroundColor: '#6b7280', borderRadius: 10, padding: 12 }}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Minify</Text>
              </TouchableOpacity>
            </View>
            {output ? <View style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#bbf7d0' }}>
              <TouchableOpacity onPress={() => copy(output)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                <Ionicons name="copy" size={18} color="#16a34a" />
              </TouchableOpacity>
              <Text selectable style={{ fontFamily: 'monospace', fontSize: 12, color: '#111' }}>{output}</Text>
            </View> : null}
          </View>
        );

      case 'regex':
        return (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={regexStr} onChangeText={setRegexStr} placeholder="Regex pattern..."
                style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', fontFamily: 'monospace', fontSize: 14 }} />
              <TextInput value={regexFlags} onChangeText={setRegexFlags} placeholder="gim"
                style={{ width: 60, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 14, textAlign: 'center' }} />
            </View>
            <TextInput value={input} onChangeText={setInput} placeholder="Test text..." multiline numberOfLines={4}
              style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', minHeight: 100, textAlignVertical: 'top' }} />
            <TouchableOpacity onPress={() => {
              try {
                const re = new RegExp(regexStr, regexFlags);
                const matches = [...input.matchAll(re)];
                if (!matches.length) setOutput('No matches found');
                else setOutput(`${matches.length} match(es):\n${matches.map((m, i) => `[${i + 1}] "${m[0]}" at index ${m.index}`).join('\n')}`);
              } catch (e: any) { setOutput('Invalid regex: ' + e.message); }
            }} style={{ backgroundColor: '#4f46e5', borderRadius: 10, padding: 12 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Test Regex</Text>
            </TouchableOpacity>
            {output ? <View style={{ backgroundColor: '#f0f9ff', borderRadius: 12, padding: 14 }}>
              <Text style={{ fontFamily: 'monospace', fontSize: 13, color: '#111' }}>{output}</Text>
            </View> : null}
          </View>
        );

      case 'color':
        const { r, g, b } = hexToRgb(color);
        const { h, s, l } = hexToHsl(color);
        return (
          <View style={{ gap: 12 }}>
            <TextInput value={color} onChangeText={setColor} placeholder="#4f46e5" autoCapitalize="none"
              style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 16, fontFamily: 'monospace' }} />
            <View style={{ height: 120, borderRadius: 16, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 20, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4 }}>{color}</Text>
            </View>
            {[
              ['HEX', color],
              ['RGB', `rgb(${r}, ${g}, ${b})`],
              ['RGBA', `rgba(${r}, ${g}, ${b}, 1)`],
              ['HSL', `hsl(${h}, ${s}%, ${l}%)`],
            ].map(([label, val]) => (
              <TouchableOpacity key={label} onPress={() => copy(val)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' }}>
                <Text style={{ color: '#6b7280', fontWeight: '600', width: 50 }}>{label}</Text>
                <Text style={{ flex: 1, fontFamily: 'monospace', fontSize: 14, color: '#111' }}>{val}</Text>
                <Ionicons name="copy" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'uuid':
        return (
          <View style={{ gap: 12 }}>
            <TouchableOpacity onPress={() => setUuids([uid(), uid(), uid(), uid(), uid()])}
              style={{ backgroundColor: '#4f46e5', borderRadius: 12, padding: 15 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Generate 5 UUIDs</Text>
            </TouchableOpacity>
            {uuids.map((u, i) => (
              <TouchableOpacity key={i} onPress={() => copy(u)}
                style={{ backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e5e7eb',
                  flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#111' }}>{u}</Text>
                <Ionicons name="copy" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'base64':
        return (
          <View style={{ gap: 12 }}>
            <TextInput value={input} onChangeText={setInput} placeholder="Enter text or Base64..." multiline numberOfLines={5}
              style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb',
                minHeight: 120, textAlignVertical: 'top', fontFamily: 'monospace', fontSize: 13 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => { try { setOutput(btoa(unescape(encodeURIComponent(input)))); } catch { setOutput('Encode failed'); } }}
                style={{ flex: 1, backgroundColor: '#4f46e5', borderRadius: 10, padding: 12 }}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Encode</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { try { setOutput(decodeURIComponent(escape(atob(input)))); } catch { setOutput('Invalid Base64'); } }}
                style={{ flex: 1, backgroundColor: '#16a34a', borderRadius: 10, padding: 12 }}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Decode</Text>
              </TouchableOpacity>
            </View>
            {output ? <View style={{ backgroundColor: '#f0f9ff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#bae6fd' }}>
              <TouchableOpacity onPress={() => copy(output)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                <Ionicons name="copy" size={18} color="#0369a1" />
              </TouchableOpacity>
              <Text selectable style={{ fontFamily: 'monospace', fontSize: 12, color: '#111' }}>{output}</Text>
            </View> : null}
          </View>
        );

      case 'hash':
        return (
          <View style={{ gap: 12 }}>
            <TextInput value={input} onChangeText={setInput} placeholder="Enter text to hash..." multiline numberOfLines={4}
              style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb',
                minHeight: 100, textAlignVertical: 'top' }} />
            <TouchableOpacity onPress={() => setOutput(simpleHash(input))}
              style={{ backgroundColor: '#4f46e5', borderRadius: 10, padding: 12 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Generate Hash</Text>
            </TouchableOpacity>
            <Text style={{ color: '#6b7280', fontSize: 12, textAlign: 'center' }}>
              Note: Simple hash for dev use. Not cryptographically secure.
            </Text>
            {output ? <TouchableOpacity onPress={() => copy(output)}
              style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#bbf7d0',
                flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ flex: 1, fontFamily: 'monospace', fontSize: 16, color: '#111' }}>{output}</Text>
              <Ionicons name="copy" size={18} color="#16a34a" />
            </TouchableOpacity> : null}
          </View>
        );

      default: return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111' }}>Dev Tools</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 12, flexGrow: 0 }}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.id} onPress={() => { setTab(t.id); setOutput(''); setInput(''); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8,
              borderRadius: 20, marginRight: 8, backgroundColor: tab === t.id ? '#4f46e5' : '#e5e7eb' }}>
            <Ionicons name={t.icon as any} size={14} color={tab === t.id ? '#fff' : '#6b7280'} />
            <Text style={{ fontWeight: '600', fontSize: 13, color: tab === t.id ? '#fff' : '#6b7280' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {renderTab()}
      </ScrollView>
    </View>
  );
}
