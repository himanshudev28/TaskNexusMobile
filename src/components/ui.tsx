import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOW, RADIUS } from '../constants/theme';

// ── Animated Card ──────────────────────────────
export const Card = ({ children, style, delay = 0 }: any) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()}
    style={[{ backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, ...SHADOW.sm }, style]}>
    {children}
  </Animated.View>
);

// ── Pill Button ────────────────────────────────
export const PillButton = ({ label, onPress, icon, variant = 'primary', loading = false, style }: any) => {
  const bg = variant === 'primary' ? COLORS.primary
    : variant === 'danger' ? COLORS.danger
    : variant === 'success' ? COLORS.success
    : COLORS.surface2;
  const color = ['primary','danger','success'].includes(variant) ? '#fff' : COLORS.text2;
  const handlePress = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); };
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} disabled={loading}
      style={[{ backgroundColor: bg, borderRadius: RADIUS.full, paddingHorizontal: 20, paddingVertical: 13,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...SHADOW.sm }, style]}>
      {loading ? <ActivityIndicator size="small" color={color} />
        : <><Text style={{ color, fontWeight: '700', fontSize: 15 }}>{icon ? `${icon} ` : ''}{label}</Text></>}
    </TouchableOpacity>
  );
};

// ── Icon Button ────────────────────────────────
export const IconBtn = ({ icon, onPress, bg = COLORS.surface2, color = COLORS.text2, size = 44 }: any) => (
  <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onPress?.(); }} activeOpacity={0.7}
    style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg,
      justifyContent: 'center', alignItems: 'center', ...SHADOW.sm }}>
    <Text style={{ fontSize: size * 0.4, color }}>{icon}</Text>
  </TouchableOpacity>
);

// ── Section Header ─────────────────────────────
export const SectionHeader = ({ title, subtitle }: any) => (
  <Animated.View entering={FadeInDown.delay(50).springify()} style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 }}>{title}</Text>
    {subtitle && <Text style={{ fontSize: 13, color: COLORS.text4, marginTop: 4 }}>{subtitle}</Text>}
  </Animated.View>
);

// ── Empty State ────────────────────────────────
export const EmptyState = ({ icon, title, desc }: any) => (
  <Animated.View entering={FadeIn.delay(100)} style={{ alignItems: 'center', paddingVertical: 80 }}>
    <Text style={{ fontSize: 56 }}>{icon}</Text>
    <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text3, marginTop: 16 }}>{title}</Text>
    {desc && <Text style={{ fontSize: 13, color: COLORS.text4, marginTop: 6, textAlign: 'center' }}>{desc}</Text>}
  </Animated.View>
);

// ── Gradient Header ────────────────────────────
export const GradientHeader = ({ children, colors = [COLORS.primary, COLORS.secondary] }: any) => (
  <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    style={{ padding: 20, paddingBottom: 24 }}>
    {children}
  </LinearGradient>
);

// ── Badge ──────────────────────────────────────
export const Badge = ({ label, color = COLORS.primary }: any) => (
  <View style={{ backgroundColor: color + '22', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 }}>
    <Text style={{ fontSize: 11, fontWeight: '700', color }}>{label}</Text>
  </View>
);

// ── Animated List Item ─────────────────────────
export const ListItem = ({ children, index = 0, style }: any) => (
  <Animated.View entering={FadeInDown.delay(index * 50).springify()}
    style={[{ backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginBottom: 10, ...SHADOW.sm }, style]}>
    {children}
  </Animated.View>
);
