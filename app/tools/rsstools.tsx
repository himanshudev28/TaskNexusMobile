import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  RefreshControl,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RSSItem {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  author: string;
  thumbnail: string;
  enclosure?: { link: string; type: string };
}

interface FeedData {
  title: string;
  description: string;
  items: RSSItem[];
}

interface PresetFeed {
  label: string;
  url: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#4f46e5';
const BG = '#f9fafb';
const SURFACE = '#fff';
const TEXT_MAIN = '#111827';
const TEXT_MUTED = '#6b7280';
const ERROR_COLOR = '#dc2626';
const BORDER = '#e5e7eb';

const PLACEHOLDER_COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#ea580c',
  '#16a34a', '#0284c7', '#d97706', '#be123c',
];

const PRESET_FEEDS: PresetFeed[] = [
  { label: 'HackerNews', url: 'https://hnrss.org/frontpage' },
  { label: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { label: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml' },
  { label: 'NASA', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
  { label: 'GitHub Blog', url: 'https://github.blog/feed/' },
];

const PROXY_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

function getThumbnail(item: RSSItem): string {
  if (item.thumbnail && item.thumbnail.startsWith('http')) return item.thumbnail;
  if (item.enclosure?.type?.startsWith('image/') && item.enclosure.link) return item.enclosure.link;
  const imgMatch = item.description?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) return imgMatch[1];
  return '';
}

function getPlaceholderColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────

function ShimmerBlock({ width, height, radius = 6 }: { width: number | string; height: number; radius?: number }) {
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.4, 0.9, 0.4]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: '#d1d5db',
        },
        animStyle,
      ]}
    />
  );
}

function SkeletonCard() {
  return (
    <View
      style={{
        backgroundColor: SURFACE,
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 14,
        flexDirection: 'row',
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <ShimmerBlock width={80} height={80} radius={10} />
      <View style={{ flex: 1, gap: 8 }}>
        <ShimmerBlock width="90%" height={14} />
        <ShimmerBlock width="60%" height={12} />
        <ShimmerBlock width="100%" height={11} />
        <ShimmerBlock width="80%" height={11} />
      </View>
    </View>
  );
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ item, index }: { item: RSSItem; index: number }) {
  const thumbnail = getThumbnail(item);
  const placeholderColor = getPlaceholderColor(item.title || 'A');
  const firstLetter = (item.title || 'A')[0].toUpperCase();
  const description = stripHtml(item.description || '');

  const handlePress = async () => {
    if (!item.link) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const supported = await Linking.canOpenURL(item.link);
      if (supported) await Linking.openURL(item.link);
    } catch {
      // silently fail
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(350).springify()}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        style={{
          backgroundColor: SURFACE,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 12,
          padding: 14,
          flexDirection: 'row',
          gap: 12,
          shadowColor: '#000',
          shadowOpacity: 0.07,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        {/* Thumbnail */}
        <View style={{ width: 82, height: 82, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={{ width: 82, height: 82 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 82,
                height: 82,
                backgroundColor: placeholderColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 30, fontWeight: '700' }}>{firstLetter}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={{ fontSize: 14, fontWeight: '700', color: TEXT_MAIN, lineHeight: 20, marginBottom: 4 }}
          >
            {item.title || 'Untitled'}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            {item.author ? (
              <Text style={{ fontSize: 11, color: PRIMARY, fontWeight: '600' }} numberOfLines={1}>
                {item.author}
              </Text>
            ) : null}
            {item.author && item.pubDate ? (
              <Text style={{ fontSize: 11, color: TEXT_MUTED }}>·</Text>
            ) : null}
            {item.pubDate ? (
              <Text style={{ fontSize: 11, color: TEXT_MUTED }}>{formatDate(item.pubDate)}</Text>
            ) : null}
          </View>

          {description ? (
            <Text
              numberOfLines={3}
              style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 17 }}
            >
              {description}
            </Text>
          ) : null}
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={16} color="#d1d5db" style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RSSToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedFeedUrl, setSelectedFeedUrl] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [feedData, setFeedData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedUrls, setBookmarkedUrls] = useState<string[]>([]);
  const [customFeeds, setCustomFeeds] = useState<PresetFeed[]>([]);

  const allFeeds: PresetFeed[] = [...PRESET_FEEDS, ...customFeeds];

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchFeed = useCallback(async (url: string, isRefresh = false) => {
    if (!url) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const encoded = encodeURIComponent(url);
      const apiUrl = `${PROXY_BASE}${encoded}`;
      const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== 'ok') throw new Error(json.message || 'Feed error');
      setFeedData({
        title: json.feed?.title || 'Untitled Feed',
        description: json.feed?.description || '',
        items: json.items || [],
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to load feed. Please check the URL and try again.');
      setFeedData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectFeed = async (url: string) => {
    await Haptics.selectionAsync();
    setSelectedFeedUrl(url);
    setFeedData(null);
    fetchFeed(url);
  };

  const handleAddCustomFeed = async () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const exists = allFeeds.some((f) => f.url === url);
    if (!exists) {
      const label = new URL(url).hostname.replace('www.', '');
      setCustomFeeds((prev) => [...prev, { label, url }]);
    }
    setCustomInput('');
    handleSelectFeed(url);
  };

  const handleToggleBookmark = async (url: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarkedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleRefresh = () => {
    if (selectedFeedUrl) fetchFeed(selectedFeedUrl, true);
  };

  const handleRetry = () => {
    if (selectedFeedUrl) fetchFeed(selectedFeedUrl);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: SURFACE,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Ionicons name="newspaper-outline" size={22} color={PRIMARY} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_MAIN }}>RSS Reader</Text>
          {feedData && (
            <Text style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }} numberOfLines={1}>
              {feedData.title} · {feedData.items.length} articles
            </Text>
          )}
        </View>
        {selectedFeedUrl && (
          <TouchableOpacity
            onPress={() => handleToggleBookmark(selectedFeedUrl)}
            style={{ padding: 6 }}
          >
            <Ionicons
              name={bookmarkedUrls.includes(selectedFeedUrl) ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={bookmarkedUrls.includes(selectedFeedUrl) ? PRIMARY : TEXT_MUTED}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Feed Chips ───────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(50).duration(350)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 8 }}
          >
            {/* Bookmarked section label */}
            {bookmarkedUrls.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: '600', marginRight: 4 }}>SAVED</Text>
                {bookmarkedUrls.map((url) => {
                  const match = allFeeds.find((f) => f.url === url);
                  const label = match?.label ?? new URL(url).hostname.replace('www.', '');
                  const isActive = selectedFeedUrl === url;
                  return (
                    <TouchableOpacity
                      key={`bm-${url}`}
                      onPress={() => handleSelectFeed(url)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isActive ? PRIMARY : '#ede9fe',
                        borderRadius: 20,
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        gap: 4,
                      }}
                    >
                      <Ionicons name="bookmark" size={12} color={isActive ? '#fff' : PRIMARY} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? '#fff' : PRIMARY }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={{ width: 1, height: 28, backgroundColor: BORDER, marginHorizontal: 4 }} />
              </View>
            )}

            {/* Preset + Custom feeds */}
            {allFeeds.map((feed, i) => {
              const isActive = selectedFeedUrl === feed.url;
              const isBookmarked = bookmarkedUrls.includes(feed.url);
              return (
                <TouchableOpacity
                  key={`feed-${i}`}
                  onPress={() => handleSelectFeed(feed.url)}
                  style={{
                    backgroundColor: isActive ? PRIMARY : SURFACE,
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderWidth: 1.5,
                    borderColor: isActive ? PRIMARY : BORDER,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {isBookmarked && !isActive && (
                    <Ionicons name="bookmark" size={11} color={PRIMARY} />
                  )}
                  <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? '#fff' : TEXT_MAIN }}>
                    {feed.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── Custom URL Input ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(120).duration(350)}>
          <View style={{
            flexDirection: 'row',
            marginHorizontal: 16,
            marginBottom: 16,
            gap: 8,
          }}>
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: SURFACE,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: BORDER,
              paddingHorizontal: 12,
              gap: 8,
            }}>
              <Ionicons name="link-outline" size={18} color={TEXT_MUTED} />
              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                placeholder="Paste RSS feed URL…"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleAddCustomFeed}
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: TEXT_MAIN,
                  paddingVertical: Platform.OS === 'ios' ? 11 : 8,
                }}
              />
              {customInput.length > 0 && (
                <TouchableOpacity onPress={() => setCustomInput('')} style={{ padding: 2 }}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={handleAddCustomFeed}
              style={{
                backgroundColor: PRIMARY,
                borderRadius: 12,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {!selectedFeedUrl && !loading && (
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}
          >
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#ede9fe',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Ionicons name="newspaper-outline" size={38} color={PRIMARY} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: TEXT_MAIN, marginBottom: 8, textAlign: 'center' }}>
              Pick a Feed
            </Text>
            <Text style={{ fontSize: 14, color: TEXT_MUTED, textAlign: 'center', lineHeight: 22 }}>
              Choose a preset feed above or paste a custom RSS URL to get started.
            </Text>
          </Animated.View>
        )}

        {/* ── Loading Skeleton ─────────────────────────────────────────────── */}
        {loading && !refreshing && (
          <Animated.View entering={FadeIn.duration(200)}>
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </Animated.View>
        )}

        {/* ── Error State ──────────────────────────────────────────────────── */}
        {error && !loading && (
          <Animated.View
            entering={FadeInDown.duration(350)}
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: '#fef2f2',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#fee2e2',
            }}
          >
            <Ionicons name="alert-circle-outline" size={40} color={ERROR_COLOR} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: ERROR_COLOR, marginBottom: 6 }}>
              Failed to Load Feed
            </Text>
            <Text style={{ fontSize: 13, color: '#991b1b', textAlign: 'center', lineHeight: 19, marginBottom: 16 }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={handleRetry}
              style={{
                backgroundColor: ERROR_COLOR,
                borderRadius: 10,
                paddingHorizontal: 24,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Ionicons name="refresh-outline" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Feed Header ──────────────────────────────────────────────────── */}
        {feedData && !loading && (
          <Animated.View
            entering={FadeInDown.delay(0).duration(300)}
            style={{
              marginHorizontal: 16,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: TEXT_MAIN }} numberOfLines={1}>
                {feedData.title}
              </Text>
              {feedData.description ? (
                <Text style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }} numberOfLines={1}>
                  {stripHtml(feedData.description)}
                </Text>
              ) : null}
            </View>
            <View style={{
              backgroundColor: '#ede9fe',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginLeft: 10,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: PRIMARY }}>
                {feedData.items.length} articles
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Article Cards ─────────────────────────────────────────────────── */}
        {feedData && !loading && feedData.items.map((item, index) => (
          <ArticleCard key={`${item.link}-${index}`} item={item} index={index} />
        ))}

        {/* Bottom padding */}
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}
