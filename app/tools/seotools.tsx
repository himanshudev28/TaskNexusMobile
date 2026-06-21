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

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIMARY = '#4f46e5';
const BG = '#f9fafb';
const SURFACE = '#fff';

const TABS = [
  { id: 'analyzer', label: 'Analyzer', icon: 'analytics' },
  { id: 'metatags', label: 'Meta Tags', icon: 'code-slash' },
  { id: 'keywords', label: 'Keywords', icon: 'text' },
  { id: 'sitemap', label: 'Sitemap', icon: 'map' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Stopwords ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','has','have','had','do',
  'does','did','will','would','could','should','may','might','that','this',
  'these','those','it','its','as','if','not','no','so','up','out','i','we',
  'you','he','she','they','my','our','your','his','her','their','can','all',
  'also','more','than','then','when','there','into','about','after','which',
  'what','how','just','like','such','any','each','over','other','some','two',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractTag = (html: string, tag: string): string => {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
  return m ? m[1].trim() : '';
};

const extractMeta = (html: string, name: string): string => {
  const m =
    html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'));
  return m ? m[1].trim() : '';
};

const extractMetaProperty = (html: string, property: string): string => {
  const m =
    html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
  return m ? m[1].trim() : '';
};

const countTags = (html: string, tag: string): number => {
  return (html.match(new RegExp(`<${tag}[\\s>]`, 'gi')) || []).length;
};

const countImagesWithoutAlt = (html: string): { total: number; withoutAlt: number } => {
  const all = html.match(/<img[^>]*>/gi) || [];
  const withoutAlt = all.filter((img) => !/alt=["'][^"']+["']/i.test(img));
  return { total: all.length, withoutAlt: withoutAlt.length };
};

const countLinks = (html: string, baseHost: string): { internal: number; external: number } => {
  const hrefs = html.match(/href=["']([^"']+)["']/gi) || ([] as string[]);
  let internal = 0;
  let external = 0;
  hrefs.forEach((h) => {
    const url = h.replace(/href=["']/i, '').replace(/["']$/, '');
    if (url.startsWith('http') || url.startsWith('//')) {
      try {
        const host = new URL(url.startsWith('//') ? 'https:' + url : url).hostname;
        host === baseHost ? internal++ : external++;
      } catch {
        external++;
      }
    } else if (url.startsWith('#') || url.startsWith('/') || !url.startsWith('mailto')) {
      internal++;
    }
  });
  return { internal, external };
};

const extractCanonical = (html: string): string => {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
            html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return m ? m[1].trim() : '';
};

const extractRobotsMeta = (html: string): string => {
  return extractMeta(html, 'robots') || 'Not set';
};

interface SeoAnalysis {
  title: string;
  titleLen: number;
  description: string;
  descLen: number;
  h1Count: number;
  imageTotal: number;
  imageWithoutAlt: number;
  linksInternal: number;
  linksExternal: number;
  robots: string;
  canonical: string;
  score: number;
}

const analyzeHtml = (html: string, url: string): SeoAnalysis => {
  let host = '';
  try { host = new URL(url).hostname; } catch {}

  const title = extractTag(html, 'title');
  const titleLen = title.length;
  const description = extractMeta(html, 'description');
  const descLen = description.length;
  const h1Count = countTags(html, 'h1');
  const { total: imageTotal, withoutAlt: imageWithoutAlt } = countImagesWithoutAlt(html);
  const { internal: linksInternal, external: linksExternal } = countLinks(html, host);
  const robots = extractRobotsMeta(html);
  const canonical = extractCanonical(html);

  let score = 0;
  if (titleLen >= 50 && titleLen <= 60) score += 20;
  else if (titleLen > 0) score += 10;
  if (descLen >= 150 && descLen <= 160) score += 20;
  else if (descLen > 0) score += 10;
  if (h1Count === 1) score += 20;
  else if (h1Count > 0) score += 5;
  if (imageTotal === 0 || imageWithoutAlt === 0) score += 20;
  else score += Math.round((1 - imageWithoutAlt / imageTotal) * 20);
  if (canonical) score += 10;
  if (robots && robots !== 'Not set') score += 10;

  return { title, titleLen, description, descLen, h1Count, imageTotal, imageWithoutAlt, linksInternal, linksExternal, robots, canonical, score };
};

// Mock analysis for CORS-blocked URLs
const mockAnalysis = (): SeoAnalysis => ({
  title: 'Example Page Title (55 chars demo)',
  titleLen: 35,
  description: 'This is a sample meta description demonstrating how the analyzer works when real fetch is blocked by CORS.',
  descLen: 103,
  h1Count: 1,
  imageTotal: 8,
  imageWithoutAlt: 2,
  linksInternal: 12,
  linksExternal: 5,
  robots: 'index, follow',
  canonical: 'https://example.com/page',
  score: 72,
});

const scoreColor = (s: number) =>
  s >= 80 ? '#16a34a' : s >= 50 ? '#d97706' : '#dc2626';

const titleStatus = (len: number) => len >= 50 && len <= 60;
const descStatus = (len: number) => len >= 150 && len <= 160;

// ─── Keyword helpers ──────────────────────────────────────────────────────────

interface KeywordResult {
  word: string;
  count: number;
  percent: number;
}

const analyzeKeywords = (text: string): KeywordResult[] => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

  const freq: Record<string, number> = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  const total = words.length || 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count, percent: Math.round((count / total) * 1000) / 10 }));
};

const extractLsi = (text: string, keywords: KeywordResult[]): string[] => {
  const top5 = keywords.slice(0, 5).map((k) => k.word);
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const suggestions: string[] = [];
  top5.forEach((kw) => {
    const related = sentences.filter((s) => s.toLowerCase().includes(kw));
    if (related.length) {
      const phrase = related[0].toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).slice(0, 4).join(' ');
      if (phrase && !suggestions.includes(phrase)) suggestions.push(phrase);
    }
  });
  return suggestions.slice(0, 6);
};

// ─── Sitemap helpers ──────────────────────────────────────────────────────────

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const parseSitemap = (xml: string): SitemapUrl[] => {
  const urls: SitemapUrl[] = [];
  const urlBlocks = xml.match(/<url[\s\S]*?<\/url>/gi) || ([] as string[]);
  urlBlocks.forEach((block) => {
    const loc = (block.match(/<loc>([^<]+)<\/loc>/i) || [])[1] || '';
    const lastmod = (block.match(/<lastmod>([^<]+)<\/lastmod>/i) || [])[1];
    const changefreq = (block.match(/<changefreq>([^<]+)<\/changefreq>/i) || [])[1];
    const priority = (block.match(/<priority>([^<]+)<\/priority>/i) || [])[1];
    if (loc) urls.push({ loc, lastmod, changefreq, priority });
  });
  return urls;
};

// ─── Sub-screens ──────────────────────────────────────────────────────────────

// ANALYZER TAB
function AnalyzerTab() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeoAnalysis | null>(null);
  const [corsBlocked, setCorsBlocked] = useState(false);

  const analyze = async () => {
    if (!url.trim()) { Alert.alert('Enter a URL first'); return; }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setCorsBlocked(false);
    setResult(null);
    try {
      const target = url.startsWith('http') ? url : `https://${url}`;
      const res = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)',
          Accept: 'text/html',
        },
      });
      const html = await res.text();
      setResult(analyzeHtml(html, target));
    } catch {
      setCorsBlocked(true);
      setResult(mockAnalysis());
    } finally {
      setLoading(false);
    }
  };

  const Row = ({
    icon, label, value, ok, note,
  }: { icon: string; label: string; value: string; ok?: boolean; note?: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10,
      borderBottomWidth: 1, borderColor: '#f3f4f6' }}>
      <Text style={{ fontSize: 16 }}>{ok === undefined ? '🔹' : ok ? '✅' : '⚠️'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: '#111827', marginTop: 2 }}>{value}</Text>
        {note ? <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{note}</Text> : null}
      </View>
      <Ionicons name={icon as any} size={18} color="#c4b5fd" />
    </View>
  );

  return (
    <View style={{ gap: 14 }}>
      <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#e5e7eb', gap: 10 }}>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={{ backgroundColor: BG, borderRadius: 10, padding: 12,
            borderWidth: 1, borderColor: '#e5e7eb', fontSize: 15, color: '#111' }}
        />
        <TouchableOpacity
          onPress={analyze}
          disabled={loading}
          style={{ backgroundColor: loading ? '#a5b4fc' : PRIMARY, borderRadius: 10,
            padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="analytics" size={18} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {loading ? 'Analyzing…' : 'Analyze URL'}
          </Text>
        </TouchableOpacity>
      </View>

      {corsBlocked && (
        <Animated.View entering={FadeInDown.duration(300)}
          style={{ backgroundColor: '#fffbeb', borderRadius: 12, padding: 14,
            borderWidth: 1, borderColor: '#fde68a', flexDirection: 'row', gap: 10 }}>
          <Ionicons name="warning" size={18} color="#d97706" />
          <Text style={{ flex: 1, color: '#92400e', fontSize: 13, lineHeight: 19 }}>
            Could not fetch the URL directly (CORS restriction in mobile environment).
            Showing a demo analysis below to illustrate the feature.
          </Text>
        </Animated.View>
      )}

      {result && (
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 12 }}>
          {/* Score card */}
          <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 20,
            alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ color: '#6b7280', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>SEO SCORE</Text>
            <View style={{ width: 100, height: 100, borderRadius: 50,
              backgroundColor: scoreColor(result.score) + '18',
              borderWidth: 4, borderColor: scoreColor(result.score),
              justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: scoreColor(result.score) }}>{result.score}</Text>
              <Text style={{ fontSize: 12, color: scoreColor(result.score), fontWeight: '600' }}>/100</Text>
            </View>
            <Text style={{ marginTop: 10, fontSize: 13, color: '#6b7280' }}>
              {result.score >= 80 ? 'Excellent SEO' : result.score >= 50 ? 'Needs improvement' : 'Poor SEO — action required'}
            </Text>
          </View>

          {/* Details */}
          <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Row
              icon="text"
              label="Title Tag"
              ok={titleStatus(result.titleLen)}
              value={result.title || '(not found)'}
              note={`${result.titleLen} chars${titleStatus(result.titleLen) ? ' — ideal (50-60)' : ' — ideal is 50-60'}`}
            />
            <Row
              icon="document-text"
              label="Meta Description"
              ok={descStatus(result.descLen)}
              value={result.description || '(not found)'}
              note={`${result.descLen} chars${descStatus(result.descLen) ? ' — ideal (150-160)' : ' — ideal is 150-160'}`}
            />
            <Row
              icon="header"
              label="H1 Count"
              ok={result.h1Count === 1}
              value={`${result.h1Count} H1 tag${result.h1Count !== 1 ? 's' : ''}`}
              note={result.h1Count === 1 ? 'Perfect' : result.h1Count === 0 ? 'Missing H1' : 'Too many H1s — use only one'}
            />
            <Row
              icon="image"
              label="Images"
              ok={result.imageWithoutAlt === 0}
              value={`${result.imageTotal} images — ${result.imageWithoutAlt} without alt text`}
              note={result.imageWithoutAlt > 0 ? `Add alt attributes to ${result.imageWithoutAlt} image(s)` : 'All images have alt text'}
            />
            <Row
              icon="link"
              label="Links"
              value={`${result.linksInternal} internal · ${result.linksExternal} external`}
            />
            <Row
              icon="shield-checkmark"
              label="Robots Meta"
              ok={result.robots !== 'Not set'}
              value={result.robots}
            />
            <Row
              icon="location"
              label="Canonical URL"
              ok={!!result.canonical}
              value={result.canonical || '(not set)'}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// META TAGS TAB
function MetaTagsTab() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [keywords, setKeywords] = useState('');
  const [author, setAuthor] = useState('');
  const [robots, setRobots] = useState('index, follow');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDesc, setOgDesc] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [ogType, setOgType] = useState('website');
  const [twCard, setTwCard] = useState('summary_large_image');
  const [twTitle, setTwTitle] = useState('');
  const [twDesc, setTwDesc] = useState('');
  const [snippet, setSnippet] = useState('');

  const robotsOptions = ['index, follow', 'noindex, nofollow', 'index, nofollow', 'noindex, follow'];
  const ogTypeOptions = ['website', 'article', 'product', 'profile', 'video'];
  const twCardOptions = ['summary', 'summary_large_image', 'app', 'player'];

  const generate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lines: string[] = ['<!-- Primary Meta Tags -->'];
    if (title) lines.push(`<title>${title}</title>`);
    if (title) lines.push(`<meta name="title" content="${title}" />`);
    if (desc) lines.push(`<meta name="description" content="${desc}" />`);
    if (keywords) lines.push(`<meta name="keywords" content="${keywords}" />`);
    if (author) lines.push(`<meta name="author" content="${author}" />`);
    lines.push(`<meta name="robots" content="${robots}" />`);
    lines.push('');
    lines.push('<!-- Open Graph / Facebook -->');
    lines.push(`<meta property="og:type" content="${ogType}" />`);
    if (ogTitle || title) lines.push(`<meta property="og:title" content="${ogTitle || title}" />`);
    if (ogDesc || desc) lines.push(`<meta property="og:description" content="${ogDesc || desc}" />`);
    if (ogImage) lines.push(`<meta property="og:image" content="${ogImage}" />`);
    lines.push('');
    lines.push('<!-- Twitter -->');
    lines.push(`<meta property="twitter:card" content="${twCard}" />`);
    if (twTitle || ogTitle || title) lines.push(`<meta property="twitter:title" content="${twTitle || ogTitle || title}" />`);
    if (twDesc || ogDesc || desc) lines.push(`<meta property="twitter:description" content="${twDesc || ogDesc || desc}" />`);
    if (ogImage) lines.push(`<meta property="twitter:image" content="${ogImage}" />`);
    setSnippet(lines.join('\n'));
  };

  const copyAll = async () => {
    if (!snippet) { Alert.alert('Generate first'); return; }
    await Clipboard.setStringAsync(snippet);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'All meta tags copied to clipboard');
  };

  const Field = ({ label, value, onChange, placeholder, multiline }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; multiline?: boolean;
  }) => (
    <View style={{ gap: 5 }}>
      <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={{ backgroundColor: BG, borderRadius: 10, padding: 11,
          borderWidth: 1, borderColor: '#e5e7eb', fontSize: 14, color: '#111',
          ...(multiline ? { minHeight: 72, textAlignVertical: 'top' } : {}) }}
      />
    </View>
  );

  const Dropdown = ({ label, value, options, onChange }: {
    label: string; value: string; options: string[]; onChange: (v: string) => void;
  }) => (
    <View style={{ gap: 5 }}>
      <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {options.map((opt) => (
            <TouchableOpacity key={opt} onPress={() => onChange(opt)}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                backgroundColor: value === opt ? PRIMARY : '#e5e7eb' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: value === opt ? '#fff' : '#6b7280' }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={{ gap: 16 }}>
      {/* Primary */}
      <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 }}>
        <Text style={{ fontWeight: '700', color: '#111', fontSize: 15 }}>Primary Tags</Text>
        <Field label="Title" value={title} onChange={setTitle} placeholder="Page title (50-60 chars)" />
        <Field label="Description" value={desc} onChange={setDesc} placeholder="Meta description (150-160 chars)" multiline />
        <Field label="Keywords" value={keywords} onChange={setKeywords} placeholder="keyword1, keyword2, keyword3" />
        <Field label="Author" value={author} onChange={setAuthor} placeholder="Author name" />
        <Dropdown label="Robots" value={robots} options={robotsOptions} onChange={setRobots} />
      </View>

      {/* Open Graph */}
      <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 }}>
        <Text style={{ fontWeight: '700', color: '#111', fontSize: 15 }}>Open Graph</Text>
        <Field label="og:title (leave blank to use Title)" value={ogTitle} onChange={setOgTitle} placeholder="OG title" />
        <Field label="og:description (leave blank to use Description)" value={ogDesc} onChange={setOgDesc} placeholder="OG description" multiline />
        <Field label="og:image URL" value={ogImage} onChange={setOgImage} placeholder="https://example.com/image.jpg" />
        <Dropdown label="og:type" value={ogType} options={ogTypeOptions} onChange={setOgType} />
      </View>

      {/* Twitter */}
      <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 }}>
        <Text style={{ fontWeight: '700', color: '#111', fontSize: 15 }}>Twitter Card</Text>
        <Dropdown label="twitter:card" value={twCard} options={twCardOptions} onChange={setTwCard} />
        <Field label="twitter:title (leave blank to use og:title/Title)" value={twTitle} onChange={setTwTitle} placeholder="Twitter title" />
        <Field label="twitter:description" value={twDesc} onChange={setTwDesc} placeholder="Twitter description" multiline />
      </View>

      <TouchableOpacity onPress={generate}
        style={{ backgroundColor: PRIMARY, borderRadius: 12, padding: 15,
          alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
        <Ionicons name="code-slash" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Generate Meta Tags</Text>
      </TouchableOpacity>

      {snippet ? (
        <Animated.View entering={FadeInDown.duration(350)} style={{ gap: 10 }}>
          <View style={{ backgroundColor: '#1e1b4b', borderRadius: 14, padding: 16 }}>
            <Text selectable style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#c4b5fd', lineHeight: 20 }}>
              {snippet}
            </Text>
          </View>
          <TouchableOpacity onPress={copyAll}
            style={{ backgroundColor: '#16a34a', borderRadius: 12, padding: 13,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="copy" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Copy All Meta Tags</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </View>
  );
}

// KEYWORDS TAB
function KeywordsTab() {
  const [content, setContent] = useState('');
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [lsi, setLsi] = useState<string[]>([]);

  const analyze = async () => {
    if (!content.trim()) { Alert.alert('Enter some content first'); return; }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const kws = analyzeKeywords(content);
    setResults(kws);
    setLsi(extractLsi(content, kws));
  };

  const maxCount = results[0]?.count || 1;

  const densityNote = (pct: number) => {
    if (pct < 0.5) return { text: 'Too low', color: '#dc2626' };
    if (pct <= 2.5) return { text: 'Ideal', color: '#16a34a' };
    if (pct <= 4) return { text: 'Acceptable', color: '#d97706' };
    return { text: 'Keyword stuffing risk', color: '#dc2626' };
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#e5e7eb', gap: 10 }}>
        <Text style={{ fontWeight: '700', color: '#111', fontSize: 15 }}>Paste Your Content</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Paste article, blog post or page content here…"
          multiline
          numberOfLines={6}
          style={{ backgroundColor: BG, borderRadius: 10, padding: 12, borderWidth: 1,
            borderColor: '#e5e7eb', minHeight: 130, textAlignVertical: 'top', fontSize: 14, color: '#111' }}
        />
        <TouchableOpacity onPress={analyze}
          style={{ backgroundColor: PRIMARY, borderRadius: 10, padding: 13,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="search" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Analyze Keywords</Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <Animated.View entering={FadeInDown.duration(350)} style={{ gap: 12 }}>
          {/* Keyword cloud */}
          <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontWeight: '700', color: '#111', fontSize: 15, marginBottom: 12 }}>
              Top Keywords ({results.length})
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {results.map((kw, i) => {
                const size = 11 + Math.round((kw.count / maxCount) * 8);
                const opacity = 0.4 + (kw.count / maxCount) * 0.6;
                return (
                  <View key={kw.word}
                    style={{ backgroundColor: PRIMARY + Math.round(opacity * 255).toString(16).padStart(2, '0'),
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                    <Text style={{ color: '#fff', fontSize: size, fontWeight: '700' }}>{kw.word}</Text>
                  </View>
                );
              })}
            </View>

            {/* Keyword list */}
            {results.map((kw, i) => {
              const note = densityNote(kw.percent);
              return (
                <View key={kw.word}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingVertical: 8, borderBottomWidth: i < results.length - 1 ? 1 : 0, borderColor: '#f3f4f6' }}>
                  <Text style={{ width: 22, fontSize: 12, color: '#9ca3af', fontWeight: '700' }}>#{i + 1}</Text>
                  <Text style={{ flex: 1, fontSize: 14, color: '#111827', fontWeight: '600' }}>{kw.word}</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280' }}>{kw.count}×</Text>
                  <View style={{ backgroundColor: note.color + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                    <Text style={{ fontSize: 11, color: note.color, fontWeight: '600' }}>{kw.percent}%</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Density recommendations */}
          <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 }}>
            <Text style={{ fontWeight: '700', color: '#111', fontSize: 15, marginBottom: 4 }}>Density Guide</Text>
            {[
              { range: '< 0.5%', label: 'Too low — keyword may not be indexed', color: '#dc2626' },
              { range: '0.5% – 2.5%', label: 'Ideal — natural usage', color: '#16a34a' },
              { range: '2.5% – 4%', label: 'Acceptable but watch it', color: '#d97706' },
              { range: '> 4%', label: 'Keyword stuffing risk — reduce usage', color: '#dc2626' },
            ].map((r) => (
              <View key={r.range} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color }} />
                <Text style={{ fontWeight: '700', fontSize: 12, color: r.color, width: 80 }}>{r.range}</Text>
                <Text style={{ flex: 1, fontSize: 12, color: '#6b7280' }}>{r.label}</Text>
              </View>
            ))}
          </View>

          {/* LSI */}
          {lsi.length > 0 && (
            <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
              <Text style={{ fontWeight: '700', color: '#111', fontSize: 15, marginBottom: 10 }}>LSI Suggestions</Text>
              <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 10 }}>
                Related phrases extracted from your content that can help with semantic SEO.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {lsi.map((phrase) => (
                  <View key={phrase}
                    style={{ backgroundColor: '#ede9fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                    <Text style={{ color: '#6d28d9', fontSize: 13, fontWeight: '600' }}>{phrase}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// SITEMAP TAB
function SitemapTab() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<SitemapUrl[]>([]);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const fetchSitemap = async () => {
    if (!url.trim()) { Alert.alert('Enter a sitemap URL'); return; }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError('');
    setUrls([]);
    try {
      const target = url.startsWith('http') ? url : `https://${url}`;
      const res = await fetch(target, {
        headers: { Accept: 'application/xml, text/xml' },
      });
      const xml = await res.text();
      const parsed = parseSitemap(xml);
      if (!parsed.length) { setError('No <url> entries found. Check if this is a valid sitemap.xml.'); }
      else setUrls(parsed);
    } catch (e: any) {
      setError('Could not fetch sitemap. This may be blocked by CORS in the mobile app. Try pasting the sitemap XML manually.');
    } finally {
      setLoading(false);
    }
  };

  const dates = urls.map((u) => u.lastmod).filter(Boolean) as string[];
  const oldest = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
  const newest = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;

  const priorityGroups: Record<string, number> = {};
  urls.forEach((u) => {
    const p = u.priority || 'unset';
    priorityGroups[p] = (priorityGroups[p] || 0) + 1;
  });

  const freqGroups: Record<string, number> = {};
  urls.forEach((u) => {
    const f = u.changefreq || 'unset';
    freqGroups[f] = (freqGroups[f] || 0) + 1;
  });

  const visibleUrls = expanded ? urls : urls.slice(0, 20);

  return (
    <View style={{ gap: 14 }}>
      <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#e5e7eb', gap: 10 }}>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com/sitemap.xml"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={{ backgroundColor: BG, borderRadius: 10, padding: 12,
            borderWidth: 1, borderColor: '#e5e7eb', fontSize: 15, color: '#111' }}
        />
        <TouchableOpacity onPress={fetchSitemap} disabled={loading}
          style={{ backgroundColor: loading ? '#a5b4fc' : PRIMARY, borderRadius: 10,
            padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="map" size={18} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
            {loading ? 'Fetching…' : 'Fetch Sitemap'}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Animated.View entering={FadeInDown.duration(300)}
          style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 14,
            borderWidth: 1, borderColor: '#fecaca', flexDirection: 'row', gap: 10 }}>
          <Ionicons name="close-circle" size={18} color="#dc2626" />
          <Text style={{ flex: 1, color: '#991b1b', fontSize: 13, lineHeight: 19 }}>{error}</Text>
        </Animated.View>
      ) : null}

      {urls.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400)} style={{ gap: 12 }}>
          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 16,
              borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: PRIMARY }}>{urls.length}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>Total URLs</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 16,
              borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#16a34a' }}>{dates.length}</Text>
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '600' }}>With Dates</Text>
            </View>
          </View>

          {/* Date range */}
          {(oldest || newest) && (
            <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 }}>
              <Text style={{ fontWeight: '700', color: '#111', fontSize: 14 }}>Date Range</Text>
              {oldest && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6b7280', fontSize: 13 }}>Oldest</Text>
                  <Text style={{ color: '#111', fontSize: 13, fontWeight: '600' }}>{oldest}</Text>
                </View>
              )}
              {newest && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#6b7280', fontSize: 13 }}>Newest</Text>
                  <Text style={{ color: '#111', fontSize: 13, fontWeight: '600' }}>{newest}</Text>
                </View>
              )}
            </View>
          )}

          {/* Priority distribution */}
          {Object.keys(priorityGroups).length > 0 && (
            <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 }}>
              <Text style={{ fontWeight: '700', color: '#111', fontSize: 14, marginBottom: 4 }}>Priority Distribution</Text>
              {Object.entries(priorityGroups)
                .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
                .map(([p, count]) => (
                  <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ width: 50, fontSize: 13, fontWeight: '700', color: PRIMARY }}>{p}</Text>
                    <View style={{ flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3 }}>
                      <View style={{ width: `${(count / urls.length) * 100}%`, height: 6,
                        backgroundColor: PRIMARY, borderRadius: 3 }} />
                    </View>
                    <Text style={{ width: 36, fontSize: 12, color: '#6b7280', textAlign: 'right' }}>{count}</Text>
                  </View>
                ))}
            </View>
          )}

          {/* Changefreq distribution */}
          {Object.keys(freqGroups).length > 1 && (
            <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 }}>
              <Text style={{ fontWeight: '700', color: '#111', fontSize: 14, marginBottom: 4 }}>Change Frequency</Text>
              {Object.entries(freqGroups).sort((a, b) => b[1] - a[1]).map(([f, count]) => (
                <View key={f} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>{f}</Text>
                  <View style={{ backgroundColor: '#ede9fe', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
                    <Text style={{ fontSize: 12, color: '#6d28d9', fontWeight: '700' }}>{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* URL list */}
          <View style={{ backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 10 }}>
            <Text style={{ fontWeight: '700', color: '#111', fontSize: 14 }}>
              URL List {urls.length > 20 ? `(showing ${visibleUrls.length} of ${urls.length})` : ''}
            </Text>
            {visibleUrls.map((u, i) => (
              <View key={i}
                style={{ borderBottomWidth: i < visibleUrls.length - 1 ? 1 : 0,
                  borderColor: '#f3f4f6', paddingBottom: i < visibleUrls.length - 1 ? 10 : 0 }}>
                <Text style={{ fontSize: 12, color: PRIMARY, fontWeight: '600' }} numberOfLines={1}>{u.loc}</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {u.lastmod && (
                    <Text style={{ fontSize: 11, color: '#9ca3af' }}>{u.lastmod}</Text>
                  )}
                  {u.changefreq && (
                    <View style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600' }}>{u.changefreq}</Text>
                    </View>
                  )}
                  {u.priority && (
                    <View style={{ backgroundColor: '#ede9fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: '#6d28d9', fontWeight: '600' }}>p:{u.priority}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
            {urls.length > 20 && (
              <TouchableOpacity onPress={() => setExpanded(!expanded)}
                style={{ paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 13 }}>
                  {expanded ? 'Show less' : `Show all ${urls.length} URLs`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

export default function SeoToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('analyzer');

  const handleTabPress = async (id: TabId) => {
    if (id === tab) return;
    await Haptics.selectionAsync();
    setTab(id);
  };

  const renderTab = () => {
    switch (tab) {
      case 'analyzer': return <AnalyzerTab />;
      case 'metatags': return <MetaTagsTab />;
      case 'keywords': return <KeywordsTab />;
      case 'sitemap': return <SitemapTab />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12,
        backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 }}>SEO Tools</Text>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => handleTabPress(t.id)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
              backgroundColor: tab === t.id ? PRIMARY : '#e5e7eb',
              marginRight: 8 }}>
            <Ionicons name={t.icon as any} size={14} color={tab === t.id ? '#fff' : '#6b7280'} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: tab === t.id ? '#fff' : '#6b7280' }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {renderTab()}
      </ScrollView>
    </View>
  );
}
