import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';

const LANGUAGES = ['html', 'css', 'javascript', 'json', 'markdown', 'plain'];

const SAMPLES: Record<string, string> = {
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello</title>\n  <style>\n    body { font-family: sans-serif; padding: 20px; }\n    h1 { color: #4f46e5; }\n  </style>\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <p>Edit this HTML and preview it.</p>\n  <button onclick="alert('Clicked!')">Click me</button>\n</body>\n</html>`,
  css: `body {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n  background: #f9fafb;\n  color: #111;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 20px;\n}`,
  javascript: `// JavaScript playground\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconst results = Array.from({ length: 10 }, (_, i) => fibonacci(i));\nconsole.log('Fibonacci:', results);\n\n// Array methods\nconst doubled = results.map(x => x * 2);\nconst evens = doubled.filter(x => x % 2 === 0);\nconst sum = evens.reduce((a, b) => a + b, 0);\n\nconsole.log('Sum of even doubled:', sum);`,
  json: `{\n  "name": "TaskNexus Mobile",\n  "version": "1.0.0",\n  "features": [\n    "notes",\n    "todos",\n    "timer",\n    "budget",\n    "calculator"\n  ],\n  "settings": {\n    "theme": "light",\n    "language": "en",\n    "autoSave": true\n  }\n}`,
  markdown: `# Markdown Editor\n\n## Features\n\n- **Bold text**\n- *Italic text*\n- ~~Strikethrough~~\n\n## Code Block\n\n\`\`\`javascript\nconsole.log('Hello!');\n\`\`\`\n\n## Table\n\n| Name | Value |\n|------|-------|\n| Key  | Data  |\n`,
  plain: '',
};

export default function CodeEditorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [lang, setLang] = useState('html');
  const [code, setCode] = useState(SAMPLES.html);
  const [showPreview, setShowPreview] = useState(false);

  const handleLangChange = (l: string) => {
    setLang(l);
    setCode(SAMPLES[l] || '');
    setShowPreview(false);
  };

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', 'Code copied to clipboard');
  };

  const formatJSON = () => {
    if (lang !== 'json') return;
    try {
      setCode(JSON.stringify(JSON.parse(code), null, 2));
    } catch {
      Alert.alert('Error', 'Invalid JSON');
    }
  };

  const previewHtml = lang === 'html' ? code
    : lang === 'css' ? `<html><head><style>${code}</style></head><body><h1>CSS Preview</h1><p>Your styles are applied above.</p></body></html>`
    : lang === 'javascript' ? `<html><body><script>
try {
  const _log = [];
  const _orig = console.log;
  console.log = (...args) => { _log.push(args.join(' ')); _orig.apply(console, args); };
  ${code}
  document.body.innerHTML = '<pre style="padding:16px;font-family:monospace;font-size:14px">' + _log.map(l => '> ' + l).join('\\n') + '</pre>';
} catch(e) {
  document.body.innerHTML = '<pre style="color:red;padding:16px">' + e.message + '</pre>';
}
<\/script></body></html>`
    : `<html><body style="font-family:sans-serif;padding:16px"><pre>${code.replace(/</g, '&lt;')}</pre></body></html>`;

  return (
    <View style={{ flex: 1, backgroundColor: '#1e1e2e', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#cdd6f4" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#cdd6f4' }}>Code Editor</Text>
        <TouchableOpacity onPress={copy} style={{ padding: 8 }}>
          <Ionicons name="copy" size={20} color="#cdd6f4" />
        </TouchableOpacity>
        {(lang === 'html' || lang === 'css' || lang === 'javascript') && (
          <TouchableOpacity onPress={() => setShowPreview(!showPreview)}
            style={{ backgroundColor: showPreview ? '#4f46e5' : 'transparent', borderRadius: 8, padding: 8 }}>
            <Ionicons name={showPreview ? 'code' : 'eye'} size={20} color="#cdd6f4" />
          </TouchableOpacity>
        )}
        {lang === 'json' && (
          <TouchableOpacity onPress={formatJSON} style={{ padding: 8 }}>
            <Ionicons name="sparkles" size={20} color="#cdd6f4" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lang Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, paddingHorizontal: 12, marginBottom: 8 }}>
        {LANGUAGES.map((l) => (
          <TouchableOpacity key={l} onPress={() => handleLangChange(l)}
            style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, marginRight: 6,
              backgroundColor: lang === l ? '#4f46e5' : '#313244' }}>
            <Text style={{ color: lang === l ? '#fff' : '#9ca3af', fontWeight: '600', fontSize: 12,
              textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showPreview ? (
        <WebView
          source={{ html: previewHtml }}
          style={{ flex: 1, margin: 12, borderRadius: 12, overflow: 'hidden' }}
          originWhitelist={['*']}
          javaScriptEnabled
        />
      ) : (
        <TextInput
          value={code}
          onChangeText={setCode}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          style={{ flex: 1, margin: 12, padding: 16, backgroundColor: '#181825',
            borderRadius: 12, color: '#cdd6f4', fontFamily: 'monospace', fontSize: 14, lineHeight: 22,
            textAlignVertical: 'top' }}
          placeholder="Start typing..."
          placeholderTextColor="#585b70"
        />
      )}

      {/* Status Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8,
        borderTopWidth: 1, borderTopColor: '#313244', paddingBottom: insets.bottom + 8 }}>
        <Text style={{ color: '#585b70', fontSize: 12 }}>{lang.toUpperCase()}</Text>
        <Text style={{ color: '#585b70', fontSize: 12 }}>
          {code.split('\n').length} lines · {code.length} chars
        </Text>
      </View>
    </View>
  );
}
