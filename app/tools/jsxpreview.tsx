import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

const SAMPLE = `export default function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ fontFamily: 'system-ui', padding: 40, textAlign: 'center' }}>
      <h1 style={{ color: '#4f46e5' }}>Hello World 👋</h1>
      <p>Count: <b>{count}</b></p>
      <button
        onClick={() => setCount(count + 1)}
        style={{ padding: '12px 28px', fontSize: 16,
                 background: '#4f46e5', color: '#fff',
                 border: 'none', borderRadius: 10, cursor: 'pointer' }}>
        Click Me
      </button>
    </div>
  );
}`;

const buildPreviewHtml = (jsx: string) => {
  const processed = jsx
    .replace(/^[ \t]*import[ \t][^\n;]*;?[ \t]*$/gm, '')
    .replace(/export\s+default\s+/, 'window.__COMP__ = ')
    .replace(/export\s*\{[^}]*\}\s*;?/g, '')
    .replace(/\bexport\s+(const|let|var|function|class|async)\b/g, '$1');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>* { box-sizing: border-box; } body { margin: 0; }</style>
</head>
<body>
<div id="root"></div>
<script>
window.onerror = function(msg) {
  document.body.innerHTML = '<pre style="color:red;padding:16px;font-family:monospace">' + msg + '</pre>';
};
</script>
<script type="text/babel" data-presets="react">
try {
  var React = window.React;
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef,
      useMemo = React.useMemo, useCallback = React.useCallback;
  ${processed}
  var C = window.__COMP__;
  if (!C) throw new Error('No default export. Use: export default function App() {...}');
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(C));
} catch(e) {
  document.body.innerHTML = '<pre style="color:red;padding:16px;font-family:monospace">' + (e.message || e) + '</pre>';
}
</script>
</body>
</html>`;
};

export default function JsxPreviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [code, setCode] = useState(SAMPLE);
  const [previewHtml, setPreviewHtml] = useState('');
  const [mode, setMode] = useState<'editor' | 'preview'>('editor');

  const handlePreview = () => {
    setPreviewHtml(buildPreviewHtml(code));
    setMode('preview');
  };

  const handleReset = () => {
    setCode(SAMPLE);
    setPreviewHtml('');
    setMode('editor');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1e1e2e', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#cdd6f4" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#cdd6f4' }}>JSX Preview</Text>
        <TouchableOpacity onPress={handleReset} style={{ padding: 8 }}>
          <Ionicons name="refresh" size={20} color="#cdd6f4" />
        </TouchableOpacity>
      </View>

      {/* Mode Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 8 }}>
        <TouchableOpacity onPress={() => setMode('editor')} style={{ flex: 1, paddingVertical: 8, borderRadius: 8,
          backgroundColor: mode === 'editor' ? '#4f46e5' : '#313244', alignItems: 'center' }}>
          <Text style={{ color: mode === 'editor' ? '#fff' : '#9ca3af', fontWeight: '600' }}>Editor</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePreview} style={{ flex: 1, paddingVertical: 8, borderRadius: 8,
          backgroundColor: mode === 'preview' ? '#4f46e5' : '#313244', alignItems: 'center' }}>
          <Ionicons name="eye" size={16} color={mode === 'preview' ? '#fff' : '#9ca3af'} />
        </TouchableOpacity>
      </View>

      {mode === 'editor' ? (
        <>
          <TextInput
            value={code}
            onChangeText={setCode}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            style={{ flex: 1, margin: 12, padding: 16, backgroundColor: '#181825',
              borderRadius: 12, color: '#cdd6f4', fontFamily: 'monospace', fontSize: 13, lineHeight: 22,
              textAlignVertical: 'top' }}
            placeholder="Paste JSX component..."
            placeholderTextColor="#585b70"
          />
          <View style={{ padding: 12, paddingBottom: insets.bottom + 12 }}>
            <TouchableOpacity onPress={handlePreview}
              style={{ backgroundColor: '#4f46e5', borderRadius: 12, padding: 15, flexDirection: 'row',
                justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Preview Component</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={{ flex: 1, margin: 12, borderRadius: 12, overflow: 'hidden' }}>
          <WebView
            source={{ html: previewHtml }}
            style={{ flex: 1, backgroundColor: '#fff' }}
            originWhitelist={['*']}
            javaScriptEnabled
            allowUniversalAccessFromFileURLs
          />
          <TouchableOpacity onPress={() => setMode('editor')}
            style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: '#4f46e5',
              borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="code" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
