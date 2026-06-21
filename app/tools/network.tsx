import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  primary: '#4f46e5',
  bg: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: '#334155',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  orange: '#f97316',
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'dns', label: 'DNS Lookup', icon: 'globe-outline' },
  { id: 'http', label: 'HTTP Test', icon: 'flash-outline' },
  { id: 'ip', label: 'IP Info', icon: 'location-outline' },
  { id: 'headers', label: 'Headers', icon: 'list-outline' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={{
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      {children}
    </Animated.View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ color: C.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'none',
  keyboardType = 'default',
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'url' | 'email-address';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.muted}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      style={{
        backgroundColor: '#0f172a',
        borderRadius: 10,
        padding: 13,
        fontSize: 14,
        color: C.text,
        borderWidth: 1,
        borderColor: C.border,
        fontFamily: 'monospace',
        marginBottom: 10,
      }}
    />
  );
}

function PrimaryButton({
  label,
  onPress,
  loading,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading: boolean;
  icon?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={{
        backgroundColor: loading ? '#3730a3' : C.primary,
        borderRadius: 12,
        paddingVertical: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        icon && <Ionicons name={icon as any} size={16} color="#fff" />
      )}
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{loading ? 'Loading…' : label}</Text>
    </TouchableOpacity>
  );
}

function KVRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const copy = async () => {
    await Clipboard.setStringAsync(value);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', value);
  };
  return (
    <TouchableOpacity
      onPress={copy}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        gap: 10,
      }}
    >
      <Text
        style={{
          color: highlight ? C.primary : C.muted,
          fontSize: 12,
          fontWeight: '600',
          width: 130,
          flexShrink: 0,
          paddingTop: 1,
        }}
      >
        {label}
      </Text>
      <Text style={{ flex: 1, color: C.text, fontSize: 13, fontFamily: 'monospace' }}>{value}</Text>
      <Ionicons name="copy-outline" size={14} color={C.muted} style={{ marginTop: 1 }} />
    </TouchableOpacity>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <Animated.View
      entering={FadeInDown.springify()}
      style={{
        backgroundColor: '#450a0a',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#7f1d1d',
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <Ionicons name="alert-circle" size={18} color={C.red} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, color: '#fca5a5', fontSize: 13 }}>{message}</Text>
    </Animated.View>
  );
}

// ─── DNS Lookup ───────────────────────────────────────────────────────────────

interface DNSRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DNSResult {
  type: string;
  records: DNSRecord[];
  error?: string;
}

function DNSTab() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DNSResult[]>([]);
  const [error, setError] = useState('');

  const lookup = async () => {
    const d = domain.trim().replace(/^https?:\/\//, '').split('/')[0];
    if (!d) {
      setError('Please enter a domain name.');
      return;
    }
    setError('');
    setResults([]);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const types = ['A', 'MX', 'AAAA'];
    const fetched: DNSResult[] = [];

    await Promise.all(
      types.map(async (type) => {
        try {
          const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(d)}&type=${type}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          fetched.push({ type, records: json.Answer ?? [] });
        } catch (e: any) {
          fetched.push({ type, records: [], error: e.message });
        }
      })
    );

    // preserve A, MX, AAAA order
    setResults(types.map((t) => fetched.find((f) => f.type === t)!));
    setLoading(false);
  };

  const typeColor: Record<string, string> = { A: '#22c55e', MX: '#a78bfa', AAAA: '#38bdf8' };
  const typeDesc: Record<string, string> = { A: 'IPv4 Address', MX: 'Mail Exchange', AAAA: 'IPv6 Address' };

  return (
    <View style={{ gap: 4 }}>
      <SectionCard delay={0}>
        <Label>Domain Name</Label>
        <StyledInput
          value={domain}
          onChangeText={setDomain}
          placeholder="google.com"
          keyboardType="url"
        />
        <PrimaryButton label="Lookup DNS" onPress={lookup} loading={loading} icon="search" />
        {error ? <ErrorBox message={error} /> : null}
      </SectionCard>

      {results.map((res, i) => (
        <SectionCard key={res.type} delay={i * 80}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
            <View
              style={{
                backgroundColor: typeColor[res.type] + '22',
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: typeColor[res.type] + '55',
              }}
            >
              <Text style={{ color: typeColor[res.type], fontWeight: '700', fontSize: 13 }}>{res.type}</Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 12 }}>{typeDesc[res.type]}</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: C.muted, fontSize: 12 }}>{res.records.length} record{res.records.length !== 1 ? 's' : ''}</Text>
          </View>

          {res.error ? (
            <Text style={{ color: C.red, fontSize: 13 }}>Error: {res.error}</Text>
          ) : res.records.length === 0 ? (
            <Text style={{ color: C.muted, fontSize: 13 }}>No records found</Text>
          ) : (
            res.records.map((rec, j) => (
              <View
                key={j}
                style={{
                  backgroundColor: '#0f172a',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 6,
                  borderLeftWidth: 3,
                  borderLeftColor: typeColor[res.type],
                }}
              >
                <Text style={{ color: C.text, fontSize: 13, fontFamily: 'monospace' }}>{rec.data}</Text>
                <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>TTL: {rec.TTL}s</Text>
              </View>
            ))
          )}
        </SectionCard>
      ))}
    </View>
  );
}

// ─── HTTP Test ────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'HEAD';

function HTTPTab() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: number;
    statusText: string;
    time: number;
    contentType: string;
    contentLength: string;
    body: string;
  } | null>(null);
  const [error, setError] = useState('');

  const statusColor = (code: number) => {
    if (code >= 200 && code < 300) return C.green;
    if (code >= 300 && code < 400) return C.yellow;
    return C.red;
  };

  const run = async () => {
    const u = url.trim();
    if (!u) { setError('Please enter a URL.'); return; }
    const target = u.startsWith('http') ? u : `https://${u}`;
    setError('');
    setResult(null);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const start = Date.now();
    try {
      const res = await fetch(target, {
        method,
        headers: { 'User-Agent': 'TaskNexus-NetworkTool/1.0' },
      });
      const elapsed = Date.now() - start;
      const contentType = res.headers.get('content-type') ?? 'unknown';
      const contentLength = res.headers.get('content-length') ?? 'unknown';
      let body = '';
      if (method !== 'HEAD') {
        const raw = await res.text();
        body = raw.slice(0, 500);
        if (raw.length > 500) body += `\n… (${raw.length - 500} more chars)`;
      }
      setResult({
        status: res.status,
        statusText: res.statusText || statusTextFor(res.status),
        time: elapsed,
        contentType,
        contentLength,
        body,
      });
    } catch (e: any) {
      setError(e.message ?? 'Request failed');
    }
    setLoading(false);
  };

  const METHODS: HttpMethod[] = ['GET', 'POST', 'HEAD'];
  const methodColor: Record<HttpMethod, string> = { GET: C.green, POST: C.primary, HEAD: C.yellow };

  return (
    <View style={{ gap: 4 }}>
      <SectionCard delay={0}>
        <Label>URL</Label>
        <StyledInput value={url} onChangeText={setUrl} placeholder="https://example.com/api" keyboardType="url" />

        <Label>Method</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMethod(m)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: method === m ? methodColor[m] + '33' : '#0f172a',
                borderWidth: 1.5,
                borderColor: method === m ? methodColor[m] : C.border,
              }}
            >
              <Text style={{ color: method === m ? methodColor[m] : C.muted, fontWeight: '700', fontSize: 13 }}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <PrimaryButton label="Send Request" onPress={run} loading={loading} icon="send" />
        {error ? <ErrorBox message={error} /> : null}
      </SectionCard>

      {result && (
        <>
          <SectionCard delay={80}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: statusColor(result.status) + '22',
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: statusColor(result.status) + '55',
                }}
              >
                <Text style={{ color: statusColor(result.status), fontSize: 26, fontWeight: '800' }}>
                  {result.status}
                </Text>
                <Text style={{ color: statusColor(result.status), fontSize: 11, fontWeight: '600', marginTop: 1 }}>
                  {result.statusText}
                </Text>
              </View>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="timer-outline" size={14} color={C.muted} />
                  <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{result.time} ms</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="document-outline" size={14} color={C.muted} />
                  <Text style={{ color: C.muted, fontSize: 12 }}>{result.contentLength} bytes</Text>
                </View>
              </View>
            </View>
            <KVRow label="Content-Type" value={result.contentType} />
            <KVRow label="Content-Length" value={result.contentLength} />
          </SectionCard>

          {method !== 'HEAD' && result.body && (
            <SectionCard delay={160}>
              <Label>Response Preview (first 500 chars)</Label>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ backgroundColor: '#0f172a', borderRadius: 8, padding: 10 }}
              >
                <Text selectable style={{ color: '#7dd3fc', fontFamily: 'monospace', fontSize: 12, lineHeight: 18 }}>
                  {result.body}
                </Text>
              </ScrollView>
            </SectionCard>
          )}
        </>
      )}
    </View>
  );
}

function statusTextFor(code: number): string {
  const map: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed', 429: 'Too Many Requests',
    500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
  };
  return map[code] ?? '';
}

// ─── IP Info ──────────────────────────────────────────────────────────────────

interface IPData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  org: string;
  timezone: string;
  latitude: number;
  longitude: number;
  error?: boolean;
  reason?: string;
}

function IPInfoTab() {
  const [myIp, setMyIp] = useState('');
  const [manualIp, setManualIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [data, setData] = useState<IPData | null>(null);
  const [error, setError] = useState('');

  const fetchIPData = async (ip: string, setLoad: (v: boolean) => void) => {
    setError('');
    setData(null);
    setLoad(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: IPData = await res.json();
      if (json.error) throw new Error(json.reason ?? 'IP lookup failed');
      setData(json);
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch IP info');
    }
    setLoad(false);
  };

  const getMyIp = async () => {
    setError('');
    setData(null);
    setMyIp('');
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const ip: string = json.ip;
      setMyIp(ip);
      await fetchIPData(ip, () => {});
    } catch (e: any) {
      setError(e.message ?? 'Failed to get your IP');
    }
    setLoading(false);
  };

  const fields: [string, string][] = data
    ? [
        ['IP Address', data.ip],
        ['City', data.city ?? 'N/A'],
        ['Region', data.region ?? 'N/A'],
        ['Country', data.country_name ?? 'N/A'],
        ['ISP / Org', data.org ?? 'N/A'],
        ['Timezone', data.timezone ?? 'N/A'],
        ['Coordinates', `${data.latitude}, ${data.longitude}`],
      ]
    : [];

  return (
    <View style={{ gap: 4 }}>
      <SectionCard delay={0}>
        <PrimaryButton label="Get My IP" onPress={getMyIp} loading={loading} icon="locate" />
        {myIp ? (
          <View
            style={{
              marginTop: 12,
              backgroundColor: '#0f172a',
              borderRadius: 10,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Ionicons name="wifi" size={18} color={C.primary} />
            <Text style={{ color: C.text, fontSize: 16, fontFamily: 'monospace', fontWeight: '700' }}>{myIp}</Text>
          </View>
        ) : null}
        {error ? <ErrorBox message={error} /> : null}
      </SectionCard>

      <SectionCard delay={80}>
        <Label>Lookup Any IP</Label>
        <StyledInput
          value={manualIp}
          onChangeText={setManualIp}
          placeholder="8.8.8.8"
          keyboardType="default"
        />
        <PrimaryButton
          label="Lookup IP"
          onPress={() => fetchIPData(manualIp.trim(), setLookupLoading)}
          loading={lookupLoading}
          icon="search"
        />
      </SectionCard>

      {data && (
        <SectionCard delay={160}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="location" size={18} color={C.primary} />
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>IP Details</Text>
          </View>
          {fields.map(([k, v], i) => (
            <KVRow key={k} label={k} value={v} highlight={i === 0} />
          ))}
        </SectionCard>
      )}
    </View>
  );
}

// ─── Headers ──────────────────────────────────────────────────────────────────

const HIGHLIGHTED_HEADERS = [
  'content-type',
  'server',
  'cache-control',
  'x-frame-options',
  'access-control-allow-origin',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'strict-transport-security',
  'x-content-type-options',
  'x-xss-protection',
];

function HeadersTab() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<[string, string][]>([]);
  const [error, setError] = useState('');

  const fetchHeaders = async () => {
    const u = url.trim();
    if (!u) { setError('Please enter a URL.'); return; }
    const target = u.startsWith('http') ? u : `https://${u}`;
    setError('');
    setHeaders([]);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await fetch(target, {
        method: 'HEAD',
        headers: { 'User-Agent': 'TaskNexus-NetworkTool/1.0' },
      });
      const collected: [string, string][] = [];
      res.headers.forEach((value, key) => {
        collected.push([key, value]);
      });
      // Sort: highlighted first, then alphabetical
      collected.sort(([a], [b]) => {
        const ai = HIGHLIGHTED_HEADERS.indexOf(a.toLowerCase());
        const bi = HIGHLIGHTED_HEADERS.indexOf(b.toLowerCase());
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
      });
      if (collected.length === 0) {
        setError(`Server responded with ${res.status} but returned no headers we could read.`);
      }
      setHeaders(collected);
    } catch (e: any) {
      setError(e.message ?? 'Request failed');
    }
    setLoading(false);
  };

  const isHighlighted = (key: string) => HIGHLIGHTED_HEADERS.includes(key.toLowerCase());

  return (
    <View style={{ gap: 4 }}>
      <SectionCard delay={0}>
        <Label>URL</Label>
        <StyledInput value={url} onChangeText={setUrl} placeholder="https://example.com" keyboardType="url" />
        <PrimaryButton label="Fetch Headers" onPress={fetchHeaders} loading={loading} icon="list" />
        {error ? <ErrorBox message={error} /> : null}
      </SectionCard>

      {headers.length > 0 && (
        <SectionCard delay={80}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
            <Ionicons name="list" size={16} color={C.primary} />
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>
              {headers.length} Response Headers
            </Text>
          </View>
          {headers.map(([key, value], i) => {
            const highlighted = isHighlighted(key);
            return (
              <TouchableOpacity
                key={i}
                onPress={async () => {
                  await Clipboard.setStringAsync(`${key}: ${value}`);
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Copied', `${key}: ${value}`);
                }}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 10,
                  marginBottom: 6,
                  borderRadius: 8,
                  backgroundColor: highlighted ? C.primary + '18' : '#0f172a',
                  borderWidth: 1,
                  borderColor: highlighted ? C.primary + '44' : C.border,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                {highlighted && (
                  <View style={{ marginTop: 3 }}>
                    <Ionicons name="star" size={10} color={C.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: highlighted ? '#a5b4fc' : C.muted, fontSize: 11, fontWeight: '700', marginBottom: 2, fontFamily: 'monospace' }}>
                    {key}
                  </Text>
                  <Text style={{ color: C.text, fontSize: 13, fontFamily: 'monospace', lineHeight: 18 }}>{value}</Text>
                </View>
                <Ionicons name="copy-outline" size={13} color={C.muted} style={{ marginTop: 3 }} />
              </TouchableOpacity>
            );
          })}
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 6, textAlign: 'center' }}>
            Starred headers are security/CORS-relevant. Tap any row to copy.
          </Text>
        </SectionCard>
      )}
    </View>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

export default function NetworkToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('dns');

  const handleTabPress = async (id: TabId) => {
    if (id === tab) return;
    await Haptics.selectionAsync();
    setTab(id);
  };

  const renderContent = () => {
    switch (tab) {
      case 'dns': return <DNSTab />;
      case 'http': return <HTTPTab />;
      case 'ip': return <IPInfoTab />;
      case 'headers': return <HeadersTab />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(0).springify()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 }}>Network Tools</Text>
          <Text style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>DNS, HTTP, IP & Headers</Text>
        </View>
        <Ionicons name="wifi" size={22} color={C.primary} />
      </Animated.View>

      {/* Tab bar */}
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => handleTabPress(t.id)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 22,
                  backgroundColor: active ? C.primary : C.surface,
                  borderWidth: 1,
                  borderColor: active ? C.primary : C.border,
                }}
              >
                <Ionicons name={t.icon as any} size={14} color={active ? '#fff' : C.muted} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : C.muted }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}
