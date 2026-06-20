import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

const TOOLS = [
  { id: 'case', label: 'Case Convert', icon: 'text' },
  { id: 'count', label: 'Word Count', icon: 'analytics' },
  { id: 'trim', label: 'Trim & Clean', icon: 'cut' },
  { id: 'encode', label: 'Encode/Decode', icon: 'code' },
  { id: 'reverse', label: 'Reverse', icon: 'return-down-back' },
  { id: 'sort', label: 'Sort Lines', icon: 'list' },
];

export default function TextToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [active, setActive] = useState('case');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const transform = (tool: string, text: string) => {
    if (!text) { Alert.alert('Error', 'Enter some text first'); return; }
    let result = '';
    switch (tool) {
      case 'upper': result = text.toUpperCase(); break;
      case 'lower': result = text.toLowerCase(); break;
      case 'title': result = text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()); break;
      case 'sentence': result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(); break;
      case 'camel': result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (l, i) => i === 0 ? l.toLowerCase() : l.toUpperCase()).replace(/\s+/g, ''); break;
      case 'snake': result = text.toLowerCase().replace(/\s+/g, '_'); break;
      case 'kebab': result = text.toLowerCase().replace(/\s+/g, '-'); break;
      case 'trim': result = text.trim().replace(/\s+/g, ' '); break;
      case 'removelines': result = text.split('\n').filter((l) => l.trim()).join('\n'); break;
      case 'base64enc': result = btoa(unescape(encodeURIComponent(text))); break;
      case 'base64dec': try { result = decodeURIComponent(escape(atob(text))); } catch { result = 'Invalid Base64 input'; } break;
      case 'urlenc': result = encodeURIComponent(text); break;
      case 'urldec': result = decodeURIComponent(text); break;
      case 'reverse': result = text.split('').reverse().join(''); break;
      case 'reversewords': result = text.split(' ').reverse().join(' '); break;
      case 'sortasc': result = text.split('\n').sort().join('\n'); break;
      case 'sortdesc': result = text.split('\n').sort().reverse().join('\n'); break;
      case 'dedup': result = [...new Set(text.split('\n'))].join('\n'); break;
    }
    setOutput(result);
  };

  const stats = () => {
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const chars = input.length;
    const charsNoSpace = input.replace(/\s/g, '').length;
    const lines = input.split('\n').length;
    const sentences = (input.match(/[.!?]+/g) || []).length;
    const paragraphs = input.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const readTime = Math.ceil(words / 200);
    return { words, chars, charsNoSpace, lines, sentences, paragraphs, readTime };
  };

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', 'Text copied to clipboard');
  };

  const s = stats();

  const renderTool = () => {
    if (active === 'count') {
      return (
        <View style={{ gap: 10 }}>
          {[
            ['Words', s.words], ['Characters', s.chars], ['Chars (no space)', s.charsNoSpace],
            ['Lines', s.lines], ['Sentences', s.sentences], ['Paragraphs', s.paragraphs], ['Read time (min)', s.readTime],
          ].map(([label, val]) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' }}>
              <Text style={{ color: '#6b7280', fontSize: 14 }}>{label}</Text>
              <Text style={{ fontWeight: '700', fontSize: 18, color: '#4f46e5' }}>{val}</Text>
            </View>
          ))}
        </View>
      );
    }

    const btns: [string, string][] = active === 'case'
      ? [['Upper', 'upper'], ['Lower', 'lower'], ['Title', 'title'], ['Sentence', 'sentence'], ['camelCase', 'camel'], ['snake_case', 'snake'], ['kebab-case', 'kebab']]
      : active === 'trim'
      ? [['Trim Whitespace', 'trim'], ['Remove Blank Lines', 'removelines']]
      : active === 'encode'
      ? [['Base64 Encode', 'base64enc'], ['Base64 Decode', 'base64dec'], ['URL Encode', 'urlenc'], ['URL Decode', 'urldec']]
      : active === 'reverse'
      ? [['Reverse Chars', 'reverse'], ['Reverse Words', 'reversewords']]
      : [['Sort A→Z', 'sortasc'], ['Sort Z→A', 'sortdesc'], ['Remove Duplicates', 'dedup']];

    return (
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {btns.map(([label, id]) => (
            <TouchableOpacity key={id} onPress={() => transform(id, input)}
              style={{ backgroundColor: '#4f46e5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {output ? (
          <View style={{ backgroundColor: '#f0f9ff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#bae6fd' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', color: '#0369a1' }}>Result</Text>
              <TouchableOpacity onPress={() => copy(output)}>
                <Ionicons name="copy" size={18} color="#0369a1" />
              </TouchableOpacity>
            </View>
            <Text selectable style={{ color: '#111', fontSize: 14 }}>{output}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111' }}>Text Tools</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 12, flexGrow: 0 }}>
        {TOOLS.map((t) => (
          <TouchableOpacity key={t.id} onPress={() => { setActive(t.id); setOutput(''); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8,
              borderRadius: 20, marginRight: 8, backgroundColor: active === t.id ? '#4f46e5' : '#e5e7eb' }}>
            <Ionicons name={t.icon as any} size={14} color={active === t.id ? '#fff' : '#6b7280'} />
            <Text style={{ fontWeight: '600', fontSize: 13, color: active === t.id ? '#fff' : '#6b7280' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <TextInput value={input} onChangeText={(v) => { setInput(v); setOutput(''); }}
          placeholder="Enter your text here..." multiline numberOfLines={5}
          style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14,
            borderWidth: 1, borderColor: '#e5e7eb', minHeight: 120, textAlignVertical: 'top' }} />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={async () => { const t = await Clipboard.getStringAsync(); setInput(t); }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              backgroundColor: '#e5e7eb', borderRadius: 10, padding: 10 }}>
            <Ionicons name="clipboard" size={16} color="#6b7280" />
            <Text style={{ fontWeight: '600', color: '#6b7280', fontSize: 13 }}>Paste</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setInput(''); setOutput(''); }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              backgroundColor: '#fee2e2', borderRadius: 10, padding: 10 }}>
            <Ionicons name="trash" size={16} color="#dc2626" />
            <Text style={{ fontWeight: '600', color: '#dc2626', fontSize: 13 }}>Clear</Text>
          </TouchableOpacity>
        </View>

        {renderTool()}
      </ScrollView>
    </View>
  );
}
