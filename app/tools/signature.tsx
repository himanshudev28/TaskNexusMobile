import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#4f46e5';
const BG = '#f9fafb';
const SURFACE = '#fff';

const PEN_COLORS = [
  { id: 'black', value: '#111111', label: 'Black' },
  { id: 'blue', value: '#2563eb', label: 'Blue' },
  { id: 'red', value: '#dc2626', label: 'Red' },
  { id: 'green', value: '#16a34a', label: 'Green' },
  { id: 'purple', value: '#7c3aed', label: 'Purple' },
];

const PEN_SIZES = [
  { id: 'S', value: 2, label: 'S' },
  { id: 'M', value: 4, label: 'M' },
  { id: 'L', value: 8, label: 'L' },
];

const BACKGROUNDS = [
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'cream', label: 'Cream', color: '#fffde7' },
  { id: 'transparent', label: 'Clear', color: 'transparent' },
];

// ─── Text-to-Signature constants ──────────────────────────────────────────────

const TEXT_FONTS = [
  {
    id: 'dancing',
    label: 'Cursive',
    family: 'Dancing Script',
    googleParam: 'Dancing+Script:wght@700',
    weight: '700',
  },
  {
    id: 'vibes',
    label: 'Calligraphy',
    family: 'Great Vibes',
    googleParam: 'Great+Vibes',
    weight: '400',
  },
  {
    id: 'pinyon',
    label: 'Formal Script',
    family: 'Pinyon Script',
    googleParam: 'Pinyon+Script',
    weight: '400',
  },
  {
    id: 'pacifico',
    label: 'Elegant',
    family: 'Pacifico',
    googleParam: 'Pacifico',
    weight: '400',
  },
  {
    id: 'caveat',
    label: 'Bold Signature',
    family: 'Caveat',
    googleParam: 'Caveat:wght@700',
    weight: '700',
  },
  {
    id: 'sacramento',
    label: 'Simple',
    family: 'Sacramento',
    googleParam: 'Sacramento',
    weight: '400',
  },
];

const TEXT_COLORS = [
  { id: 'black', value: '#111111', label: 'Black' },
  { id: 'navy', value: '#0f172a', label: 'Navy' },
  { id: 'darkblue', value: '#1e3a8a', label: 'Dark Blue' },
  { id: 'darkgreen', value: '#14532d', label: 'Dark Green' },
  { id: 'darkred', value: '#7f1d1d', label: 'Dark Red' },
  { id: 'purple', value: '#4c1d95', label: 'Purple' },
];

const TEXT_SIZES = [
  { id: 'S', px: 36, label: 'S' },
  { id: 'M', px: 56, label: 'M' },
  { id: 'L', px: 76, label: 'L' },
];

const TEXT_BACKGROUNDS = [
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'cream', label: 'Cream', color: '#fffde7' },
  { id: 'transparent', label: 'Clear', color: 'transparent' },
];

const ROTATIONS = [
  { id: 'neg5', value: -5, label: '-5°' },
  { id: 'zero', value: 0, label: '0°' },
  { id: 'pos5', value: 5, label: '+5°' },
  { id: 'pos10', value: 10, label: '+10°' },
];

// ─── Draw WebView HTML ─────────────────────────────────────────────────────────

const buildDrawHtml = (penColor: string, penSize: number, bgId: string) => {
  const checkerboard =
    bgId === 'transparent'
      ? `
    background-image:
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    background-color: #fff;
  `
      : `background-color: ${bgId === 'cream' ? '#fffde7' : '#ffffff'};`;

  const canvasBg =
    bgId === 'transparent'
      ? 'rgba(0,0,0,0)'
      : bgId === 'cream'
      ? '#fffde7'
      : '#ffffff';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; touch-action: none; }
  html, body { width: 100%; height: 100%; overflow: hidden; ${checkerboard} }
  canvas { display: block; width: 100%; height: 100%; cursor: crosshair; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
(function() {
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  var penColor = ${JSON.stringify(penColor)};
  var penSize = ${penSize};
  var bgColor = ${JSON.stringify(canvasBg)};
  var paths = [];
  var currentPath = null;
  var drawing = false;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    redraw();
  }

  function redraw() {
    var dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    if (bgColor !== 'rgba(0,0,0,0)') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }
    paths.forEach(function(path) { drawPath(path); });
  }

  function drawPath(path) {
    if (!path || path.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var pts = path.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
    } else {
      for (var i = 1; i < pts.length - 1; i++) {
        var midX = (pts[i].x + pts[i + 1].x) / 2;
        var midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      var last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
  }

  function getPos(e) {
    var rect = canvas.getBoundingClientRect();
    var src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    var pos = getPos(e);
    currentPath = { color: penColor, size: penSize, points: [pos] };
  }

  function moveDraw(e) {
    e.preventDefault();
    if (!drawing || !currentPath) return;
    currentPath.points.push(getPos(e));
    redraw();
    drawPath(currentPath);
  }

  function endDraw(e) {
    if (!drawing || !currentPath) return;
    drawing = false;
    if (currentPath.points.length >= 1) paths.push(currentPath);
    currentPath = null;
    redraw();
  }

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', moveDraw, { passive: false });
  canvas.addEventListener('touchend', endDraw, { passive: false });
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  window.addEventListener('resize', resize);

  window.clearCanvas = function() { paths = []; currentPath = null; redraw(); };
  window.undoLast = function() { if (paths.length > 0) { paths.pop(); redraw(); } };
  window.updatePen = function(color, size) { penColor = color; penSize = size; };

  window.exportPng = function() {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.width / dpr;
    var h = canvas.height / dpr;
    var off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    var oc = off.getContext('2d');
    oc.scale(dpr, dpr);
    if (bgColor !== 'rgba(0,0,0,0)') {
      oc.fillStyle = bgColor;
      oc.fillRect(0, 0, w, h);
    }
    paths.forEach(function(path) {
      if (!path || path.points.length < 2) return;
      oc.beginPath();
      oc.strokeStyle = path.color;
      oc.lineWidth = path.size;
      oc.lineCap = 'round';
      oc.lineJoin = 'round';
      var pts = path.points;
      oc.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 2) {
        oc.lineTo(pts[1].x, pts[1].y);
      } else {
        for (var i = 1; i < pts.length - 1; i++) {
          var midX = (pts[i].x + pts[i + 1].x) / 2;
          var midY = (pts[i].y + pts[i + 1].y) / 2;
          oc.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        var last = pts[pts.length - 1];
        oc.lineTo(last.x, last.y);
      }
      oc.stroke();
    });
    var dataUrl = off.toDataURL('image/png');
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'export', data: dataUrl }));
  };

  setTimeout(resize, 50);
})();
</script>
</body>
</html>`;
};

// ─── Text-to-Signature WebView HTML ───────────────────────────────────────────

const buildTextHtml = (
  text: string,
  fontFamily: string,
  googleParam: string,
  fontWeight: string,
  color: string,
  sizePx: number,
  bgId: string,
  rotation: number
) => {
  const bgColor =
    bgId === 'cream' ? '#fffde7' : bgId === 'transparent' ? 'rgba(0,0,0,0)' : '#ffffff';

  const bodyBg =
    bgId === 'transparent'
      ? `background-image: linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0px;background-color:#fff;`
      : `background-color:${bgColor};`;

  const displayText = text.trim() || 'Your Signature';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  @import url('https://fonts.googleapis.com/css2?family=${googleParam}&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 100%; height: 100%; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    ${bodyBg}
  }
  #sig {
    font-family: '${fontFamily}', cursive;
    font-size: ${sizePx}px;
    font-weight: ${fontWeight};
    color: ${color};
    white-space: nowrap;
    transform: rotate(${rotation}deg);
    transform-origin: center center;
    padding: 20px 40px;
    user-select: none;
    -webkit-user-select: none;
    line-height: 1.2;
  }
</style>
</head>
<body>
<span id="sig">${displayText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
<script>
window.updateSignature = function(text, fontFamily, googleParam, fontWeight, color, sizePx, bgId, rotation) {
  var sig = document.getElementById('sig');
  sig.textContent = text.trim() || 'Your Signature';
  sig.style.fontFamily = "'" + fontFamily + "', cursive";
  sig.style.fontSize = sizePx + 'px';
  sig.style.fontWeight = fontWeight;
  sig.style.color = color;
  sig.style.transform = 'rotate(' + rotation + 'deg)';
};

window.exportPng = function() {
  // Use html2canvas approach via inline canvas rendering
  var sig = document.getElementById('sig');
  var rect = sig.getBoundingClientRect();
  var bodyW = document.body.clientWidth;
  var bodyH = document.body.clientHeight;
  var dpr = window.devicePixelRatio || 1;

  var canvas = document.createElement('canvas');
  canvas.width = bodyW * dpr;
  canvas.height = bodyH * dpr;
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  var bgId = ${JSON.stringify(bgId)};
  var bgColor = bgId === 'cream' ? '#fffde7' : bgId === 'transparent' ? null : '#ffffff';

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, bodyW, bodyH);
  }

  ctx.save();
  ctx.translate(bodyW / 2, bodyH / 2);
  ctx.rotate(${rotation} * Math.PI / 180);
  ctx.font = '${fontWeight} ' + ${sizePx} + 'px "${fontFamily}", cursive';
  ctx.fillStyle = ${JSON.stringify(color)};
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(${JSON.stringify(displayText)}, 0, 0);
  ctx.restore();

  var dataUrl = canvas.toDataURL('image/png');
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'export', data: dataUrl }));
};
</script>
</body>
</html>`;
};

// ─── Font Card Preview WebView HTML ───────────────────────────────────────────

const buildFontCardHtml = (
  text: string,
  fontFamily: string,
  googleParam: string,
  fontWeight: string,
  selected: boolean
) => {
  const displayText = text.trim() || 'Sign';
  const borderColor = selected ? '#4f46e5' : '#e5e7eb';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  @import url('https://fonts.googleapis.com/css2?family=${googleParam}&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body {
    width:100%; height:100%; overflow:hidden;
    display:flex; align-items:center; justify-content:center;
    background:#fff;
  }
  #t {
    font-family:'${fontFamily}',cursive;
    font-size:20px;
    font-weight:${fontWeight};
    color:#111;
    white-space:nowrap;
    user-select:none;
    -webkit-user-select:none;
  }
</style>
</head>
<body>
<span id="t">${displayText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
<script>
window.updateText = function(text) {
  document.getElementById('t').textContent = text.trim() || 'Sign';
};
</script>
</body>
</html>`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignatureScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<'draw' | 'text'>('draw');

  // ── Draw tab state ──
  const drawWebViewRef = useRef<WebView>(null);
  const [penColor, setPenColor] = useState('#111111');
  const [penSizeId, setPenSizeId] = useState('M');
  const [bgId, setBgId] = useState('white');

  // ── Text tab state ──
  const textWebViewRef = useRef<WebView>(null);
  const fontCardRefs = useRef<(WebView | null)[]>([]);
  const [sigText, setSigText] = useState('');
  const [selectedFontId, setSelectedFontId] = useState('dancing');
  const [textColorId, setTextColorId] = useState('black');
  const [textSizeId, setTextSizeId] = useState('M');
  const [textBgId, setTextBgId] = useState('white');
  const [rotationId, setRotationId] = useState('zero');

  // Common
  const [isSaving, setIsSaving] = useState(false);

  // ── Derived values ──
  const penSize = PEN_SIZES.find((s) => s.id === penSizeId)?.value ?? 4;
  const selectedFont = TEXT_FONTS.find((f) => f.id === selectedFontId) ?? TEXT_FONTS[0];
  const selectedTextColor = TEXT_COLORS.find((c) => c.id === textColorId)?.value ?? '#111111';
  const selectedTextSize = TEXT_SIZES.find((s) => s.id === textSizeId)?.px ?? 56;
  const selectedRotation = ROTATIONS.find((r) => r.id === rotationId)?.value ?? 0;

  // ── Draw tab handlers ──
  const injectDrawUpdate = useCallback(
    (color: string, size: number) => {
      drawWebViewRef.current?.injectJavaScript(
        `window.updatePen(${JSON.stringify(color)}, ${size}); true;`
      );
    },
    []
  );

  const handleColorChange = (color: string) => {
    setPenColor(color);
    Haptics.selectionAsync();
    injectDrawUpdate(color, penSize);
  };

  const handleSizeChange = (id: string) => {
    const size = PEN_SIZES.find((s) => s.id === id)?.value ?? 4;
    setPenSizeId(id);
    Haptics.selectionAsync();
    injectDrawUpdate(penColor, size);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    drawWebViewRef.current?.injectJavaScript('window.clearCanvas(); true;');
  };

  const handleUndo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    drawWebViewRef.current?.injectJavaScript('window.undoLast(); true;');
  };

  // ── Text tab handlers ──
  const injectTextUpdate = useCallback(
    (
      text: string,
      font: typeof TEXT_FONTS[0],
      color: string,
      sizePx: number,
      bgIdVal: string,
      rotation: number
    ) => {
      textWebViewRef.current?.injectJavaScript(
        `window.updateSignature(
          ${JSON.stringify(text)},
          ${JSON.stringify(font.family)},
          ${JSON.stringify(font.googleParam)},
          ${JSON.stringify(font.weight)},
          ${JSON.stringify(color)},
          ${sizePx},
          ${JSON.stringify(bgIdVal)},
          ${rotation}
        ); true;`
      );
    },
    []
  );

  const handleTextChange = (val: string) => {
    setSigText(val);
    // Update font card previews
    TEXT_FONTS.forEach((_, i) => {
      fontCardRefs.current[i]?.injectJavaScript(
        `window.updateText(${JSON.stringify(val)}); true;`
      );
    });
    injectTextUpdate(val, selectedFont, selectedTextColor, selectedTextSize, textBgId, selectedRotation);
  };

  const handleFontSelect = (fontId: string) => {
    setSelectedFontId(fontId);
    Haptics.selectionAsync();
    const font = TEXT_FONTS.find((f) => f.id === fontId) ?? TEXT_FONTS[0];
    injectTextUpdate(sigText, font, selectedTextColor, selectedTextSize, textBgId, selectedRotation);
  };

  const handleTextColorChange = (colorId: string) => {
    setTextColorId(colorId);
    Haptics.selectionAsync();
    const color = TEXT_COLORS.find((c) => c.id === colorId)?.value ?? '#111111';
    injectTextUpdate(sigText, selectedFont, color, selectedTextSize, textBgId, selectedRotation);
  };

  const handleTextSizeChange = (sizeId: string) => {
    setTextSizeId(sizeId);
    Haptics.selectionAsync();
    const sizePx = TEXT_SIZES.find((s) => s.id === sizeId)?.px ?? 56;
    injectTextUpdate(sigText, selectedFont, selectedTextColor, sizePx, textBgId, selectedRotation);
  };

  const handleTextBgChange = (bgIdVal: string) => {
    setTextBgId(bgIdVal);
    Haptics.selectionAsync();
    injectTextUpdate(sigText, selectedFont, selectedTextColor, selectedTextSize, bgIdVal, selectedRotation);
  };

  const handleRotationChange = (rotId: string) => {
    setRotationId(rotId);
    Haptics.selectionAsync();
    const rotation = ROTATIONS.find((r) => r.id === rotId)?.value ?? 0;
    injectTextUpdate(sigText, selectedFont, selectedTextColor, selectedTextSize, textBgId, rotation);
  };

  // ── Export / Save ──
  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeTab === 'draw') {
      drawWebViewRef.current?.injectJavaScript('window.exportPng(); true;');
    } else {
      textWebViewRef.current?.injectJavaScript('window.exportPng(); true;');
    }
  };

  const onMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type !== 'export') return;
      const base64 = msg.data.replace('data:image/png;base64,', '');
      await saveSignature(base64);
    } catch (e) {
      Alert.alert('Error', 'Could not process signature data.');
    }
  };

  const saveSignature = async (base64: string) => {
    setIsSaving(true);
    try {
      const filename = `signature_${Date.now()}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(fileUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', 'Signature saved to your photo library.');
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: 'Save Signature',
          });
        } else {
          Alert.alert(
            'Permission Denied',
            'Please grant photo library access to save the signature.'
          );
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save signature. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── HTML sources (memoised-ish via useMemo pattern inline) ──
  const drawHtml = buildDrawHtml(penColor, penSize, bgId);
  const textHtml = buildTextHtml(
    sigText,
    selectedFont.family,
    selectedFont.googleParam,
    selectedFont.weight,
    selectedTextColor,
    selectedTextSize,
    textBgId,
    selectedRotation
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG, paddingTop: insets.top }}>

      {/* ── Header ── */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(0)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: SURFACE,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        }}
      >
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#f3f4f6',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>
            Signature Maker
          </Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
            {activeTab === 'draw' ? 'Draw your signature below' : 'Type to generate a signature'}
          </Text>
        </View>
      </Animated.View>

      {/* ── Tab bar ── */}
      <Animated.View
        entering={FadeInDown.duration(300).delay(40)}
        style={{
          flexDirection: 'row',
          backgroundColor: SURFACE,
          marginHorizontal: 16,
          marginTop: 12,
          borderRadius: 12,
          padding: 4,
          borderWidth: 1,
          borderColor: '#e5e7eb',
        }}
      >
        {(['draw', 'text'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => { setActiveTab(tab); Haptics.selectionAsync(); }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 9,
              alignItems: 'center',
              backgroundColor: activeTab === tab ? PRIMARY : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: activeTab === tab ? '#fff' : '#6b7280',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'draw' ? 'Draw' : 'Text'}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ════════════════════ DRAW TAB ════════════════════ */}
      {activeTab === 'draw' && (
        <>
          {/* Canvas */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(60)}
            style={{
              flex: 1,
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 8,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: SURFACE,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}
          >
            <WebView
              ref={drawWebViewRef}
              originWhitelist={['*']}
              source={{ html: drawHtml }}
              scrollEnabled={false}
              bounces={false}
              onMessage={onMessage}
              style={{ flex: 1, backgroundColor: 'transparent' }}
              overScrollMode="never"
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              javaScriptEnabled
            />
          </Animated.View>

          {/* Draw Controls */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(120)}
            style={{
              backgroundColor: SURFACE,
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: insets.bottom + 14,
            }}
          >
            {/* Background selector */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', width: 40 }}>BG</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {BACKGROUNDS.map((bg) => (
                  <TouchableOpacity
                    key={bg.id}
                    onPress={() => { setBgId(bg.id); Haptics.selectionAsync(); }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: bgId === bg.id ? 2 : 1,
                      borderColor: bgId === bg.id ? PRIMARY : '#d1d5db',
                      backgroundColor: bgId === bg.id ? '#ede9fe' : '#f9fafb',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: bgId === bg.id ? PRIMARY : '#374151',
                      }}
                    >
                      {bg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pen color row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', width: 40 }}>PEN</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {PEN_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => handleColorChange(c.value)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: c.value,
                      borderWidth: penColor === c.value ? 3 : 1.5,
                      borderColor: penColor === c.value ? PRIMARY : '#d1d5db',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {penColor === c.value && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pen size row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6b7280', width: 40 }}>SIZE</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PEN_SIZES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => handleSizeChange(s.id)}
                    style={{
                      width: 44,
                      height: 36,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: penSizeId === s.id ? PRIMARY : '#f3f4f6',
                      borderWidth: 1,
                      borderColor: penSizeId === s.id ? PRIMARY : '#d1d5db',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: penSizeId === s.id ? '#fff' : '#374151',
                      }}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={handleUndo}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#d1d5db',
                  backgroundColor: '#f9fafb',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="arrow-undo" size={18} color="#374151" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>Undo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClear}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: '#fecaca',
                  backgroundColor: '#fff1f2',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#dc2626' }}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={{
                  flex: 1.4,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: isSaving ? '#a5b4fc' : PRIMARY,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Ionicons
                  name={isSaving ? 'hourglass-outline' : 'download-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  {isSaving ? 'Saving…' : 'Export PNG'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}

      {/* ════════════════════ TEXT TAB ════════════════════ */}
      {activeTab === 'text' && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Text input */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(0)}
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: SURFACE,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              paddingHorizontal: 14,
              paddingVertical: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <TextInput
              value={sigText}
              onChangeText={handleTextChange}
              placeholder="Enter your name or text"
              placeholderTextColor="#9ca3af"
              style={{
                fontSize: 16,
                color: '#111827',
                paddingVertical: 14,
                fontWeight: '500',
              }}
              returnKeyType="done"
              autoCorrect={false}
            />
          </Animated.View>

          {/* Font style grid (2 columns × 3 rows) */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(40)}
            style={{ marginHorizontal: 16, marginTop: 14 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 10, letterSpacing: 0.5 }}>
              FONT STYLE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {TEXT_FONTS.map((font, index) => {
                const isSelected = selectedFontId === font.id;
                return (
                  <TouchableOpacity
                    key={font.id}
                    onPress={() => handleFontSelect(font.id)}
                    activeOpacity={0.8}
                    style={{
                      width: '47%',
                      height: 72,
                      borderRadius: 12,
                      borderWidth: isSelected ? 2.5 : 1.5,
                      borderColor: isSelected ? PRIMARY : '#e5e7eb',
                      overflow: 'hidden',
                      backgroundColor: SURFACE,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isSelected ? 0.12 : 0.04,
                      shadowRadius: 4,
                      elevation: isSelected ? 3 : 1,
                    }}
                  >
                    {/* WebView renders the font preview */}
                    <WebView
                      ref={(ref) => { fontCardRefs.current[index] = ref; }}
                      originWhitelist={['*']}
                      source={{
                        html: buildFontCardHtml(
                          sigText,
                          font.family,
                          font.googleParam,
                          font.weight,
                          isSelected
                        ),
                      }}
                      scrollEnabled={false}
                      bounces={false}
                      pointerEvents="none"
                      style={{ flex: 1, backgroundColor: 'transparent' }}
                      overScrollMode="never"
                      showsVerticalScrollIndicator={false}
                      showsHorizontalScrollIndicator={false}
                      javaScriptEnabled
                    />
                    {/* Label overlay at bottom */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingVertical: 3,
                        paddingHorizontal: 8,
                        backgroundColor: isSelected ? PRIMARY : 'rgba(249,250,251,0.9)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '600',
                          color: isSelected ? '#fff' : '#6b7280',
                          textAlign: 'center',
                        }}
                      >
                        {font.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Color picker */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(80)}
            style={{
              marginHorizontal: 16,
              marginTop: 16,
              backgroundColor: SURFACE,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 12, letterSpacing: 0.5 }}>
              COLOR
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              {TEXT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => handleTextColorChange(c.id)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: c.value,
                    borderWidth: textColorId === c.id ? 3 : 1.5,
                    borderColor: textColorId === c.id ? PRIMARY : '#d1d5db',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {textColorId === c.id && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Size + Background row */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(100)}
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              flexDirection: 'row',
              gap: 10,
            }}
          >
            {/* Size */}
            <View
              style={{
                flex: 1,
                backgroundColor: SURFACE,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                padding: 14,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 12, letterSpacing: 0.5 }}>
                SIZE
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TEXT_SIZES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => handleTextSizeChange(s.id)}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: textSizeId === s.id ? PRIMARY : '#f3f4f6',
                      borderWidth: 1,
                      borderColor: textSizeId === s.id ? PRIMARY : '#d1d5db',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: textSizeId === s.id ? '#fff' : '#374151',
                      }}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Background */}
            <View
              style={{
                flex: 1,
                backgroundColor: SURFACE,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                padding: 14,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 12, letterSpacing: 0.5 }}>
                BACKGROUND
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {TEXT_BACKGROUNDS.map((bg) => (
                  <TouchableOpacity
                    key={bg.id}
                    onPress={() => handleTextBgChange(bg.id)}
                    style={{
                      flex: 1,
                      height: 36,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: textBgId === bg.id ? 2 : 1,
                      borderColor: textBgId === bg.id ? PRIMARY : '#d1d5db',
                      backgroundColor: textBgId === bg.id ? '#ede9fe' : '#f9fafb',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '600',
                        color: textBgId === bg.id ? PRIMARY : '#374151',
                      }}
                    >
                      {bg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Rotation */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(120)}
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: SURFACE,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', marginBottom: 12, letterSpacing: 0.5 }}>
              ROTATION
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {ROTATIONS.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => handleRotationChange(r.id)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: rotationId === r.id ? PRIMARY : '#f3f4f6',
                    borderWidth: 1,
                    borderColor: rotationId === r.id ? PRIMARY : '#d1d5db',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: rotationId === r.id ? '#fff' : '#374151',
                    }}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Signature preview */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(140)}
            style={{
              marginHorizontal: 16,
              marginTop: 14,
              height: 160,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: SURFACE,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 1.5,
              borderColor: '#e5e7eb',
            }}
          >
            <WebView
              ref={textWebViewRef}
              originWhitelist={['*']}
              source={{ html: textHtml }}
              scrollEnabled={false}
              bounces={false}
              onMessage={onMessage}
              style={{ flex: 1, backgroundColor: 'transparent' }}
              overScrollMode="never"
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              javaScriptEnabled
            />
          </Animated.View>

          {/* Export button */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(160)}
            style={{ marginHorizontal: 16, marginTop: 14 }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={{
                height: 50,
                borderRadius: 14,
                backgroundColor: isSaving ? '#a5b4fc' : PRIMARY,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: PRIMARY,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons
                name={isSaving ? 'hourglass-outline' : 'download-outline'}
                size={20}
                color="#fff"
              />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
                {isSaving ? 'Saving…' : 'Export PNG'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}
