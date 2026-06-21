import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Reanimated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#4f46e5',
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceHigh: '#273549',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: '#334155',
  success: '#22c55e',
  danger: '#ef4444',
};

// ─── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'password', label: 'Password', icon: 'lock-closed' },
  { id: 'uuid',     label: 'UUID',     icon: 'key' },
  { id: 'lorem',    label: 'Lorem',    icon: 'document-text' },
  { id: 'fakedata', label: 'Fake Data',icon: 'person' },
  { id: 'color',    label: 'Color',    icon: 'color-palette' },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function copyToClipboard(text: string, label = 'Copied!') {
  await Clipboard.setStringAsync(text);
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  Alert.alert(label, 'Copied to clipboard');
}

function Stepper({
  value, min, max, step = 1, onChange,
}: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity
        onPress={() => { if (value - step >= min) onChange(value - step); Haptics.selectionAsync(); }}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceHigh,
          justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
        <Ionicons name="remove" size={18} color={C.text} />
      </TouchableOpacity>
      <Text style={{ color: C.text, fontWeight: '700', fontSize: 18, minWidth: 40, textAlign: 'center' }}>
        {value}
      </Text>
      <TouchableOpacity
        onPress={() => { if (value + step <= max) onChange(value + step); Haptics.selectionAsync(); }}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceHigh,
          justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
        <Ionicons name="add" size={18} color={C.text} />
      </TouchableOpacity>
    </View>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <TouchableOpacity
      onPress={() => { onChange(!value); Haptics.selectionAsync(); }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
        paddingHorizontal: 12, borderRadius: 10, backgroundColor: value ? C.primary + '33' : C.surfaceHigh,
        borderWidth: 1, borderColor: value ? C.primary : C.border }}>
      <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: value ? C.primary : 'transparent',
        borderWidth: 2, borderColor: value ? C.primary : C.muted,
        justifyContent: 'center', alignItems: 'center' }}>
        {value && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
      <Text style={{ color: value ? C.text : C.muted, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: C.border, ...style }}>
      {children}
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.8 }}>{text.toUpperCase()}</Text>;
}

// ─── PASSWORD GENERATOR ───────────────────────────────────────────────────────
const UPPER  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER  = 'abcdefghijklmnopqrstuvwxyz';
const NUMS   = '0123456789';
const SYMS   = '!@#$%^&*()_+-=[]{}|;:,.<>?';

function generatePassword(length: number, upper: boolean, lower: boolean, nums: boolean, syms: boolean): string {
  let charset = '';
  if (upper) charset += UPPER;
  if (lower) charset += LOWER;
  if (nums)  charset += NUMS;
  if (syms)  charset += SYMS;
  if (!charset) charset = LOWER + NUMS;
  let pwd = '';
  // Guarantee at least one char from each selected set
  const required: string[] = [];
  if (upper) required.push(UPPER[Math.floor(Math.random() * UPPER.length)]);
  if (lower) required.push(LOWER[Math.floor(Math.random() * LOWER.length)]);
  if (nums)  required.push(NUMS[Math.floor(Math.random() * NUMS.length)]);
  if (syms)  required.push(SYMS[Math.floor(Math.random() * SYMS.length)]);
  for (let i = required.length; i < length; i++) {
    pwd += charset[Math.floor(Math.random() * charset.length)];
  }
  // Shuffle required + random chars
  const all = (required.join('') + pwd).split('');
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.join('').slice(0, length);
}

function passwordStrength(pwd: string): { label: string; color: string; score: number } {
  let s = 0;
  if (pwd.length >= 12) s++;
  if (pwd.length >= 20) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 2) return { label: 'Weak', color: C.danger, score: s };
  if (s <= 4) return { label: 'Fair', color: '#f59e0b', score: s };
  if (s <= 5) return { label: 'Strong', color: '#22c55e', score: s };
  return { label: 'Very Strong', color: '#06b6d4', score: s };
}

function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [nums,  setNums]  = useState(true);
  const [syms,  setSyms]  = useState(true);
  const [pwd, setPwd] = useState('');

  const generate = () => {
    const p = generatePassword(length, upper, lower, nums, syms);
    setPwd(p);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const strength = pwd ? passwordStrength(pwd) : null;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
      <Reanimated.View entering={FadeInDown.delay(60).springify()}>
        <SectionCard>
          <Label text="Length" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stepper value={length} min={8} max={64} onChange={setLength} />
            <Text style={{ color: C.muted, fontSize: 13 }}>8 – 64</Text>
          </View>
        </SectionCard>
      </Reanimated.View>

      <Reanimated.View entering={FadeInDown.delay(120).springify()}>
        <SectionCard>
          <Label text="Character Sets" />
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Toggle value={upper} onChange={setUpper} label="A–Z Uppercase" />
              <Toggle value={lower} onChange={setLower} label="a–z Lowercase" />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Toggle value={nums} onChange={setNums} label="0–9 Numbers" />
              <Toggle value={syms} onChange={setSyms} label="!@# Symbols" />
            </View>
          </View>
        </SectionCard>
      </Reanimated.View>

      <Reanimated.View entering={FadeInDown.delay(180).springify()}>
        <TouchableOpacity onPress={generate}
          style={{ backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Generate Password</Text>
        </TouchableOpacity>
      </Reanimated.View>

      {pwd ? (
        <Reanimated.View entering={ZoomIn.springify()}>
          <SectionCard>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Label text="Generated Password" />
              <TouchableOpacity onPress={() => copyToClipboard(pwd)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: C.primary + '33', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                <Ionicons name="copy" size={14} color={C.primary} />
                <Text style={{ color: C.primary, fontWeight: '600', fontSize: 12 }}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Text selectable style={{ color: C.text, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
              fontSize: 18, fontWeight: '700', letterSpacing: 1.5, flexWrap: 'wrap', lineHeight: 26 }}>
              {pwd}
            </Text>
            {strength && (
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: C.muted, fontSize: 12 }}>Strength</Text>
                  <Text style={{ color: strength.color, fontSize: 12, fontWeight: '700' }}>{strength.label}</Text>
                </View>
                <View style={{ height: 6, backgroundColor: C.surfaceHigh, borderRadius: 3 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: strength.color,
                    width: `${Math.round((strength.score / 6) * 100)}%` as any }} />
                </View>
              </View>
            )}
          </SectionCard>
        </Reanimated.View>
      ) : null}
    </ScrollView>
  );
}

// ─── UUID GENERATOR ───────────────────────────────────────────────────────────
function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function UUIDGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);

  const addOne = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUuids((prev) => [generateUUIDv4(), ...prev].slice(0, 20));
  };

  const addTen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ten = Array.from({ length: 10 }, generateUUIDv4);
    setUuids((prev) => [...ten, ...prev].slice(0, 20));
  };

  const clear = () => { setUuids([]); };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
      <Reanimated.View entering={FadeInDown.delay(60).springify()} style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={addOne}
          style={{ flex: 1, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <Ionicons name="add-circle" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Generate UUID</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={addTen}
          style={{ flex: 1, backgroundColor: C.surfaceHigh, borderRadius: 14, paddingVertical: 14,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
            borderWidth: 1, borderColor: C.border }}>
          <Ionicons name="layers" size={18} color={C.primary} />
          <Text style={{ color: C.primary, fontWeight: '700', fontSize: 15 }}>Bulk (×10)</Text>
        </TouchableOpacity>
      </Reanimated.View>

      {uuids.length > 0 && (
        <Reanimated.View entering={FadeInDown.delay(120).springify()}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: C.muted, fontSize: 13 }}>{uuids.length} UUID{uuids.length > 1 ? 's' : ''} generated</Text>
            <TouchableOpacity onPress={clear}>
              <Text style={{ color: C.danger, fontSize: 13, fontWeight: '600' }}>Clear all</Text>
            </TouchableOpacity>
          </View>
          {uuids.map((u, i) => (
            <Reanimated.View key={u + i} entering={FadeInDown.delay(i < 10 ? i * 30 : 0).springify()}>
              <TouchableOpacity onPress={() => copyToClipboard(u, 'UUID Copied!')}
                style={{ backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8,
                  borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ flex: 1, color: C.text, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                  fontSize: 13, letterSpacing: 0.5 }} numberOfLines={1}>
                  {u}
                </Text>
                <Ionicons name="copy-outline" size={16} color={C.muted} />
              </TouchableOpacity>
            </Reanimated.View>
          ))}
        </Reanimated.View>
      )}

      {uuids.length === 0 && (
        <Reanimated.View entering={FadeInDown.delay(180).springify()}
          style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Ionicons name="key-outline" size={48} color={C.border} />
          <Text style={{ color: C.muted, marginTop: 12, fontSize: 14 }}>No UUIDs generated yet</Text>
        </Reanimated.View>
      )}
    </ScrollView>
  );
}

// ─── LOREM IPSUM GENERATOR ────────────────────────────────────────────────────
const LOREM_WORDS = [
  'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do',
  'eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim',
  'ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi',
  'aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit',
  'voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint',
  'occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt',
  'mollit','anim','id','est','laborum','curabitur','pretium','tincidunt','lacus','nec',
  'fringilla','augue','pretium','quis','urna','aliquam','sagittis','mauris','dictum',
  'viverra','integer','vehicula','blandit','eros','elementum','posuere','pellentesque',
];

function randomWord() { return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]; }

function generateLoremWords(count: number): string {
  const words: string[] = [];
  for (let i = 0; i < count; i++) words.push(randomWord());
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

function generateLoremSentences(count: number): string {
  const sentLen = () => 8 + Math.floor(Math.random() * 12);
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    const words: string[] = [];
    const len = sentLen();
    for (let j = 0; j < len; j++) words.push(randomWord());
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    sentences.push(words.join(' ') + '.');
  }
  return sentences.join(' ');
}

function generateLoremParagraphs(count: number): string {
  const paras: string[] = [];
  for (let i = 0; i < count; i++) {
    const sentCount = 3 + Math.floor(Math.random() * 4);
    paras.push(generateLoremSentences(sentCount));
  }
  return paras.join('\n\n');
}

type LoremType = 'words' | 'sentences' | 'paragraphs';

function LoremGenerator() {
  const [type, setType] = useState<LoremType>('words');
  const [wordCount, setWordCount] = useState(50);
  const [paraCount, setParaCount] = useState(3);
  const [output, setOutput] = useState('');

  const generate = () => {
    let result = '';
    if (type === 'words')      result = generateLoremWords(wordCount);
    else if (type === 'sentences') result = generateLoremSentences(wordCount);
    else                       result = generateLoremParagraphs(paraCount);
    setOutput(result);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const typeOptions: { id: LoremType; label: string }[] = [
    { id: 'words', label: 'Words' },
    { id: 'sentences', label: 'Sentences' },
    { id: 'paragraphs', label: 'Paragraphs' },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
      <Reanimated.View entering={FadeInDown.delay(60).springify()}>
        <SectionCard>
          <Label text="Type" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {typeOptions.map((o) => (
              <TouchableOpacity key={o.id} onPress={() => { setType(o.id); Haptics.selectionAsync(); }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                  backgroundColor: type === o.id ? C.primary : C.surfaceHigh,
                  borderWidth: 1, borderColor: type === o.id ? C.primary : C.border }}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: type === o.id ? '#fff' : C.muted }}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>
      </Reanimated.View>

      <Reanimated.View entering={FadeInDown.delay(120).springify()}>
        <SectionCard>
          {type === 'paragraphs' ? (
            <>
              <Label text="Paragraph Count (1–10)" />
              <Stepper value={paraCount} min={1} max={10} onChange={setParaCount} />
            </>
          ) : (
            <>
              <Label text={type === 'words' ? 'Word Count (10–500)' : 'Sentence Count (1–30)'} />
              <Stepper
                value={wordCount}
                min={type === 'words' ? 10 : 1}
                max={type === 'words' ? 500 : 30}
                step={type === 'words' ? 10 : 1}
                onChange={setWordCount}
              />
            </>
          )}
        </SectionCard>
      </Reanimated.View>

      <Reanimated.View entering={FadeInDown.delay(180).springify()}>
        <TouchableOpacity onPress={generate}
          style={{ backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="create" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Generate Lorem</Text>
        </TouchableOpacity>
      </Reanimated.View>

      {output ? (
        <Reanimated.View entering={ZoomIn.springify()}>
          <SectionCard>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Label text="Output" />
              <TouchableOpacity onPress={() => copyToClipboard(output)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: C.primary + '33', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                <Ionicons name="copy" size={14} color={C.primary} />
                <Text style={{ color: C.primary, fontWeight: '600', fontSize: 12 }}>Copy All</Text>
              </TouchableOpacity>
            </View>
            <Text selectable style={{ color: C.text, fontSize: 14, lineHeight: 22 }}>{output}</Text>
          </SectionCard>
        </Reanimated.View>
      ) : null}
    </ScrollView>
  );
}

// ─── FAKE DATA GENERATOR ──────────────────────────────────────────────────────
const FIRST_NAMES = [
  'James','Maria','Robert','Patricia','John','Jennifer','Michael','Linda','William','Barbara',
  'David','Susan','Richard','Jessica','Joseph','Sarah','Thomas','Karen','Charles','Lisa',
  'Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra','Donald','Ashley',
  'Steven','Emily','Paul','Donna','Andrew','Carol','Kenneth','Michelle','Joshua','Amanda',
];
const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
];
const EMAIL_DOMAINS = ['gmail.com','yahoo.com','outlook.com','icloud.com','proton.me','hotmail.com'];
const STREETS = ['Main St','Oak Ave','Elm St','Maple Dr','Cedar Ln','Park Blvd','Pine Rd','Sunset Ave','Lake Dr'];
const CITIES  = ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas'];
const STATES  = ['NY','CA','IL','TX','AZ','PA','TX','CA','TX'];
const COMPANIES = [
  'TechNova Inc','BluePeak Solutions','Vertex Systems','Orbit Digital','Fusion Labs',
  'Apex Dynamics','NexGen Corp','ClearPath Ltd','Summit Analytics','BrightWave Tech',
];
const JOB_TITLES = [
  'Software Engineer','Product Manager','UX Designer','Data Analyst','DevOps Engineer',
  'Marketing Manager','Sales Director','Frontend Developer','Backend Engineer','CTO',
  'Project Lead','QA Engineer','Business Analyst','Cloud Architect','Security Engineer',
];
const AREA_CODES = ['212','310','415','312','713','602','215','210','619','214'];

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

interface FakePerson {
  name: string; email: string; phone: string;
  address: string; company: string; jobTitle: string;
}

function generatePerson(): FakePerson {
  const first = rnd(FIRST_NAMES);
  const last  = rnd(LAST_NAMES);
  const num   = Math.floor(Math.random() * 900 + 100);
  const num2  = Math.floor(Math.random() * 9000 + 1000);
  const cityIdx = Math.floor(Math.random() * CITIES.length);
  const streetNum = Math.floor(Math.random() * 9000 + 100);
  return {
    name:     `${first} ${last}`,
    email:    `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(Math.random()*99)+1}@${rnd(EMAIL_DOMAINS)}`,
    phone:    `(${rnd(AREA_CODES)}) ${num}-${num2}`,
    address:  `${streetNum} ${rnd(STREETS)}, ${CITIES[cityIdx]}, ${STATES[cityIdx]} ${Math.floor(Math.random()*90000+10000)}`,
    company:  rnd(COMPANIES),
    jobTitle: rnd(JOB_TITLES),
  };
}

function FakeDataGenerator() {
  const [person, setPerson] = useState<FakePerson>(generatePerson);

  const regenerate = () => {
    setPerson(generatePerson());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const fields: { key: keyof FakePerson; label: string; icon: string }[] = [
    { key: 'name',     label: 'Full Name',  icon: 'person' },
    { key: 'email',    label: 'Email',      icon: 'mail' },
    { key: 'phone',    label: 'Phone',      icon: 'call' },
    { key: 'address',  label: 'Address',    icon: 'location' },
    { key: 'company',  label: 'Company',    icon: 'business' },
    { key: 'jobTitle', label: 'Job Title',  icon: 'briefcase' },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
      <Reanimated.View entering={FadeInDown.delay(60).springify()}>
        <TouchableOpacity onPress={regenerate}
          style={{ backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          <Ionicons name="person-add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Regenerate Profile</Text>
        </TouchableOpacity>
      </Reanimated.View>

      {fields.map((f, i) => (
        <Reanimated.View key={f.key} entering={FadeInDown.delay(120 + i * 50).springify()}>
          <SectionCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.primary + '22',
              justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={f.icon as any} size={18} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.muted, fontSize: 11, fontWeight: '600', marginBottom: 3 }}>{f.label.toUpperCase()}</Text>
              <Text selectable style={{ color: C.text, fontSize: 14, fontWeight: '500' }}>{person[f.key]}</Text>
            </View>
            <TouchableOpacity onPress={() => copyToClipboard(person[f.key], `${f.label} Copied!`)}
              style={{ padding: 6, borderRadius: 8, backgroundColor: C.surfaceHigh }}>
              <Ionicons name="copy-outline" size={16} color={C.muted} />
            </TouchableOpacity>
          </SectionCard>
        </Reanimated.View>
      ))}
    </ScrollView>
  );
}

// ─── COLOR GENERATOR ──────────────────────────────────────────────────────────
interface ColorEntry { hex: string; locked: boolean }

function randomHex(): string {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = parseInt(hex.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function ColorGenerator() {
  const [palette, setPalette] = useState<ColorEntry[]>(() =>
    Array.from({ length: 5 }, () => ({ hex: randomHex(), locked: false }))
  );
  const [selected, setSelected] = useState<number | null>(null);

  const regenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPalette((prev) => prev.map((c) => c.locked ? c : { hex: randomHex(), locked: false }));
    setSelected(null);
  };

  const toggleLock = (idx: number) => {
    Haptics.selectionAsync();
    setPalette((prev) => prev.map((c, i) => i === idx ? { ...c, locked: !c.locked } : c));
  };

  const sel = selected !== null ? palette[selected] : null;
  const rgb = sel ? hexToRgb(sel.hex) : null;
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
      <Reanimated.View entering={FadeInDown.delay(60).springify()}>
        <TouchableOpacity onPress={regenerate}
          style={{ backgroundColor: C.primary, borderRadius: 14, paddingVertical: 15,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="shuffle" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Generate Palette</Text>
        </TouchableOpacity>
      </Reanimated.View>

      <Reanimated.View entering={FadeInDown.delay(120).springify()} style={{ gap: 10 }}>
        {palette.map((entry, i) => {
          const fg = luminance(entry.hex) > 140 ? '#000000' : '#ffffff';
          const isSelected = selected === i;
          return (
            <TouchableOpacity key={i}
              onPress={() => { setSelected(isSelected ? null : i); Haptics.selectionAsync(); }}
              style={{ height: 72, borderRadius: 16, backgroundColor: entry.hex,
                flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
                borderWidth: isSelected ? 3 : 0, borderColor: isSelected ? '#fff' : 'transparent' }}>
              <Text style={{ flex: 1, color: fg, fontWeight: '700', fontSize: 17,
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>
                {entry.hex.toUpperCase()}
              </Text>
              <TouchableOpacity onPress={() => copyToClipboard(entry.hex.toUpperCase(), 'Hex Copied!')}
                style={{ padding: 8, marginRight: 6 }}>
                <Ionicons name="copy-outline" size={18} color={fg} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleLock(i)} style={{ padding: 8 }}>
                <Ionicons name={entry.locked ? 'lock-closed' : 'lock-open-outline'} size={18} color={fg} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </Reanimated.View>

      {sel && rgb && hsl && (
        <Reanimated.View entering={ZoomIn.springify()}>
          <SectionCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: sel.hex }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontWeight: '700', fontSize: 18,
                  fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                  {sel.hex.toUpperCase()}
                </Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>Selected Color</Text>
              </View>
            </View>
            {[
              { label: 'HEX', value: sel.hex.toUpperCase() },
              { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
              { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
            ].map((row) => (
              <TouchableOpacity key={row.label} onPress={() => copyToClipboard(row.value, `${row.label} Copied!`)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 12, fontWeight: '600', width: 36 }}>{row.label}</Text>
                <Text style={{ color: C.text, fontSize: 13, flex: 1,
                  fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                  {row.value}
                </Text>
                <Ionicons name="copy-outline" size={14} color={C.muted} />
              </TouchableOpacity>
            ))}
          </SectionCard>
        </Reanimated.View>
      )}

      <Reanimated.View entering={FadeInDown.delay(240).springify()}>
        <SectionCard>
          <Label text="Tip" />
          <Text style={{ color: C.muted, fontSize: 13, lineHeight: 20 }}>
            Tap a swatch to see its HEX / RGB / HSL values. Tap the lock icon to keep a color when regenerating. Tap a value row to copy it.
          </Text>
        </SectionCard>
      </Reanimated.View>
    </ScrollView>
  );
}

// ─── ROOT SCREEN ──────────────────────────────────────────────────────────────
export default function GeneratorsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('password');

  const renderContent = () => {
    switch (activeTab) {
      case 'password': return <PasswordGenerator />;
      case 'uuid':     return <UUIDGenerator />;
      case 'lorem':    return <LoremGenerator />;
      case 'fakedata': return <FakeDataGenerator />;
      case 'color':    return <ColorGenerator />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => router.back()}
          style={{ marginRight: 12, width: 36, height: 36, borderRadius: 10,
            backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={20} color={C.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, flex: 1 }}>Generators</Text>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary }} />
      </View>

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: C.border }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => { setActiveTab(tab.id); Haptics.selectionAsync(); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                backgroundColor: isActive ? C.primary : C.surface,
                borderWidth: 1, borderColor: isActive ? C.primary : C.border }}>
              <Ionicons name={tab.icon as any} size={14} color={isActive ? '#fff' : C.muted} />
              <Text style={{ fontWeight: '600', fontSize: 13, color: isActive ? '#fff' : C.muted }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </View>
  );
}
