import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';

const TOOLS = [
  { id: 'case', label: 'Case Convert', icon: 'text' },
  { id: 'count', label: 'Word Count', icon: 'analytics' },
  { id: 'trim', label: 'Trim & Clean', icon: 'cut' },
  { id: 'encode', label: 'Encode/Decode', icon: 'code' },
  { id: 'reverse', label: 'Reverse', icon: 'return-down-back' },
  { id: 'sort', label: 'Sort Lines', icon: 'list' },
  { id: 'markdown', label: 'Markdown', icon: 'logo-markdown' },
  { id: 'diff', label: 'Diff', icon: 'git-compare' },
];

// ─── Pure-JS LCS diff ──────────────────────────────────────────────────────
type DiffLine = { type: 'add' | 'remove' | 'equal'; text: string };

function computeDiff(original: string, modified: string): DiffLine[] {
  const a = original.split('\n');
  const b = modified.split('\n');
  const m = a.length, n = b.length;
  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'equal', text: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', text: b[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'remove', text: a[i - 1] });
      i--;
    }
  }
  return result;
}

// ─── Markdown WebView HTML builder ─────────────────────────────────────────
function buildMarkdownHTML(md: string): string {
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const js = `
    function parseMarkdown(text) {
      let html = text;
      // Escape < > & already done server-side, work on raw text here
      // headings
      html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
      html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
      html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
      html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
      html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
      // blockquote
      html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
      // horizontal rule
      html = html.replace(/^---$/gm, '<hr>');
      // unordered list items
      html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
      html = html.replace(/(<li>.*<\\/li>)/gs, function(m){ return '<ul>' + m + '</ul>'; });
      // bold+italic
      html = html.replace(/\\*\\*\\*(.+?)\\*\\*\\*/g, '<strong><em>$1</em></strong>');
      // bold
      html = html.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
      // italic
      html = html.replace(/\\*(.+?)\\*/g, '<em>$1</em>');
      // inline code
      html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
      // links
      html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>');
      // paragraphs (double newline)
      html = html.replace(/\\n\\n/g, '</p><p>');
      html = '<p>' + html + '</p>';
      // single newlines become <br>
      html = html.replace(/([^>])\\n([^<])/g, '$1<br>$2');
      return html;
    }
    document.getElementById('preview').innerHTML = parseMarkdown(document.getElementById('raw').textContent);
  `;

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, sans-serif; padding: 12px; margin: 0; color: #111; font-size: 15px; line-height: 1.6; }
  h1,h2,h3,h4,h5,h6 { color: #4f46e5; margin: 8px 0 4px; }
  h1 { font-size: 22px; } h2 { font-size: 19px; } h3 { font-size: 17px; }
  blockquote { border-left: 4px solid #4f46e5; margin: 8px 0; padding: 4px 12px; background: #f0f0ff; color: #555; }
  code { background: #f3f4f6; border-radius: 4px; padding: 1px 5px; font-family: monospace; font-size: 13px; }
  hr { border: none; border-top: 2px solid #e5e7eb; margin: 12px 0; }
  ul { margin: 6px 0 6px 20px; padding: 0; }
  li { margin: 2px 0; }
  a { color: #4f46e5; }
  p { margin: 6px 0; }
  strong { font-weight: 700; }
  em { font-style: italic; }
</style>
</head>
<body>
<pre id="raw" style="display:none">${escaped}</pre>
<div id="preview"></div>
<script>${js}</script>
</body>
</html>`;
}

export default function TextToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [active, setActive] = useState('case');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  // Markdown state
  const [mdText, setMdText] = useState('# Hello Markdown\n\nType **bold**, *italic*, `code`, > blockquote\n\n- item 1\n- item 2\n\n[Link](https://example.com)\n\n---\n\nEnjoy!');
  const [mdView, setMdView] = useState<'split' | 'editor' | 'preview'>('split');
  const [mdKey, setMdKey] = useState(0);

  // Diff state
  const [origText, setOrigText] = useState('');
  const [modText, setModText] = useState('');
  const [diffLines, setDiffLines] = useState<DiffLine[] | null>(null);

  const screenH = Dimensions.get('window').height;

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

  // ─── Diff renderer ─────────────────────────────────────────────────────
  const renderDiffLines = (lines: DiffLine[]) => {
    const CONTEXT = 2;
    const result: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.type !== 'equal') {
        result.push(
          <View key={i} style={{ backgroundColor: line.type === 'add' ? '#dcfce7' : '#fee2e2',
            paddingHorizontal: 10, paddingVertical: 3, borderLeftWidth: 3,
            borderLeftColor: line.type === 'add' ? '#16a34a' : '#dc2626' }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 12,
              color: line.type === 'add' ? '#15803d' : '#b91c1c' }}>
              {line.type === 'add' ? '+ ' : '- '}{line.text}
            </Text>
          </View>
        );
        i++;
      } else {
        // Find run of equal lines
        let start = i;
        while (i < lines.length && lines[i].type === 'equal') i++;
        const count = i - start;
        if (count <= CONTEXT * 2 + 1) {
          for (let k = start; k < i; k++) {
            result.push(
              <View key={k} style={{ paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#9ca3af' }}>
                  {'  '}{lines[k].text}
                </Text>
              </View>
            );
          }
        } else {
          // Show first CONTEXT + collapsed + last CONTEXT
          for (let k = start; k < start + CONTEXT; k++) {
            result.push(
              <View key={k} style={{ paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#9ca3af' }}>{'  '}{lines[k].text}</Text>
              </View>
            );
          }
          result.push(
            <View key={`collapse-${start}`} style={{ paddingHorizontal: 10, paddingVertical: 4,
              backgroundColor: '#f3f4f6', borderRadius: 4, marginVertical: 2 }}>
              <Text style={{ fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
                ... {count - CONTEXT * 2} unchanged lines ...
              </Text>
            </View>
          );
          for (let k = i - CONTEXT; k < i; k++) {
            result.push(
              <View key={k + 10000} style={{ paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#9ca3af' }}>{'  '}{lines[k].text}</Text>
              </View>
            );
          }
        }
      }
    }
    return result;
  };

  // ─── Tab content ───────────────────────────────────────────────────────
  const renderTool = () => {
    // ── Markdown ──
    if (active === 'markdown') {
      const viewBtns: Array<[string, 'split' | 'editor' | 'preview']> = [
        ['Split', 'split'], ['Editor', 'editor'], ['Preview', 'preview'],
      ];
      const showEditor = mdView === 'split' || mdView === 'editor';
      const showPreview = mdView === 'split' || mdView === 'preview';
      const halfH = screenH * 0.32;

      return (
        <View style={{ gap: 10 }}>
          {/* View toggle + copy */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {viewBtns.map(([label, v]) => (
                <TouchableOpacity key={v} onPress={() => setMdView(v)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                    backgroundColor: mdView === v ? '#4f46e5' : '#e5e7eb' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: mdView === v ? '#fff' : '#6b7280' }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => copy(mdText)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: '#f0f9ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                borderWidth: 1, borderColor: '#bae6fd' }}>
              <Ionicons name="copy" size={14} color="#0369a1" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#0369a1' }}>Copy MD</Text>
            </TouchableOpacity>
          </View>

          {/* Editor */}
          {showEditor && (
            <TextInput
              value={mdText}
              onChangeText={(v) => { setMdText(v); setMdKey((k) => k + 1); }}
              multiline
              placeholder="Type markdown here..."
              style={{ backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14, fontSize: 13,
                fontFamily: 'monospace', color: '#e2e8f0', minHeight: halfH,
                textAlignVertical: 'top', borderWidth: 1, borderColor: '#374151' }}
            />
          )}

          {/* Preview */}
          {showPreview && (
            <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1,
              borderColor: '#e5e7eb', minHeight: halfH, backgroundColor: '#fff' }}>
              <WebView
                key={mdKey}
                source={{ html: buildMarkdownHTML(mdText) }}
                style={{ minHeight: halfH, backgroundColor: '#fff' }}
                scrollEnabled
                originWhitelist={['*']}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      );
    }

    // ── Diff ──
    if (active === 'diff') {
      const added = diffLines ? diffLines.filter((l) => l.type === 'add').length : 0;
      const removed = diffLines ? diffLines.filter((l) => l.type === 'remove').length : 0;
      const unchanged = diffLines ? diffLines.filter((l) => l.type === 'equal').length : 0;

      return (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#b91c1c', marginBottom: 4, letterSpacing: 0.5 }}>ORIGINAL</Text>
              <TextInput
                value={origText}
                onChangeText={(v) => { setOrigText(v); setDiffLines(null); }}
                multiline
                placeholder="Paste original text..."
                style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12,
                  fontSize: 12, fontFamily: 'monospace', borderWidth: 1, borderColor: '#fca5a5',
                  minHeight: 160, textAlignVertical: 'top', color: '#111' }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803d', marginBottom: 4, letterSpacing: 0.5 }}>MODIFIED</Text>
              <TextInput
                value={modText}
                onChangeText={(v) => { setModText(v); setDiffLines(null); }}
                multiline
                placeholder="Paste modified text..."
                style={{ backgroundColor: '#fff', borderRadius: 10, padding: 12,
                  fontSize: 12, fontFamily: 'monospace', borderWidth: 1, borderColor: '#86efac',
                  minHeight: 160, textAlignVertical: 'top', color: '#111' }}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setDiffLines(computeDiff(origText, modText))}
            style={{ backgroundColor: '#4f46e5', borderRadius: 10, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Compare</Text>
          </TouchableOpacity>

          {diffLines && (
            <View style={{ gap: 8 }}>
              {/* Stats */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { label: `+${added} added`, bg: '#dcfce7', color: '#15803d' },
                  { label: `-${removed} removed`, bg: '#fee2e2', color: '#b91c1c' },
                  { label: `${unchanged} unchanged`, bg: '#f3f4f6', color: '#6b7280' },
                ].map((item) => (
                  <View key={item.label} style={{ flex: 1, backgroundColor: item.bg,
                    borderRadius: 8, padding: 8, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '700', fontSize: 12, color: item.color }}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* Diff output */}
              <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
                borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 6 }}>
                {diffLines.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>Files are identical</Text>
                ) : renderDiffLines(diffLines)}
              </View>
            </View>
          )}
        </View>
      );
    }

    // ── Word Count ──
    if (active === 'count') {
      return (
        <View style={{ gap: 10 }}>
          {[
            ['Words', s.words], ['Characters', s.chars], ['Chars (no space)', s.charsNoSpace],
            ['Lines', s.lines], ['Sentences', s.sentences], ['Paragraphs', s.paragraphs], ['Read time (min)', s.readTime],
          ].map(([label, val]) => (
            <View key={label as string} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' }}>
              <Text style={{ color: '#6b7280', fontSize: 14 }}>{label}</Text>
              <Text style={{ fontWeight: '700', fontSize: 18, color: '#4f46e5' }}>{val}</Text>
            </View>
          ))}
        </View>
      );
    }

    // ── Other tabs ──
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

  const isSpecialTab = active === 'markdown' || active === 'diff';

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12,
        backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 }}>Text Tools</Text>
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
        {/* Standard input only shown for non-special tabs */}
        {!isSpecialTab && (
          <>
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
          </>
        )}

        {renderTool()}
      </ScrollView>
    </View>
  );
}
