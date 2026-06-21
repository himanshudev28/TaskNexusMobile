import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library/legacy';
import { File, Paths } from 'expo-file-system';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const API_KEY = 'sk_GslNCUqcrNHZue7sJwAnx7T49yns2iGU';
const BASE_URL = 'https://image.pollinations.ai/prompt';
const PRIMARY = '#4f46e5';
const PRIMARY_LIGHT = '#6366f1';
const PRIMARY_DIM = '#e0e7ff';
const BG = '#f9fafb';
const SURFACE = '#fff';
const BORDER = '#e5e7eb';
const TEXT = '#111827';
const TEXT_MUTED = '#6b7280';
const TEXT_LIGHT = '#9ca3af';
const CHIP_BG = '#f3f4f6';

const STYLE_PRESETS = [
  'Photorealistic',
  'Digital Art',
  'Oil Painting',
  'Anime',
  'Sketch',
  'Watercolor',
  '3D Render',
  'Pixel Art',
] as const;

type StylePreset = (typeof STYLE_PRESETS)[number];

const SIZE_OPTIONS = [
  { label: '512×512', w: 512, h: 512 },
  { label: '768×768', w: 768, h: 768 },
  { label: '1024×1024', w: 1024, h: 1024 },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  ts: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildImageUrl(
  prompt: string,
  negativePrompt: string,
  preset: StylePreset | null,
  w: number,
  h: number,
  seed: number,
): string {
  const parts: string[] = [];
  if (preset) parts.push(preset);
  parts.push(prompt.trim());
  if (negativePrompt.trim()) parts.push(`NOT ${negativePrompt.trim()}`);
  const encoded = encodeURIComponent(parts.join(', '));
  return `${BASE_URL}/${encoded}?width=${w}&height=${h}&model=flux&seed=${seed}&nologo=true&key=${API_KEY}`;
}

function mkSeed(): number {
  return Math.floor(Math.random() * 999999) + 1;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AiGenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Inputs
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNeg, setShowNeg] = useState(false);

  // Style & size
  const [preset, setPreset] = useState<StylePreset | null>(null);
  const [sizeIdx, setSizeIdx] = useState(0);

  // Seed
  const [useRandom, setUseRandom] = useState(true);
  const [fixedSeed, setFixedSeed] = useState('42');

  // Generation
  const [generating, setGenerating] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentLabel, setCurrentLabel] = useState('');

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Full-screen viewer
  const [viewerItem, setViewerItem] = useState<HistoryItem | null>(null);

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      Alert.alert('Empty Prompt', 'Please enter a description for your image.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const seed = useRandom ? mkSeed() : parseInt(fixedSeed, 10) || mkSeed();
    const size = SIZE_OPTIONS[sizeIdx];
    const url = buildImageUrl(prompt, negativePrompt, preset, size.w, size.h, seed);
    const label = [preset, prompt.trim()].filter(Boolean).join(' · ');
    setCurrentUrl(url);
    setCurrentLabel(label);
    setGenerating(true);
    setImgLoading(true);
    setImgError(false);
  }, [prompt, negativePrompt, preset, sizeIdx, useRandom, fixedSeed]);

  // ── Image callbacks ─────────────────────────────────────────────────────────

  const handleImageLoad = useCallback(() => {
    setImgLoading(false);
    setGenerating(false);
    if (currentUrl) {
      const item: HistoryItem = {
        id: String(Date.now()),
        url: currentUrl,
        prompt: currentLabel,
        ts: Date.now(),
      };
      setHistory((prev) => [item, ...prev].slice(0, 6));
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [currentUrl, currentLabel]);

  const handleImageError = useCallback(() => {
    setImgLoading(false);
    setGenerating(false);
    setImgError(true);
  }, []);

  // ── Download ────────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async (urlToSave: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to save images.');
      return;
    }
    try {
      const downloaded = await File.downloadFileAsync(urlToSave, Paths.cache);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Image saved to gallery.');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Save Failed', 'Could not save the image. Please try again.');
    }
  }, []);

  // ── Viewer ──────────────────────────────────────────────────────────────────

  const openViewer = useCallback((item: HistoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewerItem(item);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────

  const HIST_CELL = (SCREEN_W - 48) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" backgroundColor={SURFACE} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: SURFACE,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: PRIMARY_DIM,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={PRIMARY} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT }}>
              AI Image Generator
            </Text>
            <Text style={{ fontSize: 12, color: TEXT_LIGHT, marginTop: 1 }}>
              Powered by Flux via Pollinations
            </Text>
          </View>

          <View
            style={{
              backgroundColor: PRIMARY,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>FLUX</Text>
          </View>
        </View>
      </View>

      {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Main Image Preview ────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <View
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: '#1e1b4b',
                marginBottom: 20,
                borderWidth: 1,
                borderColor: BORDER,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Empty state */}
              {!currentUrl && (
                <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 32 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      backgroundColor: 'rgba(79,70,229,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="sparkles-outline" size={32} color={PRIMARY_LIGHT} />
                  </View>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 14,
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    Enter a prompt below and tap{' '}
                    <Text style={{ color: PRIMARY_LIGHT, fontWeight: '700' }}>Generate</Text>{' '}
                    to create your image
                  </Text>
                </View>
              )}

              {/* Image (invisible until loaded) */}
              {currentUrl && (
                <Image
                  source={{ uri: currentUrl }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: imgLoading || imgError ? 0 : 1,
                  }}
                  resizeMode="cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  accessible
                  accessibilityLabel={`Generated image: ${currentLabel}`}
                />
              )}

              {/* Loading overlay */}
              {imgLoading && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 14,
                  }}
                >
                  <ActivityIndicator size="large" color={PRIMARY_LIGHT} />
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' }}>
                    Generating your image…
                  </Text>
                </View>
              )}

              {/* Error overlay */}
              {imgError && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    paddingHorizontal: 24,
                  }}
                >
                  <Ionicons name="alert-circle-outline" size={40} color="#f87171" />
                  <Text
                    style={{
                      color: '#f87171',
                      fontSize: 14,
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    Generation failed. Check your prompt and try again.
                  </Text>
                  <TouchableOpacity
                    onPress={handleGenerate}
                    style={{
                      backgroundColor: PRIMARY,
                      borderRadius: 10,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Expand + Download buttons when image is shown */}
              {currentUrl && !imgLoading && !imgError && (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      openViewer({ id: 'current', url: currentUrl, prompt: currentLabel, ts: 0 })
                    }
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 54,
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel="View full screen"
                  >
                    <Ionicons name="expand-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDownload(currentUrl)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel="Download image"
                  >
                    <Ionicons name="download-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>

          {/* ── Prompt ───────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: TEXT_MUTED,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Prompt
            </Text>
            <View
              style={{
                backgroundColor: SURFACE,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: BORDER,
                paddingHorizontal: 14,
                marginBottom: 10,
              }}
            >
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="e.g. a futuristic city at sunset, cinematic lighting…"
                placeholderTextColor={TEXT_LIGHT}
                multiline
                numberOfLines={3}
                style={{
                  fontSize: 15,
                  color: TEXT,
                  minHeight: 76,
                  textAlignVertical: 'top',
                  paddingTop: 12,
                  paddingBottom: 12,
                  lineHeight: 22,
                }}
                accessible
                accessibilityLabel="Image prompt"
              />
            </View>
          </Animated.View>

          {/* ── Negative Prompt (collapsible) ────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(90).springify()}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setShowNeg((v) => !v);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginBottom: showNeg ? 8 : 18,
              }}
              accessibilityLabel={showNeg ? 'Hide negative prompt' : 'Show negative prompt'}
            >
              <Ionicons
                name={showNeg ? 'chevron-down' : 'chevron-forward'}
                size={15}
                color={PRIMARY}
              />
              <Text style={{ fontSize: 13, fontWeight: '600', color: PRIMARY }}>
                Negative Prompt
              </Text>
              <Text style={{ fontSize: 12, color: TEXT_LIGHT }}>(things to exclude)</Text>
            </TouchableOpacity>

            {showNeg && (
              <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: 18 }}>
                <View
                  style={{
                    backgroundColor: SURFACE,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: BORDER,
                    paddingHorizontal: 14,
                  }}
                >
                  <TextInput
                    value={negativePrompt}
                    onChangeText={setNegativePrompt}
                    placeholder="e.g. blurry, low quality, watermark, text, ugly…"
                    placeholderTextColor={TEXT_LIGHT}
                    multiline
                    numberOfLines={2}
                    style={{
                      fontSize: 15,
                      color: TEXT,
                      minHeight: 56,
                      textAlignVertical: 'top',
                      paddingTop: 12,
                      paddingBottom: 12,
                      lineHeight: 22,
                    }}
                    accessible
                    accessibilityLabel="Negative prompt"
                  />
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* ── Style Presets ────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(130).springify()}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: TEXT_MUTED,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Style Preset
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
              style={{ marginBottom: 20 }}
            >
              {/* None chip */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setPreset(null);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: preset === null ? PRIMARY : CHIP_BG,
                  borderWidth: 1.5,
                  borderColor: preset === null ? PRIMARY : 'transparent',
                }}
                accessibilityLabel="No style preset"
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: preset === null ? '#fff' : TEXT_MUTED,
                  }}
                >
                  None
                </Text>
              </TouchableOpacity>

              {STYLE_PRESETS.map((p) => {
                const active = preset === p;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPreset(active ? null : p);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: active ? PRIMARY : CHIP_BG,
                      borderWidth: 1.5,
                      borderColor: active ? PRIMARY : 'transparent',
                    }}
                    accessibilityLabel={`${p} style`}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: active ? '#fff' : TEXT_MUTED,
                      }}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* ── Image Size ───────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(170).springify()}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: TEXT_MUTED,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Image Size
            </Text>
            <View
              style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}
            >
              {SIZE_OPTIONS.map((sz, i) => {
                const active = sizeIdx === i;
                return (
                  <TouchableOpacity
                    key={sz.label}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSizeIdx(i);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: active ? PRIMARY : SURFACE,
                      borderWidth: 1.5,
                      borderColor: active ? PRIMARY : BORDER,
                      alignItems: 'center',
                    }}
                    accessibilityLabel={`Size ${sz.label}`}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: active ? '#fff' : TEXT,
                      }}
                    >
                      {sz.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Seed ─────────────────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(210).springify()}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: TEXT_MUTED,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Seed
            </Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: SURFACE,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: BORDER,
                overflow: 'hidden',
                marginBottom: useRandom ? 20 : 10,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setUseRandom(true);
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  backgroundColor: useRandom ? PRIMARY_DIM : SURFACE,
                  borderRightWidth: 1,
                  borderRightColor: BORDER,
                }}
                accessibilityLabel="Use random seed"
              >
                <Ionicons
                  name="shuffle-outline"
                  size={16}
                  color={useRandom ? PRIMARY : TEXT_MUTED}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: useRandom ? PRIMARY : TEXT_MUTED,
                  }}
                >
                  Random
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setUseRandom(false);
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  backgroundColor: !useRandom ? PRIMARY_DIM : SURFACE,
                }}
                accessibilityLabel="Use fixed seed"
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={!useRandom ? PRIMARY : TEXT_MUTED}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: !useRandom ? PRIMARY : TEXT_MUTED,
                  }}
                >
                  Fixed
                </Text>
              </TouchableOpacity>
            </View>

            {!useRandom && (
              <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: 20 }}>
                <View
                  style={{
                    backgroundColor: SURFACE,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: BORDER,
                    paddingHorizontal: 14,
                  }}
                >
                  <TextInput
                    value={fixedSeed}
                    onChangeText={setFixedSeed}
                    placeholder="Enter seed number…"
                    placeholderTextColor={TEXT_LIGHT}
                    keyboardType="number-pad"
                    style={{
                      fontSize: 15,
                      color: TEXT,
                      paddingVertical: 12,
                    }}
                    accessible
                    accessibilityLabel="Seed number"
                  />
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* ── Generate Button ──────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={generating}
              style={{
                backgroundColor: generating ? PRIMARY_LIGHT : PRIMARY,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
                marginBottom: 28,
                opacity: generating ? 0.85 : 1,
                shadowColor: PRIMARY,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
              accessibilityLabel="Generate image"
              accessibilityRole="button"
            >
              {generating ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                    Generating…
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                    Generate Image
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── History Grid ─────────────────────────────────────────────── */}
          {history.length > 0 && (
            <Animated.View entering={FadeInDown.springify()}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: TEXT_MUTED,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                Recent ({history.length})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {history.map((item, idx) => (
                  <Animated.View
                    key={item.id}
                    entering={ZoomIn.delay(idx * 60).springify()}
                  >
                    <TouchableOpacity
                      onPress={() => openViewer(item)}
                      style={{
                        width: HIST_CELL,
                        height: HIST_CELL,
                        borderRadius: 14,
                        overflow: 'hidden',
                        backgroundColor: '#1e1b4b',
                        borderWidth: 1,
                        borderColor: BORDER,
                      }}
                      accessibilityLabel={`History: ${item.prompt}`}
                    >
                      <Image
                        source={{ uri: item.url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        accessible
                        accessibilityLabel={item.prompt}
                      />
                      {/* Caption */}
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.55)',
                          paddingHorizontal: 8,
                          paddingVertical: 6,
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          style={{ color: '#fff', fontSize: 10, fontWeight: '500' }}
                        >
                          {item.prompt}
                        </Text>
                      </View>
                      {/* Download */}
                      <TouchableOpacity
                        onPress={() => handleDownload(item.url)}
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        accessibilityLabel="Download this image"
                      >
                        <Ionicons name="download-outline" size={14} color="#fff" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Full-Screen Viewer Modal ─────────────────────────────────────── */}
      <Modal
        visible={viewerItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerItem(null)}
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Controls row */}
          <View
            style={{
              position: 'absolute',
              top: insets.top + 12,
              left: 16,
              right: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              zIndex: 10,
            }}
          >
            {/* Download */}
            <TouchableOpacity
              onPress={() => {
                if (viewerItem) handleDownload(viewerItem.url);
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Download image"
            >
              <Ionicons name="download-outline" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity
              onPress={() => setViewerItem(null)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Close full screen"
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Image */}
          {viewerItem && (
            <Animated.View entering={FadeIn.springify()}>
              <Image
                source={{ uri: viewerItem.url }}
                style={{
                  width: SCREEN_W - 32,
                  height: SCREEN_W - 32,
                  borderRadius: 20,
                }}
                resizeMode="contain"
                accessible
                accessibilityLabel={viewerItem.prompt}
              />
            </Animated.View>
          )}

          {/* Prompt label */}
          {viewerItem?.prompt ? (
            <View
              style={{
                marginTop: 20,
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 14,
                maxWidth: SCREEN_W - 48,
              }}
            >
              <Text
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 13,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
                numberOfLines={3}
              >
                {viewerItem.prompt}
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
