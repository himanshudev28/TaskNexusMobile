import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';

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

// ─── Color swatches ────────────────────────────────────────────────────────
const SWATCHES = [
  '#4f46e5', '#dc2626', '#16a34a', '#d97706', '#0891b2', '#7c3aed',
];

// ─── SHA WebView HTML ──────────────────────────────────────────────────────
// Uses SubtleCrypto inside a WebView since React Native doesn't have it.
const SHA_HTML = `<!DOCTYPE html>
<html>
<body>
<script>
async function hashText(text, algos) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const results = {};
  for (const algo of algos) {
    try {
      const buf = await crypto.subtle.digest(algo, data);
      const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
      results[algo] = hex;
    } catch(e) {
      results[algo] = 'error: ' + e.message;
    }
  }
  window.ReactNativeWebView.postMessage(JSON.stringify(results));
}
document.addEventListener('message', function(e) {
  const text = e.data;
  hashText(text, ['SHA-1','SHA-256','SHA-512']);
});
window.addEventListener('message', function(e) {
  const text = e.data;
  hashText(text, ['SHA-1','SHA-256','SHA-512']);
});
</script>
</body>
</html>`;

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

  // Hash state
  const [hashInput, setHashInput] = useState('');
  const [hashes, setHashes] = useState<{ 'SHA-1'?: string; 'SHA-256'?: string; 'SHA-512'?: string } | null>(null);
  const [hashLoading, setHashLoading] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', '');
  };

  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '').padEnd(6, '0').slice(0, 6);
    const r = parseInt(clean.slice(0, 2), 16) || 0;
    const g = parseInt(clean.slice(2, 4), 16) || 0;
    const b = parseInt(clean.slice(4, 6), 16) || 0;
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

  const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex);

  const triggerHash = () => {
    if (!hashInput.trim()) { Alert.alert('Error', 'Enter some text first'); return; }
    setHashLoading(true);
    setHashes(null);
    webviewRef.current?.injectJavaScript(`
      (function() {
        var event = new MessageEvent('message', { data: ${JSON.stringify(hashInput)} });
        window.dispatchEvent(event);
      })();
      true;
    `);
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

      case 'color': {
        const safeColor = isValidHex(color) ? color : '#4f46e5';
        const { r, g, b } = hexToRgb(safeColor);
        const { h, s, l } = hexToHsl(safeColor);
        return (
          <View style={{ gap: 12 }}>
            {/* Large preview swatch */}
            <View style={{ height: 100, borderRadius: 16, backgroundColor: safeColor,
              justifyContent: 'center', alignItems: 'center',
              shadowColor: safeColor, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 22,
                textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 6 }}>{safeColor.toUpperCase()}</Text>
            </View>

            {/* Preset swatches */}
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
              {SWATCHES.map((sw) => (
                <TouchableOpacity key={sw} onPress={() => setColor(sw)}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: sw,
                    borderWidth: color === sw ? 3 : 0, borderColor: '#fff',
                    shadowColor: sw, shadowOpacity: 0.6, shadowRadius: 6, elevation: 4 }} />
              ))}
            </View>

            {/* Color values */}
            {[
              ['HEX', safeColor.toUpperCase()],
              ['RGB', `rgb(${r}, ${g}, ${b})`],
              ['RGBA', `rgba(${r}, ${g}, ${b}, 1)`],
              ['HSL', `hsl(${h}, ${s}%, ${l}%)`],
            ].map(([label, val]) => (
              <TouchableOpacity key={label} onPress={() => copy(val)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: safeColor,
                    borderWidth: 1, borderColor: '#e5e7eb' }} />
                  <Text style={{ color: '#6b7280', fontWeight: '600', width: 44 }}>{label}</Text>
                </View>
                <Text style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#111', marginLeft: 4 }}>{val}</Text>
                <Ionicons name="copy" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        );
      }

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
            {/* Hidden WebView that performs real SubtleCrypto hashing */}
            <WebView
              ref={webviewRef}
              source={{ html: SHA_HTML }}
              style={{ height: 0, width: 0, opacity: 0 }}
              onMessage={(e) => {
                try {
                  const data = JSON.parse(e.nativeEvent.data);
                  setHashes(data);
                } catch {}
                setHashLoading(false);
              }}
              javaScriptEnabled
              originWhitelist={['*']}
            />

            <TextInput value={hashInput} onChangeText={(v) => { setHashInput(v); setHashes(null); }}
              placeholder="Enter text to hash..." multiline numberOfLines={4}
              style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb',
                minHeight: 100, textAlignVertical: 'top' }} />

            <TouchableOpacity onPress={triggerHash}
              style={{ backgroundColor: '#4f46e5', borderRadius: 10, padding: 12 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
                {hashLoading ? 'Computing...' : 'Generate Hashes'}
              </Text>
            </TouchableOpacity>

            {hashes && (
              <View style={{ gap: 10 }}>
                {(['SHA-1', 'SHA-256', 'SHA-512'] as const).map((algo) => (
                  <View key={algo} style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14,
                    borderWidth: 1, borderColor: '#bbf7d0' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontWeight: '700', color: '#15803d', fontSize: 13 }}>{algo}</Text>
                      <TouchableOpacity onPress={() => hashes[algo] && copy(hashes[algo]!)}>
                        <Ionicons name="copy" size={16} color="#16a34a" />
                      </TouchableOpacity>
                    </View>
                    <Text selectable style={{ fontFamily: 'monospace', fontSize: 11, color: '#111',
                      flexWrap: 'wrap' }}>{hashes[algo] || '–'}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      default: return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12,
        backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 }}>Dev Tools</Text>
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
