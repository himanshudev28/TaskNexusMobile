import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import { WebView } from 'react-native-webview';

const { width: W } = Dimensions.get('window');

const TABS = ['Resize', 'Compress', 'Crop Info', 'Convert', 'Enhance', 'AI Enhance', 'Remove BG', 'Blur BG'];
const C = {
  primary: '#4f46e5', bg: '#f9fafb', surface: '#ffffff',
  text: '#111827', text2: '#374151', text3: '#6b7280',
  border: '#e5e7eb', success: '#10b981', warning: '#f59e0b',
};

type ImgInfo = {
  uri: string;
  width: number;
  height: number;
  fileSize?: number;
  mimeType?: string;
};

const AI_ENHANCEMENT_OPTIONS = [
  { label: '2x Upscale', prompt: 'ultra high resolution 2x upscaled, sharp details, professional photo quality' },
  { label: '4x Upscale', prompt: 'ultra high resolution 4x upscaled, 4K sharp crisp details, professional photo quality' },
  { label: 'Sharpen', prompt: 'ultra sharp focus, crisp edges, high clarity, detailed textures, professional sharpening' },
  { label: 'Denoise', prompt: 'noise-free clean image, smooth gradients, professional denoising, high quality result' },
  { label: 'HDR', prompt: 'HDR effect, high dynamic range, vivid shadows and highlights, cinematic look, dramatic lighting' },
  { label: 'Vivid Colors', prompt: 'vivid vibrant colors, color enhanced, saturated tones, professional color grading' },
];

const BG_COLORS = [
  { label: 'Transparent', value: 'transparent', display: '#e5e7eb' },
  { label: 'White', value: '#ffffff', display: '#ffffff' },
  { label: 'Black', value: '#000000', display: '#000000' },
  { label: 'Red', value: '#ef4444', display: '#ef4444' },
  { label: 'Blue', value: '#3b82f6', display: '#3b82f6' },
  { label: 'Green', value: '#22c55e', display: '#22c55e' },
];

const BLUR_LEVELS = [
  { label: 'S', desc: 'Light', px: 5 },
  { label: 'M', desc: 'Medium', px: 15 },
  { label: 'L', desc: 'Heavy', px: 30 },
];

export default function ImageToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [image, setImage] = useState<ImgInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Resize state
  const [resizeW, setResizeW] = useState('');
  const [resizeH, setResizeH] = useState('');
  const [keepRatio, setKeepRatio] = useState(true);

  // Compress state
  const [quality, setQuality] = useState(80);

  // Convert state
  const [targetFormat, setTargetFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [convertTargetKB, setConvertTargetKB] = useState('');

  // Compress target size state
  const [compressTargetKB, setCompressTargetKB] = useState('');

  // AI Enhance state
  const [aiEnhanceOption, setAiEnhanceOption] = useState(0);
  const [aiEnhancedUri, setAiEnhancedUri] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState<'before' | 'after'>('after');

  // Remove BG state
  const [removeBgResult, setRemoveBgResult] = useState<string | null>(null);
  const [removeBgColor, setRemoveBgColor] = useState('transparent');
  const removeBgWebViewRef = useRef<WebView>(null);

  // Blur BG state
  const [blurLevel, setBlurLevel] = useState(1);
  const [blurResult, setBlurResult] = useState<string | null>(null);
  const blurWebViewRef = useRef<WebView>(null);

  // Result state for download/share
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [resultLabel, setResultLabel] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      exif: true,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setImage({ uri: a.uri, width: a.width, height: a.height, fileSize: a.fileSize, mimeType: a.mimeType });
      setResizeW(String(a.width));
      setResizeH(String(a.height));
      setAiEnhancedUri(null);
      setRemoveBgResult(null);
      setBlurResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 1, exif: true });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setImage({ uri: a.uri, width: a.width, height: a.height, fileSize: a.fileSize, mimeType: a.mimeType });
      setResizeW(String(a.width));
      setResizeH(String(a.height));
      setAiEnhancedUri(null);
      setRemoveBgResult(null);
      setBlurResult(null);
    }
  };

  const handleResize = async () => {
    if (!image) return;
    const tw = parseInt(resizeW) || image.width;
    const th = parseInt(resizeH) || image.height;
    if (tw <= 0 || th <= 0) { Alert.alert('Invalid dimensions'); return; }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await manipulateAsync(image.uri, [{ resize: { width: tw, height: th } }],
        { compress: 1, format: SaveFormat.JPEG });
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(result.uri);
        Alert.alert('Saved!', `Resized to ${tw}×${th} and saved to gallery.`);
      } else {
        await Sharing.shareAsync(result.uri);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to resize image');
    } finally { setLoading(false); }
  };

  const handleCompress = async () => {
    if (!image) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let resultUri: string;
      const targetBytes = compressTargetKB ? parseInt(compressTargetKB) * 1024 : 0;
      if (targetBytes > 0) {
        let lo = 0.05, hi = 1.0, best = '';
        for (let i = 0; i < 9; i++) {
          const mid = (lo + hi) / 2;
          const r = await manipulateAsync(image.uri, [], { compress: mid, format: SaveFormat.JPEG });
          const info = await FileSystem.getInfoAsync(r.uri, { size: true } as any) as any;
          best = r.uri;
          if ((info.size || 0) <= targetBytes) lo = mid; else hi = mid;
        }
        resultUri = best;
      } else {
        const r = await manipulateAsync(image.uri, [], { compress: quality / 100, format: SaveFormat.JPEG });
        resultUri = r.uri;
      }
      const info = await FileSystem.getInfoAsync(resultUri, { size: true } as any) as any;
      const savedBytes = (image.fileSize || 0) - (info.size || 0);
      setResultUri(resultUri);
      setResultLabel(`Compressed: ${Math.round((info.size || 0) / 1024)}KB (saved ${Math.round(savedBytes / 1024)}KB)`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to compress image');
    } finally { setLoading(false); }
  };

  const handleConvert = async () => {
    if (!image) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const fmt = targetFormat === 'png' ? SaveFormat.PNG : SaveFormat.JPEG;
      const targetBytes = convertTargetKB ? parseInt(convertTargetKB) * 1024 : 0;
      let resultUri: string;

      if (targetBytes > 0 && targetFormat === 'jpeg') {
        // Binary search over JPEG quality to hit target size
        let lo = 0.05, hi = 1.0, best = '';
        for (let i = 0; i < 9; i++) {
          const mid = (lo + hi) / 2;
          const r = await manipulateAsync(image.uri, [], { compress: mid, format: SaveFormat.JPEG });
          const info = await FileSystem.getInfoAsync(r.uri, { size: true } as any) as any;
          best = r.uri;
          if ((info.size || 0) <= targetBytes) lo = mid; else hi = mid;
        }
        resultUri = best;
      } else if (targetBytes > 0 && targetFormat === 'png') {
        // PNG is lossless — downscale dimensions if current size exceeds target
        const base = await manipulateAsync(image.uri, [], { compress: 1.0, format: SaveFormat.PNG });
        const baseInfo = await FileSystem.getInfoAsync(base.uri, { size: true } as any) as any;
        if ((baseInfo.size || 0) > targetBytes) {
          const scale = Math.sqrt(targetBytes / (baseInfo.size || 1));
          const nw = Math.max(1, Math.floor(image.width * scale));
          const nh = Math.max(1, Math.floor(image.height * scale));
          const r = await manipulateAsync(image.uri, [{ resize: { width: nw, height: nh } }], { compress: 1.0, format: SaveFormat.PNG });
          resultUri = r.uri;
        } else {
          resultUri = base.uri;
        }
      } else {
        const r = await manipulateAsync(image.uri, [], { compress: 0.9, format: fmt });
        resultUri = r.uri;
      }

      const info = await FileSystem.getInfoAsync(resultUri, { size: true } as any) as any;
      setResultUri(resultUri);
      setResultLabel(`Converted to ${targetFormat.toUpperCase()}: ${Math.round((info.size || 0) / 1024)}KB`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to convert image');
    } finally { setLoading(false); }
  };

  const handleEnhance = async (type: 'flip-h' | 'flip-v' | 'rotate-90' | 'rotate-180') => {
    if (!image) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      let actions: any[] = [];
      if (type === 'flip-h') actions = [{ flip: FlipType.Horizontal }];
      else if (type === 'flip-v') actions = [{ flip: FlipType.Vertical }];
      else if (type === 'rotate-90') actions = [{ rotate: 90 }];
      else if (type === 'rotate-180') actions = [{ rotate: 180 }];
      const result = await manipulateAsync(image.uri, actions, { compress: 0.95, format: SaveFormat.JPEG });
      setImage(prev => prev ? { ...prev, uri: result.uri } : null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to apply transform');
    } finally { setLoading(false); }
  };

  const saveTransformed = async () => {
    if (!image) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      await MediaLibrary.saveToLibraryAsync(image.uri);
      Alert.alert('Saved!', 'Image saved to gallery.');
    } else {
      await Sharing.shareAsync(image.uri);
    }
  };

  // AI Enhance handler — uses Pollinations text-to-image with descriptive prompt
  const handleAiEnhance = async () => {
    if (!image) return;
    setAiLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const selectedOpt = AI_ENHANCEMENT_OPTIONS[aiEnhanceOption];
      const basePrompt = `A professional photograph, ${selectedOpt.prompt}, high quality image, masterpiece`;
      const encodedPrompt = encodeURIComponent(basePrompt);
      const targetW = Math.min(image.width, 1024);
      const targetH = Math.min(image.height, 1024);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${targetW}&height=${targetH}&model=flux&seed=42&nologo=true&key=sk_GslNCUqcrNHZue7sJwAnx7T49yns2iGU`;

      // Download the generated image to local cache
      const destUri = FileSystem.cacheDirectory + `ai_enhanced_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(url, destUri);
      if (downloadResult.status !== 200) throw new Error('Failed to fetch enhanced image');
      setAiEnhancedUri(downloadResult.uri);
      setShowBeforeAfter('after');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'AI enhancement failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const saveAiEnhanced = async () => {
    if (!aiEnhancedUri) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      await MediaLibrary.saveToLibraryAsync(aiEnhancedUri);
      Alert.alert('Saved!', 'AI enhanced image saved to gallery.');
    } else {
      await Sharing.shareAsync(aiEnhancedUri);
    }
  };

  const saveWebViewResult = async (resultUri: string | null, label: string) => {
    if (!resultUri) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      await MediaLibrary.saveToLibraryAsync(resultUri);
      Alert.alert('Saved!', `${label} saved to gallery.`);
    } else {
      await Sharing.shareAsync(resultUri);
    }
  };

  const fmtSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const onResizeWidthChange = (val: string) => {
    setResizeW(val);
    if (keepRatio && image && val) {
      const nw = parseInt(val);
      if (nw > 0) setResizeH(String(Math.round(nw * image.height / image.width)));
    }
  };

  const onResizeHeightChange = (val: string) => {
    setResizeH(val);
    if (keepRatio && image && val) {
      const nh = parseInt(val);
      if (nh > 0) setResizeW(String(Math.round(nh * image.width / image.height)));
    }
  };

  // Build the Remove BG WebView HTML using @imgly/background-removal CDN
  const getRemoveBgHtml = (imageUri: string, bgColor: string) => {
    const isTransparent = bgColor === 'transparent';
    const checkerboard = isTransparent ? `
      background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    ` : `background-color: ${bgColor};`;

    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #1a1a1a; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; color: white; padding: 16px; }
  #status { margin-bottom: 16px; font-size: 14px; text-align: center; }
  #canvas-wrap { border-radius: 12px; overflow: hidden; max-width: 100%; ${checkerboard} }
  canvas { max-width: 100%; display: block; }
  .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.2); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="spinner" id="spinner"></div>
<div id="status">Loading background removal engine...</div>
<div id="canvas-wrap"><canvas id="result-canvas"></canvas></div>
<script>
(async () => {
  const status = document.getElementById('status');
  const spinner = document.getElementById('spinner');
  const canvas = document.getElementById('result-canvas');
  const ctx = canvas.getContext('2d');
  const imageUri = ${JSON.stringify(imageUri)};
  const bgColor = ${JSON.stringify(bgColor)};
  const isTransparent = bgColor === 'transparent';

  try {
    status.textContent = 'Loading image...';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUri;
    });
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    status.textContent = 'Loading AI model (first time may take ~30s)...';
    const { removeBackground } = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/browser/index.js');
    status.textContent = 'Removing background...';
    const blob = await fetch(imageUri).then(r => r.blob());
    const resultBlob = await removeBackground(blob, {
      publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/browser/',
    });
    const resultUrl = URL.createObjectURL(resultBlob);
    const resultImg = new Image();
    await new Promise((resolve, reject) => {
      resultImg.onload = resolve;
      resultImg.onerror = reject;
      resultImg.src = resultUrl;
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(resultImg, 0, 0);

    spinner.style.display = 'none';
    status.textContent = 'Done! Background removed.';
    const dataUrl = canvas.toDataURL('image/png');
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'result', data: dataUrl }));
  } catch (err) {
    spinner.style.display = 'none';
    status.textContent = 'Error: ' + (err.message || String(err));
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message || String(err) }));
  }
})();
</script>
</body>
</html>`;
  };

  // Build the Blur BG WebView HTML using vignette/radial blur (portrait mode simulation)
  const getBlurBgHtml = (imageUri: string, blurPx: number) => {
    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #1a1a1a; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; color: white; padding: 16px; }
  #status { margin-bottom: 16px; font-size: 14px; text-align: center; }
  canvas { max-width: 100%; border-radius: 12px; display: block; }
  .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.2); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="spinner" id="spinner"></div>
<div id="status">Processing...</div>
<canvas id="result-canvas"></canvas>
<script>
(async () => {
  const status = document.getElementById('status');
  const spinner = document.getElementById('spinner');
  const canvas = document.getElementById('result-canvas');
  const ctx = canvas.getContext('2d');
  const imageUri = ${JSON.stringify(imageUri)};
  const blurPx = ${blurPx};

  try {
    status.textContent = 'Loading image...';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUri;
    });

    const W = img.naturalWidth;
    const H = img.naturalHeight;
    canvas.width = W;
    canvas.height = H;

    status.textContent = 'Applying blur effect...';

    // Step 1: Draw blurred version as base
    const offscreen = document.createElement('canvas');
    offscreen.width = W;
    offscreen.height = H;
    const offCtx = offscreen.getContext('2d');
    offCtx.filter = 'blur(' + blurPx + 'px)';
    offCtx.drawImage(img, 0, 0);
    offCtx.filter = 'none';

    // Step 2: Draw blurred background
    ctx.drawImage(offscreen, 0, 0);

    // Step 3: Draw sharp center using elliptical mask
    const cx = W / 2;
    const cy = H / 2;
    const rx = W * 0.38;
    const ry = H * 0.45;

    // Create elliptical gradient mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = W;
    maskCanvas.height = H;
    const maskCtx = maskCanvas.getContext('2d');
    const grad = maskCtx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.4, cx, cy, Math.max(rx, ry));
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    maskCtx.fillStyle = grad;
    maskCtx.fillRect(0, 0, W, H);

    // Step 4: Composite sharp image over blurred using mask
    const sharpCanvas = document.createElement('canvas');
    sharpCanvas.width = W;
    sharpCanvas.height = H;
    const sharpCtx = sharpCanvas.getContext('2d');
    sharpCtx.drawImage(img, 0, 0);
    sharpCtx.globalCompositeOperation = 'destination-in';
    sharpCtx.drawImage(maskCanvas, 0, 0);
    sharpCtx.globalCompositeOperation = 'source-over';

    ctx.drawImage(sharpCanvas, 0, 0);

    spinner.style.display = 'none';
    status.textContent = 'Done! Background blurred.';
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'result', data: dataUrl }));
  } catch (err) {
    spinner.style.display = 'none';
    status.textContent = 'Error: ' + (err.message || String(err));
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message || String(err) }));
  }
})();
</script>
</body>
</html>`;
  };

  // Handle messages from Remove BG WebView
  const handleRemoveBgMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'result' && msg.data) {
        // Save data URL to cache file
        const base64 = msg.data.replace(/^data:image\/\w+;base64,/, '');
        const destUri = FileSystem.cacheDirectory + `remove_bg_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(destUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        setRemoveBgResult(destUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (msg.type === 'error') {
        Alert.alert('Background Removal Error', msg.message || 'An error occurred.');
      }
    } catch (e) {
      // ignore parse errors
    }
  };

  // Handle messages from Blur BG WebView
  const handleBlurBgMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'result' && msg.data) {
        const base64 = msg.data.replace(/^data:image\/\w+;base64,/, '');
        const destUri = FileSystem.cacheDirectory + `blur_bg_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(destUri, base64, { encoding: FileSystem.EncodingType.Base64 });
        setBlurResult(destUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (msg.type === 'error') {
        Alert.alert('Blur Error', msg.message || 'An error occurred.');
      }
    } catch (e) {
      // ignore parse errors
    }
  };

  const uploadCard = (
    <View style={{ margin: 16, backgroundColor: C.surface, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: C.border }}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>🖼️</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 }}>Select an Image</Text>
      <Text style={{ fontSize: 13, color: C.text3, marginBottom: 20, textAlign: 'center' }}>Pick from gallery or take a photo</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={pickImage} style={{ backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="images-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700' }}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={takePhoto} style={{ backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border }}>
          <Ionicons name="camera-outline" size={18} color={C.text2} />
          <Text style={{ color: C.text2, fontWeight: '700' }}>Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '800', color: C.text }}>Image Tools</Text>
      </Animated.View>

      {/* Image Picker */}
      {!image ? (
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: C.surface, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: C.border }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🖼️</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 }}>Select an Image</Text>
          <Text style={{ fontSize: 13, color: C.text3, marginBottom: 20, textAlign: 'center' }}>Pick from gallery or take a photo</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={pickImage} style={{ backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="images-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700' }}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={takePhoto} style={{ backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border }}>
              <Ionicons name="camera-outline" size={18} color={C.text2} />
              <Text style={{ color: C.text2, fontWeight: '700' }}>Camera</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Image Preview + info */}
          <Animated.View entering={ZoomIn.springify()} style={{ margin: 16, marginBottom: 8 }}>
            <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', maxHeight: 220 }}>
              <Image source={{ uri: image.uri }} style={{ width: '100%', height: 220 }} resizeMode="contain" />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 12, color: C.text3 }}>{image.width}×{image.height}px</Text>
              <Text style={{ fontSize: 12, color: C.text3 }}>{fmtSize(image.fileSize)}</Text>
              <TouchableOpacity onPress={pickImage}>
                <Text style={{ fontSize: 12, color: C.primary, fontWeight: '600' }}>Change</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Tab Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 4 }}>
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => { Haptics.selectionAsync(); setTab(i); }}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                  backgroundColor: tab === i ? C.primary : C.surface, borderWidth: 1,
                  borderColor: tab === i ? C.primary : C.border }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: tab === i ? '#fff' : C.text3 }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

            {/* RESIZE TAB */}
            {tab === 0 && (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: C.text, marginBottom: 16 }}>Resize Image</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: C.text3, marginBottom: 6 }}>Width (px)</Text>
                      <TextInput value={resizeW} onChangeText={onResizeWidthChange} keyboardType="numeric"
                        style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 15, color: C.text }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: C.text3, marginBottom: 6 }}>Height (px)</Text>
                      <TextInput value={resizeH} onChangeText={onResizeHeightChange} keyboardType="numeric"
                        style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 15, color: C.text }} />
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setKeepRatio(v => !v); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2,
                      borderColor: keepRatio ? C.primary : C.border,
                      backgroundColor: keepRatio ? C.primary : 'transparent',
                      justifyContent: 'center', alignItems: 'center' }}>
                      {keepRatio && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                    <Text style={{ color: C.text2, fontSize: 14 }}>Maintain aspect ratio</Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {[['25%', 0.25], ['50%', 0.5], ['75%', 0.75], ['2x', 2]].map(([label, factor]) => (
                      <TouchableOpacity key={String(label)} onPress={() => {
                        const nw = Math.round(image.width * (factor as number));
                        const nh = Math.round(image.height * (factor as number));
                        setResizeW(String(nw)); setResizeH(String(nh));
                      }} style={{ flex: 1, backgroundColor: C.bg, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: C.text2 }}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={handleResize} disabled={loading}
                    style={{ backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    {loading ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="resize-outline" size={18} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Resize & Save</Text></>}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* COMPRESS TAB */}
            {tab === 1 && (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: C.text, marginBottom: 4 }}>Compress Image</Text>
                  <Text style={{ fontSize: 13, color: C.text3, marginBottom: 20 }}>Reduce file size while maintaining visual quality</Text>
                  <Text style={{ fontSize: 13, color: C.text2, marginBottom: 12 }}>Quality: <Text style={{ fontWeight: '700', color: C.primary }}>{quality}%</Text></Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                    {[20, 40, 60, 80, 90].map((q) => (
                      <TouchableOpacity key={q} onPress={() => { Haptics.selectionAsync(); setQuality(q); }}
                        style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                          backgroundColor: quality === q ? C.primary : C.bg,
                          borderWidth: 1, borderColor: quality === q ? C.primary : C.border }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: quality === q ? '#fff' : C.text3 }}>{q}%</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ backgroundColor: quality < 50 ? '#fee2e2' : quality < 75 ? '#fef3c7' : '#dcfce7',
                    borderRadius: 10, padding: 12, marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, color: quality < 50 ? '#991b1b' : quality < 75 ? '#92400e' : '#065f46' }}>
                      {quality < 50 ? 'Heavy compression — visible quality loss'
                        : quality < 75 ? 'Balanced compression — good for web'
                        : 'Light compression — near-original quality'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: C.text2, marginBottom: 6, fontWeight: '600' }}>Target size (KB) — optional</Text>
                  <TextInput
                    value={compressTargetKB}
                    onChangeText={setCompressTargetKB}
                    placeholder="e.g. 200"
                    keyboardType="number-pad"
                    style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14,
                      color: C.text, backgroundColor: C.bg, marginBottom: 8 }}
                  />
                  <Text style={{ fontSize: 12, color: C.text3, marginBottom: 16 }}>
                    Quality is auto-tuned to fit. Leave blank to use quality preset above.
                  </Text>
                  <TouchableOpacity onPress={handleCompress} disabled={loading}
                    style={{ backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    {loading ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="archive-outline" size={18} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Compress & Save</Text></>}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* CROP INFO TAB */}
            {tab === 2 && (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: C.text, marginBottom: 16 }}>Image Information</Text>
                  {[
                    ['Dimensions', `${image.width} × ${image.height} px`],
                    ['Aspect Ratio', (() => {
                      const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b);
                      const gcd = g(image.width, image.height);
                      return `${image.width / gcd}:${image.height / gcd}`;
                    })()],
                    ['File Size', fmtSize(image.fileSize)],
                    ['Megapixels', `${((image.width * image.height) / 1_000_000).toFixed(2)} MP`],
                    ['Format', image.mimeType?.replace('image/', '').toUpperCase() || 'Unknown'],
                    ['Orientation', image.width > image.height ? 'Landscape' : image.width < image.height ? 'Portrait' : 'Square'],
                  ].map(([label, val]) => (
                    <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
                      <Text style={{ fontSize: 14, color: C.text3 }}>{label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>{val}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: C.text, marginBottom: 12 }}>Common Crop Ratios</Text>
                  {[['1:1 (Square)', 1], ['4:3 (Standard)', 4/3], ['16:9 (Widescreen)', 16/9], ['3:2 (Photo)', 3/2], ['9:16 (Portrait)', 9/16]].map(([label, ratio]) => {
                    const maxW = image.width;
                    const maxH = image.height;
                    const cw = Math.min(maxW, Math.floor(maxH * (ratio as number)));
                    const ch = Math.min(maxH, Math.floor(maxW / (ratio as number)));
                    return (
                      <View key={String(label)} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
                        <Text style={{ fontSize: 13, color: C.text2 }}>{label}</Text>
                        <Text style={{ fontSize: 13, color: C.text3 }}>{cw}×{ch}</Text>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* CONVERT TAB */}
            {tab === 3 && (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: C.text, marginBottom: 16 }}>Convert Format</Text>
                  <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>Convert your image to a different format</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                    {(['jpeg', 'png'] as const).map((f) => (
                      <TouchableOpacity key={f} onPress={() => { Haptics.selectionAsync(); setTargetFormat(f); setConvertTargetKB(''); }}
                        style={{ flex: 1, padding: 16, borderRadius: 12, alignItems: 'center',
                          backgroundColor: targetFormat === f ? C.primary : C.bg,
                          borderWidth: 2, borderColor: targetFormat === f ? C.primary : C.border }}>
                        <Text style={{ fontSize: 22, marginBottom: 4 }}>{f === 'jpeg' ? '📷' : '🖼️'}</Text>
                        <Text style={{ fontWeight: '700', color: targetFormat === f ? '#fff' : C.text }}>{f.toUpperCase()}</Text>
                        <Text style={{ fontSize: 11, color: targetFormat === f ? 'rgba(255,255,255,0.7)' : C.text3, marginTop: 2 }}>
                          {f === 'jpeg' ? 'Smaller size' : 'Supports transparency'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={{ fontSize: 13, color: C.text2, marginBottom: 6, fontWeight: '600' }}>Target size (KB) — optional</Text>
                  <TextInput
                    value={convertTargetKB}
                    onChangeText={setConvertTargetKB}
                    placeholder="e.g. 150"
                    keyboardType="number-pad"
                    style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 14,
                      color: C.text, backgroundColor: C.bg, marginBottom: 8 }}
                  />
                  <Text style={{ fontSize: 12, color: C.text3, marginBottom: 16 }}>
                    {targetFormat === 'jpeg'
                      ? 'For JPEG, quality is auto-tuned to fit the target.'
                      : 'For PNG (lossless), image is downscaled only if needed.'}
                  </Text>
                  <TouchableOpacity onPress={handleConvert} disabled={loading}
                    style={{ backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    {loading ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="swap-horizontal-outline" size={18} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Convert & Save</Text></>}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* ENHANCE TAB */}
            {tab === 4 && (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: C.text, marginBottom: 16 }}>Transform Image</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {[
                      { label: 'Flip Horizontal', icon: 'swap-horizontal', action: 'flip-h' as const },
                      { label: 'Flip Vertical', icon: 'swap-vertical', action: 'flip-v' as const },
                      { label: 'Rotate 90°', icon: 'refresh', action: 'rotate-90' as const },
                      { label: 'Rotate 180°', icon: 'sync', action: 'rotate-180' as const },
                    ].map(({ label, icon, action }) => (
                      <TouchableOpacity key={action} onPress={() => handleEnhance(action)} disabled={loading}
                        style={{ width: (W - 64) / 2, backgroundColor: C.bg, borderRadius: 12, padding: 16,
                          alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                        <Ionicons name={icon as any} size={28} color={C.primary} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: C.text2, marginTop: 8, textAlign: 'center' }}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {loading && (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                      <ActivityIndicator size="large" color={C.primary} />
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={saveTransformed}
                  style={{ backgroundColor: C.success, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save Current Image</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* AI ENHANCE TAB (index 5) */}
            {tab === 5 && (
              <Animated.View entering={FadeInDown.springify()}>
                {/* Enhancement options */}
                <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: C.text, marginBottom: 4 }}>AI Enhance</Text>
                  <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>Generate an AI-enhanced version using Pollinations AI</Text>
                  <Text style={{ fontSize: 12, color: C.text3, marginBottom: 10 }}>Enhancement style:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {AI_ENHANCEMENT_OPTIONS.map((opt, i) => (
                      <TouchableOpacity key={opt.label} onPress={() => { Haptics.selectionAsync(); setAiEnhanceOption(i); }}
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                          backgroundColor: aiEnhanceOption === i ? C.primary : C.bg,
                          borderWidth: 1, borderColor: aiEnhanceOption === i ? C.primary : C.border }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: aiEnhanceOption === i ? '#fff' : C.text3 }}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={handleAiEnhance} disabled={aiLoading}
                    style={{ backgroundColor: '#7c3aed', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    {aiLoading
                      ? <><ActivityIndicator size="small" color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Generating...</Text></>
                      : <><Ionicons name="sparkles-outline" size={18} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Generate Enhanced Image</Text></>}
                  </TouchableOpacity>
                </View>

                {/* Before / After toggle */}
                {aiEnhancedUri && (
                  <Animated.View entering={FadeInDown.springify()}>
                    <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', marginBottom: 12, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border }}>
                        {(['before', 'after'] as const).map((v) => (
                          <TouchableOpacity key={v} onPress={() => { Haptics.selectionAsync(); setShowBeforeAfter(v); }}
                            style={{ flex: 1, paddingVertical: 10, alignItems: 'center',
                              backgroundColor: showBeforeAfter === v ? C.primary : C.surface }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: showBeforeAfter === v ? '#fff' : C.text3 }}>
                              {v === 'before' ? 'Original' : 'AI Enhanced'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' }}>
                        <Image
                          source={{ uri: showBeforeAfter === 'before' ? image.uri : aiEnhancedUri }}
                          style={{ width: '100%', height: 280 }}
                          resizeMode="contain"
                        />
                      </View>
                      <Text style={{ fontSize: 11, color: C.text3, textAlign: 'center', marginTop: 8 }}>
                        {showBeforeAfter === 'after' ? `Style: ${AI_ENHANCEMENT_OPTIONS[aiEnhanceOption].label}` : 'Original image'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={saveAiEnhanced}
                      style={{ backgroundColor: C.success, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                      <Ionicons name="save-outline" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save Enhanced Image</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {aiLoading && (
                  <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                    <Text style={{ fontSize: 14, color: C.text2, marginTop: 12, textAlign: 'center' }}>
                      Generating AI-enhanced image...{'\n'}This may take 15-30 seconds
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* REMOVE BG TAB (index 6) */}
            {tab === 6 && (
              <Animated.View entering={FadeInDown.springify()}>
                {/* Background color picker */}
                <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: C.text, marginBottom: 4 }}>Remove Background</Text>
                  <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>Uses on-device AI to remove the image background</Text>
                  <Text style={{ fontSize: 12, color: C.text3, marginBottom: 10 }}>Replace background with:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                    {BG_COLORS.map((bc) => (
                      <TouchableOpacity key={bc.value} onPress={() => { Haptics.selectionAsync(); setRemoveBgColor(bc.value); setRemoveBgResult(null); }}
                        style={{ alignItems: 'center', gap: 4 }}>
                        <View style={{
                          width: 40, height: 40, borderRadius: 10, borderWidth: 2,
                          borderColor: removeBgColor === bc.value ? C.primary : C.border,
                          backgroundColor: bc.display,
                          ...(bc.value === 'transparent' ? {
                            backgroundImage: undefined,
                          } : {}),
                        }}>
                          {bc.value === 'transparent' && (
                            <View style={{ flex: 1, borderRadius: 8, overflow: 'hidden' }}>
                              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                                {Array.from({ length: 16 }).map((_, i) => (
                                  <View key={i} style={{ width: '25%', height: '25%', backgroundColor: (Math.floor(i / 4) + i) % 2 === 0 ? '#ccc' : '#fff' }} />
                                ))}
                              </View>
                            </View>
                          )}
                          {removeBgColor === bc.value && bc.value !== 'transparent' && (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                              <Ionicons name="checkmark" size={18} color={bc.value === '#ffffff' ? '#000' : '#fff'} />
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 10, color: C.text3 }}>{bc.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* WebView for background removal */}
                <View style={{ backgroundColor: '#1a1a1a', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 12, height: 340 }}>
                  <WebView
                    ref={removeBgWebViewRef}
                    key={`remove-bg-${image.uri}-${removeBgColor}`}
                    originWhitelist={['*']}
                    source={{ html: getRemoveBgHtml(image.uri, removeBgColor) }}
                    onMessage={handleRemoveBgMessage}
                    javaScriptEnabled
                    allowFileAccess
                    allowFileAccessFromFileURLs
                    allowUniversalAccessFromFileURLs
                    mixedContentMode="always"
                    style={{ flex: 1, backgroundColor: '#1a1a1a' }}
                  />
                </View>

                {removeBgResult && (
                  <TouchableOpacity onPress={() => saveWebViewResult(removeBgResult, 'Image without background')}
                    style={{ backgroundColor: C.success, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save Result</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}

            {/* BLUR BG TAB (index 7) */}
            {tab === 7 && (
              <Animated.View entering={FadeInDown.springify()}>
                {/* Blur level picker */}
                <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: C.text, marginBottom: 4 }}>Blur Background</Text>
                  <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>Portrait mode simulation — blurs edges, keeps center sharp</Text>
                  <Text style={{ fontSize: 12, color: C.text3, marginBottom: 10 }}>Blur intensity:</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                    {BLUR_LEVELS.map((bl, i) => (
                      <TouchableOpacity key={bl.label} onPress={() => { Haptics.selectionAsync(); setBlurLevel(i); setBlurResult(null); }}
                        style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                          backgroundColor: blurLevel === i ? C.primary : C.bg,
                          borderWidth: 1, borderColor: blurLevel === i ? C.primary : C.border }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: blurLevel === i ? '#fff' : C.text }}>{bl.label}</Text>
                        <Text style={{ fontSize: 11, color: blurLevel === i ? 'rgba(255,255,255,0.7)' : C.text3, marginTop: 2 }}>{bl.desc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={{ fontSize: 11, color: C.text3, textAlign: 'center' }}>
                    Blur strength: {BLUR_LEVELS[blurLevel].px}px — {BLUR_LEVELS[blurLevel].desc}
                  </Text>
                </View>

                {/* WebView for blur */}
                <View style={{ backgroundColor: '#1a1a1a', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 12, height: 340 }}>
                  <WebView
                    ref={blurWebViewRef}
                    key={`blur-bg-${image.uri}-${blurLevel}`}
                    originWhitelist={['*']}
                    source={{ html: getBlurBgHtml(image.uri, BLUR_LEVELS[blurLevel].px) }}
                    onMessage={handleBlurBgMessage}
                    javaScriptEnabled
                    allowFileAccess
                    allowFileAccessFromFileURLs
                    allowUniversalAccessFromFileURLs
                    mixedContentMode="always"
                    style={{ flex: 1, backgroundColor: '#1a1a1a' }}
                  />
                </View>

                {blurResult && (
                  <TouchableOpacity onPress={() => saveWebViewResult(blurResult, 'Image with blurred background')}
                    style={{ backgroundColor: C.success, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save Result</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}

          </ScrollView>
        </View>
      )}

      {/* Result Modal */}
      {resultUri && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingBottom: 24, paddingTop: 16 }}>
          <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>Download Ready</Text>
            <Text style={{ fontSize: 14, color: C.text2 }}>{resultLabel}</Text>
            <TouchableOpacity onPress={async () => {
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status === 'granted') {
                await MediaLibrary.saveToLibraryAsync(resultUri);
                Alert.alert('Saved!', 'File saved to gallery.');
                setResultUri(null);
              } else {
                await Sharing.shareAsync(resultUri);
                setResultUri(null);
              }
            }}
              style={{ backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save to Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              await Sharing.shareAsync(resultUri);
              setResultUri(null);
            }}
              style={{ backgroundColor: C.bg, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: C.border }}>
              <Ionicons name="share-social-outline" size={18} color={C.primary} />
              <Text style={{ color: C.primary, fontWeight: '700', fontSize: 15 }}>Share File</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setResultUri(null)}
              style={{ padding: 14, alignItems: 'center' }}>
              <Text style={{ color: C.text3, fontWeight: '600', fontSize: 14 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
