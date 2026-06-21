import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#4f46e5';
const BG = '#f9fafb';
const SURFACE = '#fff';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const RED = '#dc2626';
const GREEN = '#16a34a';

type Tab = 'clock' | 'converter' | 'calculator' | 'countdown';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'clock', label: 'Clock', icon: 'time-outline' },
  { id: 'converter', label: 'Convert', icon: 'swap-horizontal-outline' },
  { id: 'calculator', label: 'Calc', icon: 'calculator-outline' },
  { id: 'countdown', label: 'Countdown', icon: 'hourglass-outline' },
];

const WORLD_TIMEZONES = [
  { label: 'UTC', tz: 'UTC' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'London', tz: 'Europe/London' },
  { label: 'Tokyo', tz: 'Asia/Tokyo' },
  { label: 'Dubai', tz: 'Asia/Dubai' },
];

const PRESET_EVENTS = [
  { name: "New Year's Day", month: 1, day: 1 },
  { name: 'Valentine\'s Day', month: 2, day: 14 },
  { name: 'Halloween', month: 10, day: 31 },
  { name: 'Christmas', month: 12, day: 25 },
  { name: 'Diwali', month: 10, day: 20 },   // approximate
  { name: 'Eid Al-Fitr', month: 3, day: 30 }, // approximate
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function getTimeInTz(tz: string): string {
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--:--';
  }
}

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Local';
  }
}

function toRelative(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;

  const seconds = Math.floor(abs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let str = '';
  if (years > 0) str = `${years} year${years > 1 ? 's' : ''}`;
  else if (months > 0) str = `${months} month${months > 1 ? 's' : ''}`;
  else if (weeks > 0) str = `${weeks} week${weeks > 1 ? 's' : ''}`;
  else if (days > 0) str = `${days} day${days > 1 ? 's' : ''}`;
  else if (hours > 0) str = `${hours} hour${hours > 1 ? 's' : ''}`;
  else if (minutes > 0) str = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  else str = `${seconds} second${seconds !== 1 ? 's' : ''}`;

  return future ? `in ${str}` : `${str} ago`;
}

function parseAnyDate(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Unix timestamp (seconds)
  if (/^\d{9,10}$/.test(trimmed)) {
    const d = new Date(parseInt(trimmed, 10) * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  // Unix timestamp (milliseconds)
  if (/^\d{13}$/.test(trimmed)) {
    const d = new Date(parseInt(trimmed, 10));
    return isNaN(d.getTime()) ? null : d;
  }
  // ISO or general date string
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

function diffBetweenDates(a: Date, b: Date) {
  const ms = Math.abs(b.getTime() - a.getTime());
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const totalWeeks = Math.floor(totalDays / 7);
  return { totalDays, totalHours, totalMinutes, totalWeeks };
}

function addTime(
  base: Date,
  amount: number,
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years',
): Date {
  const result = new Date(base.getTime());
  switch (unit) {
    case 'minutes':
      result.setMinutes(result.getMinutes() + amount);
      break;
    case 'hours':
      result.setHours(result.getHours() + amount);
      break;
    case 'days':
      result.setDate(result.getDate() + amount);
      break;
    case 'weeks':
      result.setDate(result.getDate() + amount * 7);
      break;
    case 'months':
      result.setMonth(result.getMonth() + amount);
      break;
    case 'years':
      result.setFullYear(result.getFullYear() + amount);
      break;
  }
  return result;
}

function getNextOccurrence(month: number, day: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  let d = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (d.getTime() <= now.getTime()) {
    d = new Date(year + 1, month - 1, day, 0, 0, 0, 0);
  }
  return d;
}

function countdownFromNow(target: Date): { days: number; hours: number; minutes: number; seconds: number; past: boolean } {
  const diff = target.getTime() - Date.now();
  if (diff < 0) {
    const abs = Math.abs(diff);
    const s = Math.floor(abs / 1000);
    return { days: Math.floor(s / 86400), hours: 0, minutes: 0, seconds: 0, past: true };
  }
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    past: false,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Clock Tab
function ClockTab() {
  const [now, setNow] = useState(new Date());
  const deviceTz = getDeviceTimezone();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Digital Clock */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={{
        backgroundColor: PRIMARY,
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <Text style={{ fontSize: 64, fontWeight: '700', color: '#fff', letterSpacing: 4, fontVariant: ['tabular-nums'] }}>
          {hh}:{mm}:{ss}
        </Text>
        <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', marginTop: 8, fontWeight: '500' }}>
          {DAY_NAMES[now.getDay()]}
        </Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
          {now.getDate()} {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
        </Text>
        <View style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>{deviceTz}</Text>
        </View>
      </Animated.View>

      {/* World Clocks */}
      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 10 }}>World Clocks</Text>
        {WORLD_TIMEZONES.map((tz, i) => (
          <View key={tz.tz} style={{
            backgroundColor: SURFACE,
            borderRadius: 12,
            padding: 14,
            marginBottom: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: BORDER,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: `${PRIMARY}15`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="globe-outline" size={18} color={PRIMARY} />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111' }}>{tz.label}</Text>
                <Text style={{ fontSize: 11, color: MUTED }}>{tz.tz}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: PRIMARY, fontVariant: ['tabular-nums'] }}>
              {getTimeInTz(tz.tz)}
            </Text>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

// Converter Tab
interface ConvertedFormats {
  unix: string;
  unixMs: string;
  iso: string;
  human: string;
  relative: string;
  utc: string;
}

function ConverterTab() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<Date | null>(null);
  const [formats, setFormats] = useState<ConvertedFormats | null>(null);
  const [error, setError] = useState('');

  const convert = useCallback((value: string) => {
    setInput(value);
    if (!value.trim()) {
      setParsed(null);
      setFormats(null);
      setError('');
      return;
    }
    const d = parseAnyDate(value);
    if (!d) {
      setParsed(null);
      setFormats(null);
      setError('Could not parse date. Try a Unix timestamp, ISO 8601, or a readable date.');
      return;
    }
    setError('');
    setParsed(d);
    setFormats({
      unix: Math.floor(d.getTime() / 1000).toString(),
      unixMs: d.getTime().toString(),
      iso: d.toISOString(),
      human: d.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relative: toRelative(d),
      utc: d.toUTCString(),
    });
  }, []);

  const useNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ts = Math.floor(Date.now() / 1000).toString();
    convert(ts);
  };

  const formatRows: { label: string; key: keyof ConvertedFormats; color?: string }[] = [
    { label: 'Unix (seconds)', key: 'unix' },
    { label: 'Unix (milliseconds)', key: 'unixMs' },
    { label: 'ISO 8601', key: 'iso' },
    { label: 'UTC String', key: 'utc' },
    { label: 'Human Readable', key: 'human' },
    { label: 'Relative', key: 'relative', color: PRIMARY },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Animated.View entering={FadeInDown.delay(50).springify()}>
        {/* Input */}
        <View style={{
          backgroundColor: SURFACE, borderRadius: 14, padding: 16,
          borderWidth: 1, borderColor: BORDER, marginBottom: 12,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: MUTED, marginBottom: 8 }}>
            Enter any date format
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={input}
              onChangeText={convert}
              placeholder="e.g. 1718000000, 2024-06-10, Jun 10 2024..."
              placeholderTextColor={MUTED}
              style={{
                flex: 1, fontSize: 14, color: '#111',
                borderWidth: 1, borderColor: BORDER, borderRadius: 10,
                paddingHorizontal: 12, paddingVertical: 10,
                backgroundColor: BG,
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={useNow}
              style={{
                backgroundColor: PRIMARY, borderRadius: 10,
                paddingHorizontal: 14, paddingVertical: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Now</Text>
            </TouchableOpacity>
          </View>
          {!!error && (
            <Text style={{ color: RED, fontSize: 12, marginTop: 8 }}>{error}</Text>
          )}
        </View>

        {/* Results */}
        {formats && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 4 }}>Converted Formats</Text>
            {formatRows.map((row) => (
              <View key={row.key} style={{
                backgroundColor: SURFACE, borderRadius: 12,
                padding: 14, borderWidth: 1, borderColor: BORDER,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: MUTED, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {row.label}
                </Text>
                <Text style={{ fontSize: 14, color: row.color ?? '#111', fontWeight: '500' }} selectable>
                  {formats[row.key]}
                </Text>
              </View>
            ))}
          </View>
        )}

        {!formats && !error && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="swap-horizontal-outline" size={48} color={BORDER} />
            <Text style={{ color: MUTED, fontSize: 14, marginTop: 12 }}>Enter a date above to see all formats</Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

// Calculator Tab
type CalcUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

const UNITS: CalcUnit[] = ['minutes', 'hours', 'days', 'weeks', 'months', 'years'];

function CalculatorTab() {
  // Add/Subtract
  const [baseDate, setBaseDate] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<CalcUnit>('days');
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [calcError, setCalcError] = useState('');

  // Date Diff
  const [dateA, setDateA] = useState('');
  const [dateB, setDateB] = useState('');
  const [diffResult, setDiffResult] = useState<{ totalDays: number; totalHours: number; totalMinutes: number; totalWeeks: number } | null>(null);
  const [diffError, setDiffError] = useState('');

  const calculate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalcError('');
    setCalcResult(null);

    const base = parseAnyDate(baseDate);
    if (!base) { setCalcError('Invalid base date'); return; }
    const n = parseFloat(amount);
    if (isNaN(n)) { setCalcError('Invalid amount'); return; }

    const result = addTime(base, operation === 'add' ? n : -n, unit);
    setCalcResult(
      result.toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    );
  };

  const calculateDiff = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDiffError('');
    setDiffResult(null);

    const a = parseAnyDate(dateA);
    const b = parseAnyDate(dateB);
    if (!a) { setDiffError('Invalid first date'); return; }
    if (!b) { setDiffError('Invalid second date'); return; }

    setDiffResult(diffBetweenDates(a, b));
  };

  const inputStyle = {
    borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#111', backgroundColor: BG,
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Add / Subtract */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={{
        backgroundColor: SURFACE, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: BORDER, marginBottom: 16,
      }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 12 }}>Add / Subtract Time</Text>

        <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Base Date</Text>
        <TextInput
          value={baseDate}
          onChangeText={setBaseDate}
          placeholder="e.g. 2024-06-10 or 'now'"
          placeholderTextColor={MUTED}
          style={[inputStyle, { marginBottom: 10 }]}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 7"
          placeholderTextColor={MUTED}
          keyboardType="numeric"
          style={[inputStyle, { marginBottom: 10 }]}
        />

        {/* Unit selector */}
        <Text style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Unit</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => setUnit(u)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
                  backgroundColor: unit === u ? PRIMARY : BG,
                  borderWidth: 1, borderColor: unit === u ? PRIMARY : BORDER,
                }}
              >
                <Text style={{ fontSize: 13, color: unit === u ? '#fff' : MUTED, fontWeight: '600', textTransform: 'capitalize' }}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Add/Subtract toggle */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {(['add', 'subtract'] as const).map((op) => (
            <TouchableOpacity
              key={op}
              onPress={() => setOperation(op)}
              style={{
                flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
                backgroundColor: operation === op ? PRIMARY : BG,
                borderWidth: 1, borderColor: operation === op ? PRIMARY : BORDER,
              }}
            >
              <Text style={{ color: operation === op ? '#fff' : MUTED, fontWeight: '600', fontSize: 14, textTransform: 'capitalize' }}>
                {op === 'add' ? '+ Add' : '− Subtract'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={calculate}
          style={{ backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Calculate</Text>
        </TouchableOpacity>

        {!!calcError && <Text style={{ color: RED, fontSize: 12, marginTop: 8 }}>{calcError}</Text>}
        {calcResult && (
          <View style={{ marginTop: 12, backgroundColor: `${PRIMARY}10`, borderRadius: 10, padding: 12 }}>
            <Text style={{ fontSize: 12, color: PRIMARY, fontWeight: '600', marginBottom: 2 }}>RESULT</Text>
            <Text style={{ fontSize: 15, color: PRIMARY, fontWeight: '700' }} selectable>{calcResult}</Text>
          </View>
        )}
      </Animated.View>

      {/* Date Difference */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={{
        backgroundColor: SURFACE, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: BORDER,
      }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 12 }}>Date Difference</Text>

        <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Start Date</Text>
        <TextInput
          value={dateA}
          onChangeText={setDateA}
          placeholder="e.g. 2024-01-01"
          placeholderTextColor={MUTED}
          style={[inputStyle, { marginBottom: 10 }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>End Date</Text>
        <TextInput
          value={dateB}
          onChangeText={setDateB}
          placeholder="e.g. 2024-12-31"
          placeholderTextColor={MUTED}
          style={[inputStyle, { marginBottom: 12 }]}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={calculateDiff}
          style={{ backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Calculate Difference</Text>
        </TouchableOpacity>

        {!!diffError && <Text style={{ color: RED, fontSize: 12, marginTop: 8 }}>{diffError}</Text>}

        {diffResult && (
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'Weeks', value: diffResult.totalWeeks },
              { label: 'Days', value: diffResult.totalDays },
              { label: 'Hours', value: diffResult.totalHours },
              { label: 'Minutes', value: diffResult.totalMinutes },
            ].map((item) => (
              <View key={item.label} style={{
                flex: 1, minWidth: '40%', backgroundColor: `${PRIMARY}10`,
                borderRadius: 10, padding: 12, alignItems: 'center',
              }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: PRIMARY }}>{item.value.toLocaleString()}</Text>
                <Text style={{ fontSize: 11, color: MUTED, marginTop: 2, fontWeight: '600' }}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

// Countdown Tab
interface CustomEvent {
  name: string;
  dateStr: string;
}

function CountdownCard({ name, target }: { name: string; target: Date }) {
  const [cd, setCd] = useState(() => countdownFromNow(target));

  useEffect(() => {
    const id = setInterval(() => setCd(countdownFromNow(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <View style={{
      backgroundColor: SURFACE, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: BORDER, marginBottom: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111', flex: 1 }}>{name}</Text>
        <Text style={{ fontSize: 11, color: MUTED }}>
          {target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>

      {cd.past ? (
        <View style={{ backgroundColor: `${RED}10`, borderRadius: 8, padding: 10, alignItems: 'center' }}>
          <Text style={{ color: RED, fontWeight: '700', fontSize: 14 }}>
            {cd.days} day{cd.days !== 1 ? 's' : ''} ago
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[
            { label: 'Days', value: cd.days },
            { label: 'Hrs', value: cd.hours },
            { label: 'Min', value: cd.minutes },
            { label: 'Sec', value: cd.seconds },
          ].map((item) => (
            <View key={item.label} style={{
              flex: 1, backgroundColor: `${PRIMARY}10`, borderRadius: 10,
              paddingVertical: 10, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: PRIMARY, fontVariant: ['tabular-nums'] }}>
                {pad(item.value)}
              </Text>
              <Text style={{ fontSize: 10, color: MUTED, fontWeight: '600', marginTop: 2 }}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function CountdownTab() {
  const [customName, setCustomName] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [addError, setAddError] = useState('');

  const addCustomEvent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAddError('');
    if (!customName.trim()) { setAddError('Enter an event name'); return; }
    const d = parseAnyDate(customDate);
    if (!d) { setAddError('Invalid date. Use YYYY-MM-DD format'); return; }
    setCustomEvents((prev) => [...prev, { name: customName.trim(), dateStr: customDate.trim() }]);
    setCustomName('');
    setCustomDate('');
  };

  const removeCustom = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomEvents((prev) => prev.filter((_, i) => i !== idx));
  };

  const presetTargets = PRESET_EVENTS.map((ev) => ({
    name: ev.name,
    target: getNextOccurrence(ev.month, ev.day),
  }));

  const inputStyle = {
    borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#111', backgroundColor: BG,
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Add custom event */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={{
        backgroundColor: SURFACE, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: BORDER, marginBottom: 16,
      }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 12 }}>Add Custom Event</Text>
        <TextInput
          value={customName}
          onChangeText={setCustomName}
          placeholder="Event name"
          placeholderTextColor={MUTED}
          style={[inputStyle, { marginBottom: 8 }]}
        />
        <TextInput
          value={customDate}
          onChangeText={setCustomDate}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor={MUTED}
          style={[inputStyle, { marginBottom: 10 }]}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
        />
        {!!addError && <Text style={{ color: RED, fontSize: 12, marginBottom: 8 }}>{addError}</Text>}
        <TouchableOpacity
          onPress={addCustomEvent}
          style={{ backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Add Countdown</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Custom events */}
      {customEvents.length > 0 && (
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 8 }}>Your Events</Text>
          {customEvents.map((ev, idx) => {
            const d = parseAnyDate(ev.dateStr);
            if (!d) return null;
            return (
              <View key={`custom-${idx}`} style={{ position: 'relative' }}>
                <CountdownCard name={ev.name} target={d} />
                <TouchableOpacity
                  onPress={() => removeCustom(idx)}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: `${RED}15`, alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={14} color={RED} />
                </TouchableOpacity>
              </View>
            );
          })}
        </Animated.View>
      )}

      {/* Preset Events */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 8 }}>Upcoming Events</Text>
        {presetTargets.map((ev) => (
          <CountdownCard key={ev.name} name={ev.name} target={ev.target} />
        ))}
      </Animated.View>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DateTimeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('clock');

  const handleTabPress = (tab: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={{
        paddingTop: insets.top,
        backgroundColor: SURFACE,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
          <TouchableOpacity onPress={handleBack} style={{ marginRight: 12, padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color={PRIMARY} />
          </TouchableOpacity>
          <Ionicons name="time-outline" size={22} color={PRIMARY} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 }}>Date & Time</Text>
        </View>

        {/* Tab Bar */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 0 }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => handleTabPress(tab.id)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 2,
                  borderBottomColor: active ? PRIMARY : 'transparent',
                  gap: 2,
                }}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={active ? PRIMARY : MUTED}
                />
                <Text style={{
                  fontSize: 11,
                  fontWeight: active ? '700' : '500',
                  color: active ? PRIMARY : MUTED,
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'clock' && <ClockTab />}
        {activeTab === 'converter' && <ConverterTab />}
        {activeTab === 'calculator' && <CalculatorTab />}
        {activeTab === 'countdown' && <CountdownTab />}
      </View>

      {/* Bottom inset padding */}
      <View style={{ height: insets.bottom }} />
    </KeyboardAvoidingView>
  );
}
