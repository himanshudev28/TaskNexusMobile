import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

// ─── Color Tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#263045',
  border: '#334155',
  primary: '#4f46e5',
  primaryLight: '#6366f1',
  text: '#f1f5f9',
  muted: '#94a3b8',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  codeBg: '#0d1117',
  codeText: '#e6edf3',
  headerRow: '#1e293b',
  evenRow: '#131c2e',
  oddRow: '#0f172a',
};

const TABS = [
  { id: 'json', label: 'JSON', icon: 'code-slash' },
  { id: 'csv', label: 'CSV', icon: 'grid' },
  { id: 'xml', label: 'XML', icon: 'document-text' },
  { id: 'regex', label: 'Regex', icon: 'search' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Shared Components ─────────────────────────────────────────────────────────
function ActionBtn({
  label,
  icon,
  onPress,
  color = C.primary,
  flex,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
  flex?: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: flex ?? 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: color,
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 10,
      }}
      activeOpacity={0.8}
    >
      <Ionicons name={icon as any} size={15} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <View
      style={{
        backgroundColor: C.surfaceAlt,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: 'center',
        flex: 1,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <Text style={{ color: C.primary, fontSize: 18, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function CodeBlock({ content, maxHeight = 220 }: { content: string; maxHeight?: number }) {
  return (
    <ScrollView
      horizontal
      style={{
        backgroundColor: C.codeBg,
        borderRadius: 10,
        maxHeight,
        borderWidth: 1,
        borderColor: C.border,
      }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <ScrollView nestedScrollEnabled>
        <Text
          selectable
          style={{
            color: C.codeText,
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: 20,
            padding: 12,
          }}
        >
          {content}
        </Text>
      </ScrollView>
    </ScrollView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 }}>
      {text.toUpperCase()}
    </Text>
  );
}

// ─── JSON TAB ─────────────────────────────────────────────────────────────────
function JsonTab() {
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [keyCount, setKeyCount] = useState<number | null>(null);

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const validate = () => {
    haptic();
    if (!raw.trim()) { Alert.alert('Empty', 'Paste some JSON first.'); return; }
    try {
      const parsed = JSON.parse(raw);
      const keys =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? Object.keys(parsed).length
          : null;
      setKeyCount(keys);
      setStatus({ ok: true, msg: 'Valid JSON' });
    } catch (e: any) {
      setKeyCount(null);
      // Try to extract line number from error message
      const lineMatch = e.message?.match(/line (\d+)/i);
      const lineInfo = lineMatch ? ` at line ${lineMatch[1]}` : '';
      setStatus({ ok: false, msg: `${e.message}${lineInfo}` });
    }
  };

  const beautify = () => {
    haptic();
    try {
      const parsed = JSON.parse(raw);
      const pretty = JSON.stringify(parsed, null, 2);
      setRaw(pretty);
      setStatus({ ok: true, msg: 'Valid JSON' });
      const keys =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? Object.keys(parsed).length
          : null;
      setKeyCount(keys);
    } catch (e: any) {
      setStatus({ ok: false, msg: e.message });
    }
  };

  const minify = () => {
    haptic();
    try {
      const parsed = JSON.parse(raw);
      setRaw(JSON.stringify(parsed));
      setStatus({ ok: true, msg: 'Minified' });
    } catch (e: any) {
      setStatus({ ok: false, msg: e.message });
    }
  };

  const copyFormatted = async () => {
    haptic();
    try {
      const pretty = JSON.stringify(JSON.parse(raw), null, 2);
      await Clipboard.setStringAsync(pretty);
      Alert.alert('Copied', 'Formatted JSON copied to clipboard.');
    } catch {
      Alert.alert('Error', 'Invalid JSON — cannot copy formatted.');
    }
  };

  const clear = () => { setRaw(''); setStatus(null); setKeyCount(null); haptic(); };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 14 }}>
      <SectionLabel text="Input JSON" />
      <TextInput
        value={raw}
        onChangeText={setRaw}
        multiline
        placeholder={'{\n  "key": "value"\n}'}
        placeholderTextColor={C.muted}
        style={{
          backgroundColor: C.codeBg,
          color: C.codeText,
          borderRadius: 10,
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 20,
          minHeight: 150,
          borderWidth: 1,
          borderColor: C.border,
          textAlignVertical: 'top',
        }}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
      />

      {/* Stat row */}
      {keyCount !== null && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatBadge label="Root Keys" value={keyCount} />
        </View>
      )}

      {/* Status */}
      {status && (
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: status.ok ? '#14532d40' : '#7f1d1d40',
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: status.ok ? C.success : C.error,
          }}
        >
          <Ionicons
            name={status.ok ? 'checkmark-circle' : 'close-circle'}
            size={18}
            color={status.ok ? C.success : C.error}
          />
          <Text style={{ color: status.ok ? C.success : C.error, fontSize: 13, flex: 1 }}>
            {status.ok ? `Valid JSON` : `Error: ${status.msg}`}
          </Text>
        </Animated.View>
      )}

      {/* Actions row 1 */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionBtn label="Validate" icon="checkmark-circle-outline" onPress={validate} color={C.primary} />
        <ActionBtn label="Beautify" icon="sparkles" onPress={beautify} color="#0891b2" />
      </View>

      {/* Actions row 2 */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionBtn label="Minify" icon="compress" onPress={minify} color="#7c3aed" />
        <ActionBtn label="Copy Formatted" icon="copy-outline" onPress={copyFormatted} color="#059669" />
        <ActionBtn label="Clear" icon="trash-outline" onPress={clear} color="#dc2626" />
      </View>
    </Animated.View>
  );
}

// ─── CSV TAB ──────────────────────────────────────────────────────────────────
type CsvParsed = { headers: string[]; rows: string[][] };

function parseCsv(text: string): CsvParsed {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const splitLine = (line: string) =>
    line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

function CsvTab() {
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState<CsvParsed | null>(null);
  const [jsonOut, setJsonOut] = useState('');

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const parse = () => {
    haptic();
    if (!raw.trim()) { Alert.alert('Empty', 'Paste some CSV first.'); return; }
    const result = parseCsv(raw);
    if (!result.headers.length) { Alert.alert('Error', 'Could not parse CSV.'); return; }
    setParsed(result);
    setJsonOut('');
  };

  const toJson = () => {
    haptic();
    if (!parsed) { Alert.alert('Parse first', 'Click Parse before converting.'); return; }
    const arr = parsed.rows.map((row) => {
      const obj: Record<string, string> = {};
      parsed.headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
      return obj;
    });
    setJsonOut(JSON.stringify(arr, null, 2));
  };

  const copyJson = async () => {
    if (!jsonOut) return;
    await Clipboard.setStringAsync(jsonOut);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'JSON output copied.');
  };

  const clear = () => { setRaw(''); setParsed(null); setJsonOut(''); haptic(); };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 14 }}>
      <SectionLabel text="Input CSV" />
      <TextInput
        value={raw}
        onChangeText={setRaw}
        multiline
        placeholder={'name,age,city\nAlice,30,NYC\nBob,25,LA'}
        placeholderTextColor={C.muted}
        style={{
          backgroundColor: C.codeBg,
          color: C.codeText,
          borderRadius: 10,
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 20,
          minHeight: 130,
          borderWidth: 1,
          borderColor: C.border,
          textAlignVertical: 'top',
        }}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionBtn label="Parse" icon="play" onPress={parse} color={C.primary} />
        <ActionBtn label="To JSON" icon="code-slash" onPress={toJson} color="#0891b2" />
        <ActionBtn label="Clear" icon="trash-outline" onPress={clear} color="#dc2626" />
      </View>

      {parsed && (
        <Animated.View entering={FadeInDown.duration(250)} style={{ gap: 12 }}>
          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatBadge label="Rows" value={parsed.rows.length} />
            <StatBadge label="Columns" value={parsed.headers.length} />
          </View>

          <SectionLabel text="Table Preview" />
          <ScrollView horizontal style={{ borderRadius: 10, borderWidth: 1, borderColor: C.border }}>
            <View>
              {/* Header row */}
              <View style={{ flexDirection: 'row', backgroundColor: C.headerRow }}>
                {parsed.headers.map((h, i) => (
                  <View
                    key={i}
                    style={{
                      minWidth: 90,
                      padding: 10,
                      borderRightWidth: i < parsed.headers.length - 1 ? 1 : 0,
                      borderRightColor: C.border,
                    }}
                  >
                    <Text style={{ color: C.primary, fontWeight: '700', fontSize: 12 }}>{h}</Text>
                  </View>
                ))}
              </View>
              {/* Data rows */}
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {parsed.rows.map((row, ri) => (
                  <View
                    key={ri}
                    style={{
                      flexDirection: 'row',
                      backgroundColor: ri % 2 === 0 ? C.evenRow : C.oddRow,
                      borderTopWidth: 1,
                      borderTopColor: C.border,
                    }}
                  >
                    {parsed.headers.map((_, ci) => (
                      <View
                        key={ci}
                        style={{
                          minWidth: 90,
                          padding: 10,
                          borderRightWidth: ci < parsed.headers.length - 1 ? 1 : 0,
                          borderRightColor: C.border,
                        }}
                      >
                        <Text style={{ color: C.text, fontSize: 12 }}>{row[ci] ?? ''}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {!!jsonOut && (
        <Animated.View entering={FadeInDown.duration(250)} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionLabel text="JSON Output" />
            <TouchableOpacity onPress={copyJson} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="copy-outline" size={14} color={C.primary} />
              <Text style={{ color: C.primary, fontSize: 12, fontWeight: '600' }}>Copy</Text>
            </TouchableOpacity>
          </View>
          <CodeBlock content={jsonOut} maxHeight={180} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── XML TAB ──────────────────────────────────────────────────────────────────
function validateXml(xml: string): { ok: boolean; msg: string; tagCount: number } {
  const trimmed = xml.trim();
  if (!trimmed) return { ok: false, msg: 'Empty input', tagCount: 0 };

  // Count all tags
  const allOpenTags = (trimmed.match(/<[^/?!][^>]*>/g) || ([] as string[])).filter(
    (t) => !t.endsWith('/>'),
  );
  const allCloseTags = trimmed.match(/<\/[^>]+>/g) || [];
  const selfClosing = (trimmed.match(/<[^/?!][^>]*\/>/g) || []).length;
  const tagCount = allOpenTags.length + allCloseTags.length + selfClosing;

  // Build a simple tag stack
  const stack: string[] = [];
  const tokenRe = /<\/?([a-zA-Z_][\w.-]*)(?:\s[^>]*)?\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(trimmed)) !== null) {
    const full = match[0];
    const name = match[1];
    if (full.startsWith('</')) {
      if (!stack.length || stack[stack.length - 1] !== name) {
        return {
          ok: false,
          msg: `Unexpected closing tag </${name}>`,
          tagCount,
        };
      }
      stack.pop();
    } else if (!full.endsWith('/>')) {
      stack.push(name);
    }
  }

  if (stack.length > 0) {
    return { ok: false, msg: `Unclosed tag <${stack[stack.length - 1]}>`, tagCount };
  }
  return { ok: true, msg: 'Valid XML structure', tagCount };
}

function formatXml(xml: string): string {
  let formatted = '';
  let indent = 0;
  const pad = (n: number) => '  '.repeat(n);

  // Tokenise by tags
  const parts = xml.replace(/>\s*</g, '><').split(/(?=<)|(?<=>)/);
  parts.forEach((part) => {
    part = part.trim();
    if (!part) return;
    if (part.startsWith('</')) {
      indent = Math.max(0, indent - 1);
      formatted += `${pad(indent)}${part}\n`;
    } else if (part.startsWith('<') && !part.startsWith('<?') && !part.endsWith('/>')) {
      formatted += `${pad(indent)}${part}\n`;
      if (!part.includes('</')) indent++;
    } else if (part.startsWith('<') && part.endsWith('/>')) {
      formatted += `${pad(indent)}${part}\n`;
    } else if (part.startsWith('<?')) {
      formatted += `${pad(indent)}${part}\n`;
    } else {
      formatted += `${pad(indent)}${part}\n`;
    }
  });
  return formatted.trim();
}

function XmlTab() {
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [tagCount, setTagCount] = useState<number | null>(null);

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const validate = () => {
    haptic();
    if (!raw.trim()) { Alert.alert('Empty', 'Paste some XML first.'); return; }
    const result = validateXml(raw);
    setStatus({ ok: result.ok, msg: result.msg });
    setTagCount(result.tagCount);
  };

  const format = () => {
    haptic();
    if (!raw.trim()) { Alert.alert('Empty', 'Paste some XML first.'); return; }
    const result = validateXml(raw);
    if (!result.ok) {
      setStatus({ ok: false, msg: result.msg });
      setTagCount(result.tagCount);
      return;
    }
    const pretty = formatXml(raw);
    setRaw(pretty);
    setStatus({ ok: true, msg: 'Formatted successfully' });
    setTagCount(result.tagCount);
  };

  const copyXml = async () => {
    haptic();
    await Clipboard.setStringAsync(raw);
    Alert.alert('Copied', 'XML content copied.');
  };

  const clear = () => { setRaw(''); setStatus(null); setTagCount(null); haptic(); };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 14 }}>
      <SectionLabel text="Input XML" />
      <TextInput
        value={raw}
        onChangeText={setRaw}
        multiline
        placeholder={'<root>\n  <item id="1">Hello</item>\n</root>'}
        placeholderTextColor={C.muted}
        style={{
          backgroundColor: C.codeBg,
          color: C.codeText,
          borderRadius: 10,
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 20,
          minHeight: 150,
          borderWidth: 1,
          borderColor: C.border,
          textAlignVertical: 'top',
        }}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
      />

      {tagCount !== null && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatBadge label="Total Tags" value={tagCount} />
        </View>
      )}

      {status && (
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: status.ok ? '#14532d40' : '#7f1d1d40',
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: status.ok ? C.success : C.error,
          }}
        >
          <Ionicons
            name={status.ok ? 'checkmark-circle' : 'close-circle'}
            size={18}
            color={status.ok ? C.success : C.error}
          />
          <Text style={{ color: status.ok ? C.success : C.error, fontSize: 13, flex: 1 }}>
            {status.msg}
          </Text>
        </Animated.View>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionBtn label="Validate" icon="checkmark-circle-outline" onPress={validate} color={C.primary} />
        <ActionBtn label="Format" icon="sparkles" onPress={format} color="#0891b2" />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionBtn label="Copy XML" icon="copy-outline" onPress={copyXml} color="#059669" />
        <ActionBtn label="Clear" icon="trash-outline" onPress={clear} color="#dc2626" />
      </View>
    </Animated.View>
  );
}

// ─── REGEX TAB ────────────────────────────────────────────────────────────────
const REGEX_PRESETS = [
  {
    label: 'Email',
    pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
    flags: 'gi',
  },
  {
    label: 'URL',
    pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)',
    flags: 'gi',
  },
  {
    label: 'Phone',
    pattern: '[\\+]?[(]?[0-9]{1,4}[)]?[-\\s\\.]?[(]?[0-9]{1,3}[)]?[-\\s\\.]?[0-9]{3,4}[-\\s\\.]?[0-9]{3,4}',
    flags: 'g',
  },
  {
    label: 'Date (YYYY-MM-DD)',
    pattern: '\\d{4}[-\\/](0[1-9]|1[0-2])[-\\/](0[1-9]|[12]\\d|3[01])',
    flags: 'g',
  },
  {
    label: 'IPv4',
    pattern:
      '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
    flags: 'g',
  },
  {
    label: 'Strong Password',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    flags: '',
  },
];

type RegexFlag = 'g' | 'i' | 'm' | 's';

function RegexTab() {
  const [pattern, setPattern] = useState('');
  const [testStr, setTestStr] = useState('');
  const [flags, setFlags] = useState<Record<RegexFlag, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
  });
  const [matches, setMatches] = useState<{ full: string; groups: Record<string, string> | null; index: number }[]>([]);
  const [error, setError] = useState('');
  const [tested, setTested] = useState(false);

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const activeFlags = (Object.keys(flags) as RegexFlag[]).filter((f) => flags[f]).join('');

  const runTest = () => {
    haptic();
    setError('');
    setMatches([]);
    setTested(true);
    if (!pattern) { setError('Enter a pattern first.'); return; }
    if (!testStr) { setError('Enter a test string.'); return; }
    try {
      const re = new RegExp(pattern, activeFlags);
      const results: { full: string; groups: Record<string, string> | null; index: number }[] = [];

      if (flags.g) {
        let m: RegExpExecArray | null;
        let safety = 0;
        while ((m = re.exec(testStr)) !== null && safety < 500) {
          results.push({ full: m[0], groups: m.groups ?? null, index: m.index });
          if (!flags.g) break;
          safety++;
          // Prevent infinite loop on zero-length matches
          if (m[0].length === 0) re.lastIndex++;
        }
      } else {
        const m = re.exec(testStr);
        if (m) results.push({ full: m[0], groups: m.groups ?? null, index: m.index });
      }

      setMatches(results);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const applyPreset = (preset: (typeof REGEX_PRESETS)[0]) => {
    haptic();
    setPattern(preset.pattern);
    const newFlags: Record<RegexFlag, boolean> = { g: false, i: false, m: false, s: false };
    preset.flags.split('').forEach((f) => {
      if (f in newFlags) newFlags[f as RegexFlag] = true;
    });
    setFlags(newFlags);
    setMatches([]);
    setError('');
    setTested(false);
  };

  const copyPattern = async () => {
    haptic();
    if (!pattern) { Alert.alert('Empty', 'Enter a pattern first.'); return; }
    const full = `/${pattern}/${activeFlags}`;
    await Clipboard.setStringAsync(full);
    Alert.alert('Copied', full);
  };

  const toggleFlag = (f: RegexFlag) => {
    haptic();
    setFlags((prev) => ({ ...prev, [f]: !prev[f] }));
    setTested(false);
  };

  const clear = () => {
    setPattern('');
    setTestStr('');
    setFlags({ g: true, i: false, m: false, s: false });
    setMatches([]);
    setError('');
    setTested(false);
    haptic();
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 14 }}>
      {/* Pattern input */}
      <SectionLabel text="Pattern" />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.codeBg,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 12,
          gap: 4,
        }}
      >
        <Text style={{ color: C.muted, fontSize: 16, fontFamily: 'monospace' }}>/</Text>
        <TextInput
          value={pattern}
          onChangeText={(t) => { setPattern(t); setTested(false); }}
          placeholder="[a-z]+"
          placeholderTextColor={C.muted}
          style={{
            flex: 1,
            color: C.codeText,
            fontFamily: 'monospace',
            fontSize: 14,
            paddingVertical: 12,
          }}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
        />
        <Text style={{ color: C.muted, fontSize: 16, fontFamily: 'monospace' }}>/{activeFlags}</Text>
      </View>

      {/* Flags */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600', marginRight: 4 }}>FLAGS:</Text>
        {(['g', 'i', 'm', 's'] as RegexFlag[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => toggleFlag(f)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: flags[f] ? `${C.primary}30` : C.surfaceAlt,
              borderRadius: 7,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: flags[f] ? C.primary : C.border,
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: flags[f] ? C.primary : C.muted,
                fontFamily: 'monospace',
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Test string */}
      <SectionLabel text="Test String" />
      <TextInput
        value={testStr}
        onChangeText={(t) => { setTestStr(t); setTested(false); }}
        multiline
        placeholder="Enter text to test against the pattern..."
        placeholderTextColor={C.muted}
        style={{
          backgroundColor: C.codeBg,
          color: C.codeText,
          borderRadius: 10,
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 20,
          minHeight: 100,
          borderWidth: 1,
          borderColor: C.border,
          textAlignVertical: 'top',
        }}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
      />

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ActionBtn label="Test" icon="play" onPress={runTest} color={C.primary} />
        <ActionBtn label="Copy Pattern" icon="copy-outline" onPress={copyPattern} color="#059669" />
        <ActionBtn label="Clear" icon="trash-outline" onPress={clear} color="#dc2626" />
      </View>

      {/* Error */}
      {!!error && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#7f1d1d40',
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: C.error,
          }}
        >
          <Ionicons name="close-circle" size={16} color={C.error} />
          <Text style={{ color: C.error, fontSize: 13, flex: 1 }}>{error}</Text>
        </Animated.View>
      )}

      {/* Match results */}
      {tested && !error && (
        <Animated.View entering={FadeInDown.duration(250)} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatBadge label="Matches" value={matches.length} />
          </View>

          {matches.length > 0 && (
            <View style={{ gap: 8 }}>
              <SectionLabel text={`Matches (${matches.length})`} />
              {matches.map((m, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: C.codeBg,
                    borderRadius: 8,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: C.border,
                    gap: 4,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        backgroundColor: `${C.primary}30`,
                        borderRadius: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ color: C.primary, fontSize: 10, fontWeight: '700' }}>#{i + 1}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 11 }}>at index {m.index}</Text>
                  </View>
                  <Text
                    selectable
                    style={{
                      color: C.success,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      backgroundColor: '#14532d20',
                      borderRadius: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 3,
                    }}
                  >
                    {m.full || '(empty match)'}
                  </Text>
                  {m.groups && Object.keys(m.groups).length > 0 && (
                    <View style={{ marginTop: 4, gap: 3 }}>
                      <Text style={{ color: C.muted, fontSize: 11, fontWeight: '600' }}>Named Groups:</Text>
                      {Object.entries(m.groups).map(([k, v]) => (
                        <Text key={k} style={{ color: C.codeText, fontFamily: 'monospace', fontSize: 12 }}>
                          <Text style={{ color: C.warning }}>{k}</Text>: {v}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {matches.length === 0 && (
            <View
              style={{
                backgroundColor: '#78350f20',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: C.warning,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="alert-circle-outline" size={16} color={C.warning} />
              <Text style={{ color: C.warning, fontSize: 13 }}>No matches found.</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Presets */}
      <View style={{ gap: 8 }}>
        <SectionLabel text="Common Presets" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {REGEX_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.label}
              onPress={() => applyPreset(preset)}
              style={{
                backgroundColor: C.surfaceAlt,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: C.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="flash-outline" size={12} color={C.primary} />
              <Text style={{ color: C.text, fontSize: 12, fontWeight: '500' }}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DataTestingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('json');

  const handleTabChange = (id: TabId) => {
    Haptics.selectionAsync();
    setActiveTab(id);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'json': return <JsonTab />;
      case 'csv': return <CsvTab />;
      case 'xml': return <XmlTab />;
      case 'regex': return <RegexTab />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: C.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: C.border,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 20, fontWeight: '800' }}>Data Testing</Text>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>
            JSON · CSV · XML · Regex
          </Text>
        </View>
        <View
          style={{
            backgroundColor: `${C.primary}20`,
            borderRadius: 8,
            padding: 8,
            borderWidth: 1,
            borderColor: `${C.primary}40`,
          }}
        >
          <Ionicons name="flask-outline" size={18} color={C.primary} />
        </View>
      </View>

      {/* Tab bar */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: C.surface,
          marginHorizontal: 16,
          marginTop: 14,
          borderRadius: 12,
          padding: 4,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleTabChange(tab.id)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                paddingVertical: 9,
                borderRadius: 9,
                backgroundColor: isActive ? C.primary : 'transparent',
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={isActive ? '#fff' : C.muted}
              />
              <Text
                style={{
                  color: isActive ? '#fff' : C.muted,
                  fontSize: 13,
                  fontWeight: isActive ? '700' : '500',
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: insets.bottom + 30,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}
