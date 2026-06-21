import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Dimensions, TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

const { width: W } = Dimensions.get('window');

const C = {
  primary: '#4f46e5', bg: '#f9fafb', surface: '#ffffff',
  text: '#111827', text2: '#374151', text3: '#6b7280', text4: '#9ca3af',
  border: '#e5e7eb', success: '#10b981', warning: '#f59e0b', danger: '#dc2626',
};

const TABS = ['Combine', 'Compress', 'Info', 'Split', 'Organize', 'PDF→Imgs', 'Imgs→PDF'];

type PdfFile = { uri: string; name: string; size?: number };
type CombineFile = { uri: string; name: string; size?: number; mimeType: string };
type ImageFile = { uri: string; name: string };
type Rotation = 0 | 90 | 180 | 270;

interface PageCard {
  id: number;
  label: string;
  deleted: boolean;
  rotation: Rotation;
}

function fmtSize(bytes?: number) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function FileCard({ file, onRemove, index }: { file: PdfFile; onRemove: () => void; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}
      style={{ backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 10,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: C.border,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 }}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#fee2e2',
        justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="document-text" size={22} color={C.danger} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 14, color: C.text }} numberOfLines={1}>{file.name}</Text>
        <Text style={{ fontSize: 12, color: C.text4, marginTop: 2 }}>{fmtSize(file.size)}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={{ padding: 6 }}>
        <Ionicons name="close-circle" size={22} color={C.text4} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PdfToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState(0);

  // ── Combine state (PDF + images) ──────────────────────────────────────────
  const [combineFiles, setCombineFiles] = useState<CombineFile[]>([]);
  const [combining, setCombining] = useState(false);
  const [combineProgress, setCombineProgress] = useState('');
  const combineWebViewRef = useRef<WebView>(null);
  const [combineShowWebView, setCombineShowWebView] = useState(false);
  const [combineB64List, setCombineB64List] = useState<{ b64: string; mimeType: string }[]>([]);

  // ── Compress state ─────────────────────────────────────────────────────────
  const [compressFile, setCompressFile] = useState<PdfFile | null>(null);
  const [compressLevel, setCompressLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [compressTargetKB, setCompressTargetKB] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState('');
  const compressWebViewRef = useRef<WebView>(null);
  const [compressShowWebView, setCompressShowWebView] = useState(false);
  const [compressB64, setCompressB64] = useState('');

  // ── Info state ─────────────────────────────────────────────────────────────
  const [infoFile, setInfoFile] = useState<PdfFile | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<Record<string, string> | null>(null);

  // ── Split state ────────────────────────────────────────────────────────────
  const [splitFile, setSplitFile] = useState<PdfFile | null>(null);
  const [splitRange, setSplitRange] = useState('');
  const [splitting, setSplitting] = useState(false);
  const [splitProgress, setSplitProgress] = useState('');
  const splitWebViewRef = useRef<WebView>(null);
  const [splitShowWebView, setSplitShowWebView] = useState(false);
  const [splitB64, setSplitB64] = useState('');

  // ── Organize state ─────────────────────────────────────────────────────────
  const [orgFile, setOrgFile] = useState<PdfFile | null>(null);
  const [orgPages, setOrgPages] = useState<PageCard[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgApplying, setOrgApplying] = useState(false);

  // ── PDF → Images state ─────────────────────────────────────────────────────
  const [p2iFile, setP2iFile] = useState<PdfFile | null>(null);
  const [p2iResolution, setP2iResolution] = useState<'1x' | '1.5x' | '2x'>('1.5x');
  const [p2iFormat, setP2iFormat] = useState<'PNG' | 'JPEG'>('PNG');
  const [p2iConverting, setP2iConverting] = useState(false);
  const [p2iProgress, setP2iProgress] = useState('');
  const [p2iSaved, setP2iSaved] = useState(0);
  const [p2iTotal, setP2iTotal] = useState(0);
  const p2iWebViewRef = useRef<WebView>(null);
  const [p2iShowWebView, setP2iShowWebView] = useState(false);
  const [p2iB64, setP2iB64] = useState('');

  // ── Images → PDF state ─────────────────────────────────────────────────────
  const [i2pImages, setI2pImages] = useState<ImageFile[]>([]);
  const [i2pPageSize, setI2pPageSize] = useState<'A4' | 'Letter' | 'Custom'>('A4');
  const [i2pCreating, setI2pCreating] = useState(false);
  const [i2pProgress, setI2pProgress] = useState('');
  const i2pWebViewRef = useRef<WebView>(null);
  const [i2pShowWebView, setI2pShowWebView] = useState(false);

  // ── Result state for download ──────────────────────────────────────────────
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [resultLabel, setResultLabel] = useState('');

  // ── Shared PDF picker ──────────────────────────────────────────────────────
  const pickPdf = async (multi = false): Promise<PdfFile[]> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: multi,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return [];
      return result.assets.map(a => ({ uri: a.uri, name: a.name, size: a.size }));
    } catch {
      Alert.alert('Error', 'Could not pick file');
      return [];
    }
  };

  // ── Parse page count from PDF bytes ───────────────────────────────────────
  const parsePdfPageCount = async (uri: string): Promise<number> => {
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const bytes = atob(b64);
    const matches = [...bytes.matchAll(/\/Count\s+(\d+)/g)];
    if (matches.length === 0) return 1;
    // The root /Count is the largest one
    const counts = matches.map(m => parseInt(m[1], 10));
    return Math.max(...counts);
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  COMBINE (PDF + images into one PDF via pdf-lib WebView)
  // ══════════════════════════════════════════════════════════════════════════
  const addCombinePdfs = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const files = await pickPdf(true);
    const mapped: CombineFile[] = files.map(f => ({ ...f, mimeType: 'application/pdf' }));
    if (mapped.length) setCombineFiles(prev => [...prev, ...mapped].slice(0, 10));
  };

  const addCombineImages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access is required.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, quality: 1,
      });
      if (result.canceled) return;
      const imgs: CombineFile[] = result.assets.map(a => ({
        uri: a.uri,
        name: a.fileName || a.uri.split('/').pop() || 'image',
        size: a.fileSize,
        mimeType: a.mimeType || 'image/jpeg',
      }));
      setCombineFiles(prev => [...prev, ...imgs].slice(0, 10));
    } catch (e: any) { Alert.alert('Error', e?.message || 'Could not pick images'); }
  };

  const handleCombine = async () => {
    if (combineFiles.length < 2) { Alert.alert('Need 2+ files', 'Add at least 2 files to combine.'); return; }
    setCombining(true);
    setCombineProgress('Reading files…');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const list: { b64: string; mimeType: string }[] = [];
      for (let i = 0; i < combineFiles.length; i++) {
        setCombineProgress(`Reading file ${i + 1} of ${combineFiles.length}…`);
        const b64 = await FileSystem.readAsStringAsync(combineFiles[i].uri, { encoding: FileSystem.EncodingType.Base64 });
        list.push({ b64, mimeType: combineFiles[i].mimeType });
      }
      setCombineB64List(list);
      setCombineShowWebView(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not read files');
      setCombining(false); setCombineProgress('');
    }
  };

  const onCombineMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        const payload = JSON.stringify({ type: 'start', files: combineB64List });
        combineWebViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(payload)} }));
          true;
        `);
      } else if (msg.type === 'progress') {
        setCombineProgress(`Combining file ${msg.current} of ${msg.total}…`);
      } else if (msg.type === 'done') {
        setCombineShowWebView(false);
        setCombineProgress('Saving…');
        const pdfPath = FileSystem.cacheDirectory + `combined_${Date.now()}.pdf`;
        await FileSystem.writeAsStringAsync(pdfPath, msg.b64, { encoding: FileSystem.EncodingType.Base64 });
        setCombining(false); setCombineProgress('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) await Sharing.shareAsync(pdfPath, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Save Combined PDF' });
      } else if (msg.type === 'error') {
        setCombineShowWebView(false); setCombining(false); setCombineProgress('');
        Alert.alert('Combine Error', msg.message);
      }
    } catch (e) { console.warn('combine msg error', e); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  COMPRESS (PDF.js renders pages as JPEG, pdf-lib rebuilds; binary-search target size)
  // ══════════════════════════════════════════════════════════════════════════
  const pickCompressFile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const files = await pickPdf(false);
    if (files[0]) { setCompressFile(files[0]); setCompressProgress(''); }
  };

  const handleCompress = async () => {
    if (!compressFile) return;
    setCompressing(true); setCompressProgress('Reading PDF…');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const b64 = await FileSystem.readAsStringAsync(compressFile.uri, { encoding: FileSystem.EncodingType.Base64 });
      setCompressB64(b64);
      setCompressShowWebView(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not read PDF');
      setCompressing(false); setCompressProgress('');
    }
  };

  const onCompressMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        const qualityMap = { low: 0.92, medium: 0.72, high: 0.45 };
        const scaleMap2 = { low: 1.0, medium: 1.0, high: 0.8 };
        const quality = qualityMap[compressLevel];
        const scale = scaleMap2[compressLevel];
        const targetKB = compressTargetKB ? parseFloat(compressTargetKB) : null;
        const payload = JSON.stringify({ type: 'start', pdfB64: compressB64, quality, targetKB, scale });
        compressWebViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(payload)} }));
          true;
        `);
        setCompressProgress('Starting compression…');
      } else if (msg.type === 'page_progress') {
        setCompressProgress(`Rendering page ${msg.page} of ${msg.total}…`);
      } else if (msg.type === 'searching') {
        setCompressProgress(`Searching quality ${msg.quality}…`);
      } else if (msg.type === 'size_check') {
        setCompressProgress(`Size: ${msg.sizeKB} KB (target: ${msg.targetKB} KB)…`);
      } else if (msg.type === 'done') {
        setCompressShowWebView(false);
        const pdfPath = FileSystem.cacheDirectory + `compressed_${Date.now()}.pdf`;
        await FileSystem.writeAsStringAsync(pdfPath, msg.b64, { encoding: FileSystem.EncodingType.Base64 });
        setCompressing(false); setCompressProgress('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResultUri(pdfPath);
        setResultLabel(`Compressed: ${msg.originalKB} KB → ${msg.sizeKB} KB (Saved ${msg.savedKB} KB)`);
      } else if (msg.type === 'error') {
        setCompressShowWebView(false); setCompressing(false); setCompressProgress('');
        Alert.alert('Compress Error', msg.message);
      }
    } catch (e) { console.warn('compress msg error', e); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  INFO
  // ══════════════════════════════════════════════════════════════════════════
  const pickInfoFile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const files = await pickPdf(false);
    if (!files[0]) return;
    setInfoFile(files[0]);
    setInfoLoading(true);
    setPdfInfo(null);
    try {
      const b64 = await FileSystem.readAsStringAsync(files[0].uri, { encoding: FileSystem.EncodingType.Base64 });
      const bytes = atob(b64);
      const header = bytes.slice(0, 1024);
      const version = header.match(/%PDF-(\d\.\d)/)?.[1] || 'Unknown';
      const pageCountMatch = bytes.match(/\/Count\s+(\d+)/);
      const pageCount = pageCountMatch ? pageCountMatch[1] : 'Unknown';
      const creatorMatch = bytes.match(/\/Creator\s*\(([^)]+)\)/);
      const producerMatch = bytes.match(/\/Producer\s*\(([^)]+)\)/);
      const titleMatch = bytes.match(/\/Title\s*\(([^)]+)\)/);
      const encryptMatch = bytes.includes('/Encrypt');
      setPdfInfo({
        'Version': `PDF ${version}`,
        'Pages': pageCount,
        'File Size': fmtSize(files[0].size),
        'Title': titleMatch?.[1] || 'Untitled',
        'Creator': creatorMatch?.[1] || 'Unknown',
        'Producer': producerMatch?.[1] || 'Unknown',
        'Encrypted': encryptMatch ? 'Yes' : 'No',
        'File Name': files[0].name,
      });
    } catch {
      setPdfInfo({ 'Error': 'Could not parse PDF metadata', 'File Name': files[0].name, 'File Size': fmtSize(files[0].size) });
    } finally { setInfoLoading(false); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  SPLIT / EXTRACT PAGES (pdf-lib WebView)
  // ══════════════════════════════════════════════════════════════════════════
  const pickSplitFile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const files = await pickPdf(false);
    if (files[0]) { setSplitFile(files[0]); setSplitRange('1'); setSplitProgress(''); }
  };

  const handleSplit = async () => {
    if (!splitFile || !splitRange.trim()) return;
    setSplitting(true); setSplitProgress('Reading PDF…');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const b64 = await FileSystem.readAsStringAsync(splitFile.uri, { encoding: FileSystem.EncodingType.Base64 });
      setSplitB64(b64);
      setSplitShowWebView(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not read PDF');
      setSplitting(false); setSplitProgress('');
    }
  };

  const onSplitMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        const payload = JSON.stringify({ type: 'start', pdfB64: splitB64, pageRange: splitRange });
        splitWebViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(payload)} }));
          true;
        `);
        setSplitProgress('Extracting pages…');
      } else if (msg.type === 'done') {
        setSplitShowWebView(false);
        setSplitProgress('Saving…');
        const pdfPath = FileSystem.cacheDirectory + `split_${Date.now()}.pdf`;
        await FileSystem.writeAsStringAsync(pdfPath, msg.b64, { encoding: FileSystem.EncodingType.Base64 });
        setSplitting(false); setSplitProgress('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) await Sharing.shareAsync(pdfPath, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: `Save ${msg.pageCount}-page PDF` });
      } else if (msg.type === 'error') {
        setSplitShowWebView(false); setSplitting(false); setSplitProgress('');
        Alert.alert('Split Error', msg.message);
      }
    } catch (e) { console.warn('split msg error', e); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  ORGANIZE
  // ══════════════════════════════════════════════════════════════════════════
  const pickOrgFile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const files = await pickPdf(false);
    if (!files[0]) return;
    setOrgFile(files[0]);
    setOrgLoading(true);
    setOrgPages([]);
    try {
      const count = await parsePdfPageCount(files[0].uri);
      const pages: PageCard[] = Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        label: `Page ${i + 1}`,
        deleted: false,
        rotation: 0,
      }));
      setOrgPages(pages);
    } catch {
      Alert.alert('Error', 'Could not read page count from PDF.');
    } finally { setOrgLoading(false); }
  };

  const orgMove = (index: number, dir: -1 | 1) => {
    Haptics.selectionAsync();
    setOrgPages(prev => {
      const arr = [...prev];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const orgToggleDelete = (index: number) => {
    Haptics.selectionAsync();
    setOrgPages(prev => prev.map((p, i) => i === index ? { ...p, deleted: !p.deleted } : p));
  };

  const orgRotate = (index: number) => {
    Haptics.selectionAsync();
    setOrgPages(prev => prev.map((p, i) => {
      if (i !== index) return p;
      const next: Rotation = ((p.rotation + 90) % 360) as Rotation;
      return { ...p, rotation: next };
    }));
  };

  const handleOrgApply = async () => {
    if (!orgFile) return;
    setOrgApplying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const active = orgPages.filter(p => !p.deleted);
      const changes = orgPages
        .map((p, i) => ({
          originalPage: p.id,
          newPosition: active.findIndex(a => a.id === p.id) + 1,
          deleted: p.deleted,
          rotation: p.rotation,
        }));

      const config = {
        sourceFile: orgFile.name,
        timestamp: new Date().toISOString(),
        totalOriginalPages: orgPages.length,
        activePageCount: active.length,
        pageOrder: active.map(p => p.id),
        rotations: active.filter(p => p.rotation !== 0).map(p => ({ page: p.id, rotation: p.rotation })),
        deletedPages: orgPages.filter(p => p.deleted).map(p => p.id),
        changes,
      };

      const configPath = FileSystem.cacheDirectory + `org_config_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(configPath, JSON.stringify(config, null, 2));

      const summary = [
        `Source: ${orgFile.name}`,
        `Active pages: ${active.length} / ${orgPages.length}`,
        `Order: ${active.map(p => p.id).join(' → ')}`,
        orgPages.filter(p => p.deleted).length > 0
          ? `Deleted: pages ${orgPages.filter(p => p.deleted).map(p => p.id).join(', ')}`
          : null,
        active.filter(p => p.rotation !== 0).length > 0
          ? `Rotations: ${active.filter(p => p.rotation !== 0).map(p => `p${p.id}@${p.rotation}°`).join(', ')}`
          : null,
      ].filter(Boolean).join('\n');

      Alert.alert(
        'Changes Summary',
        summary,
        [
          {
            text: 'Export JSON Config',
            onPress: async () => {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) await Sharing.shareAsync(configPath, { mimeType: 'application/json' });
            },
          },
          {
            text: 'Share Original PDF',
            onPress: async () => {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(orgFile.uri, {
                  mimeType: 'application/pdf',
                  UTI: 'com.adobe.pdf',
                  dialogTitle: 'Share PDF (apply config server-side)',
                });
              }
            },
          },
          { text: 'Done' },
        ]
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not apply changes');
    } finally { setOrgApplying(false); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  PDF → IMAGES
  // ══════════════════════════════════════════════════════════════════════════
  const pickP2iFile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const files = await pickPdf(false);
    if (!files[0]) return;
    setP2iFile(files[0]);
    setP2iSaved(0);
    setP2iTotal(0);
    setP2iProgress('');
    setP2iShowWebView(false);
  };

  const handleP2iConvert = async () => {
    if (!p2iFile) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required to save images.');
      return;
    }
    setP2iConverting(true);
    setP2iSaved(0);
    setP2iProgress('Reading PDF…');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const b64 = await FileSystem.readAsStringAsync(p2iFile.uri, { encoding: FileSystem.EncodingType.Base64 });
      setP2iB64(b64);
      setP2iShowWebView(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not read PDF');
      setP2iConverting(false);
    }
  };

  const scaleMap = { '1x': 1, '1.5x': 1.5, '2x': 2 };

  // PDF data is passed via injectedJavaScript postMessage after WebView loads,
  // avoiding the need to embed huge base64 strings directly in HTML.
  const P2I_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;background:#111;color:#fff;font-family:sans-serif;padding:20px;}
#status{font-size:14px;}</style>
</head>
<body>
<div id="status">Initializing PDF.js...</div>
<canvas id="c" style="display:none;"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
window.addEventListener('message', async function(event) {
  const msg = JSON.parse(event.data);
  if (msg.type !== 'start') return;
  const { pdfB64, scale, mimeType, quality } = msg;
  document.getElementById('status').textContent = 'Loading PDF...';
  try {
    const bytes = Uint8Array.from(atob(pdfB64), c => c.charCodeAt(0));
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const numPages = pdf.numPages;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'total', total: numPages }));
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    for (let i = 1; i <= numPages; i++) {
      document.getElementById('status').textContent = 'Page ' + i + ' / ' + numPages;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'progress', page: i, total: numPages }));
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const b64 = dataUrl.split(',')[1];
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'page', page: i, total: numPages, b64: b64 }));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    document.getElementById('status').textContent = 'Done!';
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'done' }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message || String(e) }));
  }
});
window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
</script>
</body>
</html>`;

  const onP2iMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        // WebView loaded; inject the PDF data
        const ext = p2iFormat === 'PNG' ? 'image/png' : 'image/jpeg';
        const quality = p2iFormat === 'JPEG' ? 0.92 : 1.0;
        const scale = scaleMap[p2iResolution];
        const payload = JSON.stringify({
          type: 'start',
          pdfB64: p2iB64,
          scale,
          mimeType: ext,
          quality,
        });
        p2iWebViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(payload)} }));
          true;
        `);
      } else if (msg.type === 'total') {
        setP2iTotal(msg.total);
        setP2iProgress(`Converting page 1 of ${msg.total}…`);
      } else if (msg.type === 'progress') {
        setP2iProgress(`Converting page ${msg.page} of ${msg.total}…`);
      } else if (msg.type === 'page') {
        // Save this image to gallery
        const ext = p2iFormat === 'PNG' ? 'png' : 'jpg';
        const path = FileSystem.cacheDirectory + `pdf_page_${msg.page}.${ext}`;
        await FileSystem.writeAsStringAsync(path, msg.b64, { encoding: FileSystem.EncodingType.Base64 });
        await MediaLibrary.saveToLibraryAsync(path);
        setP2iSaved(prev => prev + 1);
        setP2iProgress(`Saved page ${msg.page} of ${msg.total} to gallery`);
      } else if (msg.type === 'done') {
        setP2iShowWebView(false);
        setP2iConverting(false);
        setP2iProgress('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Done!', `${p2iSaved + 1 >= p2iTotal ? p2iTotal : p2iSaved} images saved to your photo gallery.`);
      } else if (msg.type === 'error') {
        setP2iShowWebView(false);
        setP2iConverting(false);
        setP2iProgress('');
        Alert.alert('Conversion Error', msg.message);
      }
    } catch (e) {
      console.warn('p2i message parse error', e);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  IMAGES → PDF
  // ══════════════════════════════════════════════════════════════════════════
  const pickI2pImages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });
      if (result.canceled) return;
      const imgs: ImageFile[] = result.assets.map(a => ({
        uri: a.uri,
        name: a.fileName || a.uri.split('/').pop() || 'image',
      }));
      setI2pImages(prev => [...prev, ...imgs]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not pick images');
    }
  };

  const i2pMove = (index: number, dir: -1 | 1) => {
    Haptics.selectionAsync();
    setI2pImages(prev => {
      const arr = [...prev];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  const I2P_HTML = (pageSz: 'A4' | 'Letter' | 'Custom') => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:0;background:#111;color:#fff;font-family:sans-serif;padding:20px;}
#status{font-size:14px;}</style>
</head>
<body>
<div id="status">Loading jsPDF...</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script>
window.addEventListener('message', async function(event) {
  const msg = JSON.parse(event.data);
  if (msg.type !== 'start') return;
  document.getElementById('status').textContent = 'Creating PDF...';
  try {
    const { images, pageSize } = msg;
    const { jsPDF } = window.jspdf;
    let pdf = null;
    for (let i = 0; i < images.length; i++) {
      document.getElementById('status').textContent = 'Adding image ' + (i+1) + ' of ' + images.length;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'progress', current: i+1, total: images.length }));
      const imgB64 = images[i];
      const imgEl = new Image();
      await new Promise((res, rej) => {
        imgEl.onload = res;
        imgEl.onerror = rej;
        imgEl.src = 'data:image/jpeg;base64,' + imgB64;
      });
      const iw = imgEl.naturalWidth;
      const ih = imgEl.naturalHeight;
      let pw, ph;
      if (pageSize === 'A4') { pw = 210; ph = 297; }
      else if (pageSize === 'Letter') { pw = 215.9; ph = 279.4; }
      else { pw = iw * 0.264583; ph = ih * 0.264583; } // px to mm at 96dpi
      const orientation = iw > ih ? 'landscape' : 'portrait';
      if (pdf === null) {
        pdf = new jsPDF({ orientation: pageSize === 'Custom' ? orientation : (pw > ph ? 'l' : 'p'), unit: 'mm', format: pageSize === 'Custom' ? [pw, ph] : pageSize.toLowerCase() });
      } else {
        pdf.addPage(pageSize === 'Custom' ? [pw, ph] : pageSize.toLowerCase(), pageSize === 'Custom' ? orientation : (pw > ph ? 'l' : 'p'));
      }
      // Fit image to page preserving aspect ratio
      const scale = Math.min(pdf.internal.pageSize.getWidth() / iw, pdf.internal.pageSize.getHeight() / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (pdf.internal.pageSize.getWidth() - dw) / 2;
      const dy = (pdf.internal.pageSize.getHeight() - dh) / 2;
      pdf.addImage(imgB64, 'JPEG', dx, dy, dw, dh);
    }
    document.getElementById('status').textContent = 'Exporting...';
    const b64 = pdf.output('datauristring').split(',')[1];
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'done', b64 }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message || String(e) }));
  }
});
window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
</script>
</body>
</html>`;

  const [i2pImgB64Cache, setI2pImgB64Cache] = useState<string[]>([]);

  const handleI2pCreate = async () => {
    if (i2pImages.length === 0) { Alert.alert('No images', 'Add at least one image.'); return; }
    setI2pCreating(true);
    setI2pProgress('Reading images…');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const b64s: string[] = [];
      for (let i = 0; i < i2pImages.length; i++) {
        setI2pProgress(`Reading image ${i + 1} of ${i2pImages.length}…`);
        const b = await FileSystem.readAsStringAsync(i2pImages[i].uri, { encoding: FileSystem.EncodingType.Base64 });
        b64s.push(b);
      }
      setI2pImgB64Cache(b64s);
      setI2pShowWebView(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not read images');
      setI2pCreating(false);
    }
  };

  const onI2pMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'ready') {
        const payload = JSON.stringify({
          type: 'start',
          images: i2pImgB64Cache,
          pageSize: i2pPageSize,
        });
        i2pWebViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new MessageEvent('message', { data: ${JSON.stringify(payload)} }));
          true;
        `);
        setI2pProgress('Converting images to PDF…');
      } else if (msg.type === 'progress') {
        setI2pProgress(`Processing image ${msg.current} of ${msg.total}…`);
      } else if (msg.type === 'done') {
        setI2pShowWebView(false);
        setI2pProgress('Saving PDF…');
        const pdfPath = FileSystem.cacheDirectory + `images_to_pdf_${Date.now()}.pdf`;
        await FileSystem.writeAsStringAsync(pdfPath, msg.b64, { encoding: FileSystem.EncodingType.Base64 });
        setI2pCreating(false);
        setI2pProgress('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(pdfPath, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf',
            dialogTitle: 'Save or Share your PDF' });
        }
      } else if (msg.type === 'error') {
        setI2pShowWebView(false);
        setI2pCreating(false);
        setI2pProgress('');
        Alert.alert('PDF Creation Error', msg.message);
      }
    } catch (e) {
      console.warn('i2p message parse error', e);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  //  WEBVIEW HTML — COMBINE (pdf-lib merges PDFs + embeds images)
  // ══════════════════════════════════════════════════════════════════════════
  const COMBINE_HTML = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#111;color:#fff;font-family:sans-serif;padding:20px;}
#s{font-size:14px;}</style></head><body>
<div id="s">Loading pdf-lib…</div>
<script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script>
function toB64(arr){
  var b64='',chunk=8192;
  for(var i=0;i<arr.length;i+=chunk){
    b64+=String.fromCharCode.apply(null,Array.from(arr.subarray(i,Math.min(i+chunk,arr.length))));
  }
  return btoa(b64);
}
window.addEventListener('message',async function(ev){
  var msg=JSON.parse(ev.data);
  if(msg.type!=='start')return;
  var files=msg.files;
  var PDFDocument=PDFLib.PDFDocument;
  document.getElementById('s').textContent='Creating combined PDF…';
  try{
    var merged=await PDFDocument.create();
    for(var i=0;i<files.length;i++){
      var f=files[i];
      document.getElementById('s').textContent='Processing '+(i+1)+' of '+files.length+'…';
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'progress',current:i+1,total:files.length}));
      var bytes=Uint8Array.from(atob(f.b64),function(c){return c.charCodeAt(0);});
      if(f.mimeType==='application/pdf'){
        var doc=await PDFDocument.load(bytes,{ignoreEncryption:true});
        var pages=await merged.copyPages(doc,doc.getPageIndices());
        pages.forEach(function(p){merged.addPage(p);});
      }else if(f.mimeType==='image/png'){
        var img=await merged.embedPng(bytes);
        var dims=img.scale(1);
        var pw=595.28,ph=841.89;
        var sc=Math.min(pw/dims.width,ph/dims.height);
        var page=merged.addPage([pw,ph]);
        page.drawImage(img,{x:(pw-dims.width*sc)/2,y:(ph-dims.height*sc)/2,width:dims.width*sc,height:dims.height*sc});
      }else{
        var img2=await merged.embedJpg(bytes);
        var dims2=img2.scale(1);
        var pw2=595.28,ph2=841.89;
        var sc2=Math.min(pw2/dims2.width,ph2/dims2.height);
        var page2=merged.addPage([pw2,ph2]);
        page2.drawImage(img2,{x:(pw2-dims2.width*sc2)/2,y:(ph2-dims2.height*sc2)/2,width:dims2.width*sc2,height:dims2.height*sc2});
      }
    }
    document.getElementById('s').textContent='Saving…';
    var saved=await merged.save();
    var b64=toB64(new Uint8Array(saved));
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'done',b64:b64}));
  }catch(e){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:e.message||String(e)}));
  }
});
window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
</script></body></html>`;

  // ── COMPRESS HTML (PDF.js renders pages as JPEG, pdf-lib rebuilds; binary-search for target KB)
  const COMPRESS_HTML = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#111;color:#fff;font-family:sans-serif;padding:20px;}
#s{font-size:14px;}</style></head><body>
<div id="s">Loading libraries…</div>
<canvas id="c" style="display:none;"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script>
function toB64(arr){
  var b64='',chunk=8192;
  for(var i=0;i<arr.length;i+=chunk){
    b64+=String.fromCharCode.apply(null,Array.from(arr.subarray(i,Math.min(i+chunk,arr.length))));
  }
  return btoa(b64);
}
async function renderPDF(pdfBytes,quality,scale){
  var pdf=await pdfjsLib.getDocument({data:pdfBytes}).promise;
  var numPages=pdf.numPages;
  var PDFDocument=PDFLib.PDFDocument;
  var newDoc=await PDFDocument.create();
  var canvas=document.getElementById('c');
  var ctx=canvas.getContext('2d');
  for(var i=1;i<=numPages;i++){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'page_progress',page:i,total:numPages}));
    var page=await pdf.getPage(i);
    var vp=page.getViewport({scale:scale});
    canvas.width=vp.width; canvas.height=vp.height;
    await page.render({canvasContext:ctx,viewport:vp}).promise;
    var dataUrl=canvas.toDataURL('image/jpeg',quality);
    var jpegB64=dataUrl.split(',')[1];
    var jpegBytes=Uint8Array.from(atob(jpegB64),function(c){return c.charCodeAt(0);});
    var img=await newDoc.embedJpg(jpegBytes);
    var pg=newDoc.addPage([vp.width,vp.height]);
    pg.drawImage(img,{x:0,y:0,width:vp.width,height:vp.height});
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  return newDoc.save();
}
window.addEventListener('message',async function(ev){
  var msg=JSON.parse(ev.data);
  if(msg.type!=='start')return;
  document.getElementById('s').textContent='Loading PDF…';
  try{
    var pdfBytes=Uint8Array.from(atob(msg.pdfB64),function(c){return c.charCodeAt(0);});
    var origKB=(pdfBytes.length/1024).toFixed(1);
    var result;
    if(msg.targetKB&&msg.targetKB>0){
      var lo=0.05,hi=msg.quality||0.85,best=null;
      for(var iter=0;iter<8;iter++){
        var mid=(lo+hi)/2;
        document.getElementById('s').textContent='Trying quality '+mid.toFixed(2)+'…';
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'searching',quality:mid.toFixed(2)}));
        var attempt=await renderPDF(pdfBytes,mid,msg.scale||1.0);
        var sKB=(attempt.length/1024).toFixed(1);
        best=attempt;
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'size_check',sizeKB:sKB,targetKB:msg.targetKB}));
        if(attempt.length/1024<=msg.targetKB){lo=mid;}else{hi=mid;}
      }
      result=best;
    }else{
      document.getElementById('s').textContent='Compressing…';
      result=await renderPDF(pdfBytes,msg.quality||0.75,msg.scale||1.0);
    }
    var arr=new Uint8Array(result);
    var b64=toB64(arr);
    var sizeKB=(arr.length/1024).toFixed(1);
    var savedKB=(parseFloat(origKB)-parseFloat(sizeKB)).toFixed(1);
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'done',b64:b64,sizeKB:sizeKB,savedKB:savedKB,originalKB:origKB}));
  }catch(e){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:e.message||String(e)}));
  }
});
window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
</script></body></html>`;

  // ── SPLIT HTML (pdf-lib extracts pages by range string)
  const SPLIT_HTML = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;background:#111;color:#fff;font-family:sans-serif;padding:20px;}
#s{font-size:14px;}</style></head><body>
<div id="s">Loading pdf-lib…</div>
<script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script>
function toB64(arr){
  var b64='',chunk=8192;
  for(var i=0;i<arr.length;i+=chunk){
    b64+=String.fromCharCode.apply(null,Array.from(arr.subarray(i,Math.min(i+chunk,arr.length))));
  }
  return btoa(b64);
}
function parseRange(str,total){
  var pages=[];
  var parts=str.split(',');
  for(var j=0;j<parts.length;j++){
    var p=parts[j].trim();
    if(p.toLowerCase()==='last 2'){pages.push(total-1,total);}
    else if(p.indexOf('-')>=0){
      var sp=p.split('-');
      var s=parseInt(sp[0],10),e=parseInt(sp[1],10);
      for(var i=Math.max(1,s);i<=Math.min(total,e);i++)pages.push(i);
    }else{
      var n=parseInt(p,10);
      if(!isNaN(n)&&n>=1&&n<=total)pages.push(n);
    }
  }
  return pages.filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});
}
window.addEventListener('message',async function(ev){
  var msg=JSON.parse(ev.data);
  if(msg.type!=='start')return;
  document.getElementById('s').textContent='Loading PDF…';
  try{
    var PDFDocument=PDFLib.PDFDocument;
    var bytes=Uint8Array.from(atob(msg.pdfB64),function(c){return c.charCodeAt(0);});
    var src=await PDFDocument.load(bytes,{ignoreEncryption:true});
    var total=src.getPageCount();
    var pageNums=parseRange(msg.pageRange,total);
    if(pageNums.length===0)throw new Error('No valid pages in range "'+msg.pageRange+'" (PDF has '+total+' pages)');
    document.getElementById('s').textContent='Extracting '+pageNums.length+' pages…';
    var newDoc=await PDFDocument.create();
    var indices=pageNums.map(function(n){return n-1;});
    var pages=await newDoc.copyPages(src,indices);
    pages.forEach(function(p){newDoc.addPage(p);});
    var saved=await newDoc.save();
    var b64=toB64(new Uint8Array(saved));
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'done',b64:b64,pageCount:pageNums.length}));
  }catch(e){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:e.message||String(e)}));
  }
});
window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
</script></body></html>`;

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>

      {/* Hidden WebViews */}
      {combineShowWebView && (
        <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
          <WebView ref={combineWebViewRef} originWhitelist={['*']} source={{ html: COMBINE_HTML }}
            onMessage={onCombineMessage} javaScriptEnabled domStorageEnabled />
        </View>
      )}
      {compressShowWebView && (
        <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
          <WebView ref={compressWebViewRef} originWhitelist={['*']} source={{ html: COMPRESS_HTML }}
            onMessage={onCompressMessage} javaScriptEnabled domStorageEnabled />
        </View>
      )}
      {splitShowWebView && (
        <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
          <WebView ref={splitWebViewRef} originWhitelist={['*']} source={{ html: SPLIT_HTML }}
            onMessage={onSplitMessage} javaScriptEnabled domStorageEnabled />
        </View>
      )}
      {p2iShowWebView && (
        <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
          <WebView
            ref={p2iWebViewRef}
            originWhitelist={['*']}
            source={{ html: P2I_HTML }}
            onMessage={onP2iMessage}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
          />
        </View>
      )}
      {i2pShowWebView && (
        <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
          <WebView
            ref={i2pWebViewRef}
            originWhitelist={['*']}
            source={{ html: I2P_HTML(i2pPageSize) }}
            onMessage={onI2pMessage}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
          />
        </View>
      )}

      {/* Header */}
      <Animated.View entering={FadeIn.springify()}
        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
          backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.text }}>PDF Tools</Text>
          <Text style={{ fontSize: 12, color: C.text4 }}>Merge • Compress • Info • Split • Organize • Convert</Text>
        </View>
        <View style={{ backgroundColor: '#fee2e2', borderRadius: 8, padding: 8 }}>
          <Ionicons name="document-text" size={20} color={C.danger} />
        </View>
      </Animated.View>

      {/* Tabs — horizontal scroll for 7 tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border }}
        contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} onPress={() => { Haptics.selectionAsync(); setTab(i); }}
            style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center',
              backgroundColor: tab === i ? C.primary : C.bg,
              borderWidth: 1, borderColor: tab === i ? C.primary : C.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: tab === i ? '#fff' : C.text3 }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 50 }}>

        {/* ── COMBINE TAB ───────────────────────────────────────────────────── */}
        {tab === 0 && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: C.text, marginBottom: 4 }}>Combine into One PDF</Text>
              <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>Merge PDFs and images (PNG/JPEG) into one document. Add up to 10 files in any order.</Text>

              {combineFiles.map((f, i) => (
                <FileCard key={`${f.uri}-${i}`} file={f} index={i} onRemove={() => {
                  setCombineFiles(prev => prev.filter((_, idx) => idx !== i));
                }} />
              ))}

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <TouchableOpacity onPress={addCombinePdfs} style={{ flex: 1, borderWidth: 2, borderStyle: 'dashed',
                  borderColor: C.danger, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 }}>
                  <Ionicons name="document-text-outline" size={22} color={C.danger} />
                  <Text style={{ color: C.danger, fontWeight: '700', fontSize: 13 }}>Add PDFs</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={addCombineImages} style={{ flex: 1, borderWidth: 2, borderStyle: 'dashed',
                  borderColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 }}>
                  <Ionicons name="image-outline" size={22} color={C.primary} />
                  <Text style={{ color: C.primary, fontWeight: '700', fontSize: 13 }}>Add Images</Text>
                </TouchableOpacity>
              </View>

              {combineFiles.length > 0 && (
                <Text style={{ fontSize: 12, color: C.text4, textAlign: 'center', marginBottom: 12 }}>
                  {combineFiles.length} file{combineFiles.length > 1 ? 's' : ''} — {fmtSize(combineFiles.reduce((s, f) => s + (f.size || 0), 0))} total
                </Text>
              )}

              {combining && combineProgress !== '' && (
                <View style={{ backgroundColor: C.primary + '12', borderRadius: 10, padding: 12, marginBottom: 12,
                  flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600', flex: 1 }}>{combineProgress}</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleCombine} disabled={combining || combineFiles.length < 2}
                style={{ backgroundColor: combineFiles.length < 2 ? C.border : C.primary, borderRadius: 12,
                  padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {combining ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="git-merge-outline" size={18} color={combineFiles.length < 2 ? C.text4 : '#fff'} />
                      <Text style={{ color: combineFiles.length < 2 ? C.text4 : '#fff', fontWeight: '700', fontSize: 15 }}>
                        Combine {combineFiles.length > 0 ? `${combineFiles.length} Files` : 'Files'}
                      </Text></>}
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: C.text4, textAlign: 'center', marginTop: 10 }}>
                Uses pdf-lib (CDN) in a background WebView. Internet required first use.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── COMPRESS TAB ──────────────────────────────────────────────────── */}
        {tab === 1 && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: C.text, marginBottom: 4 }}>Compress PDF</Text>
              <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>Reduce PDF file size. Optionally set a target size (KB) for precision compression.</Text>
              {!compressFile ? (
                <TouchableOpacity onPress={pickCompressFile}
                  style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: C.border, borderRadius: 12,
                    padding: 32, alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="cloud-upload-outline" size={40} color={C.text4} />
                  <Text style={{ color: C.text3, fontWeight: '600', marginTop: 12, fontSize: 15 }}>Select a PDF</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginBottom: 16 }}>
                  <FileCard file={compressFile} index={0} onRemove={() => { setCompressFile(null); setCompressProgress(''); }} />
                </View>
              )}

              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text2, marginBottom: 10 }}>Compression Level</Text>
              {(['low', 'medium', 'high'] as const).map(level => (
                <TouchableOpacity key={level} onPress={() => { Haptics.selectionAsync(); setCompressLevel(level); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12,
                    marginBottom: 8, backgroundColor: compressLevel === level ? C.primary + '15' : C.bg,
                    borderWidth: 1, borderColor: compressLevel === level ? C.primary : C.border }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                    borderColor: compressLevel === level ? C.primary : C.border,
                    backgroundColor: compressLevel === level ? C.primary : 'transparent',
                    justifyContent: 'center', alignItems: 'center' }}>
                    {compressLevel === level && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: C.text, fontSize: 14, textTransform: 'capitalize' }}>{level} Compression</Text>
                    <Text style={{ fontSize: 12, color: C.text3 }}>
                      {level === 'low' ? 'Minimal reduction, maximum quality (JPEG 92%)'
                        : level === 'medium' ? 'Balanced size and quality (JPEG 72%)'
                        : 'Maximum reduction, lower quality (JPEG 45%)'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text2, marginBottom: 8, marginTop: 8 }}>
                Target Size (KB) <Text style={{ fontWeight: '400', color: C.text4 }}>— optional</Text>
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border,
                borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 }}>
                <TextInput
                  value={compressTargetKB}
                  onChangeText={setCompressTargetKB}
                  placeholder="e.g. 500"
                  placeholderTextColor={C.text4}
                  keyboardType="numeric"
                  style={{ flex: 1, fontSize: 15, color: C.text }}
                />
                <Text style={{ color: C.text4, fontSize: 13 }}>KB</Text>
              </View>
              {compressTargetKB !== '' && (
                <Text style={{ fontSize: 12, color: C.text4, marginBottom: 12, marginTop: -8 }}>
                  Binary search will find quality that hits ~{compressTargetKB} KB (up to 8 attempts)
                </Text>
              )}

              {compressing && compressProgress !== '' && (
                <View style={{ backgroundColor: C.primary + '12', borderRadius: 10, padding: 12, marginBottom: 12,
                  flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600', flex: 1 }}>{compressProgress}</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleCompress} disabled={compressing || !compressFile}
                style={{ backgroundColor: !compressFile ? C.border : C.primary, borderRadius: 12,
                  padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {compressing ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="archive-outline" size={18} color={!compressFile ? C.text4 : '#fff'} />
                      <Text style={{ color: !compressFile ? C.text4 : '#fff', fontWeight: '700', fontSize: 15 }}>
                        {compressTargetKB ? `Compress to ~${compressTargetKB} KB` : 'Compress & Share'}
                      </Text></>}
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: C.text4, textAlign: 'center', marginTop: 10 }}>
                Uses PDF.js + pdf-lib (CDN). Internet required first use.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── INFO TAB ──────────────────────────────────────────────────────── */}
        {tab === 2 && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: C.text, marginBottom: 4 }}>PDF Information</Text>
              <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>Extract metadata and properties from a PDF file.</Text>
              <TouchableOpacity onPress={pickInfoFile}
                style={{ backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center',
                  flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                <Ionicons name="document-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  {infoFile ? 'Change PDF' : 'Select PDF'}
                </Text>
              </TouchableOpacity>
              {infoLoading && (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <ActivityIndicator size="large" color={C.primary} />
                  <Text style={{ color: C.text3, marginTop: 12 }}>Analyzing PDF…</Text>
                </View>
              )}
              {pdfInfo && !infoLoading && (
                <Animated.View entering={FadeInDown.springify()}>
                  {Object.entries(pdfInfo).map(([key, val]) => (
                    <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between',
                      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
                      <Text style={{ fontSize: 13, color: C.text3, flex: 1 }}>{key}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: C.text, flex: 2, textAlign: 'right' }} numberOfLines={2}>{val}</Text>
                    </View>
                  ))}
                </Animated.View>
              )}
              {!infoFile && !infoLoading && (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="document-text-outline" size={48} color={C.text4} />
                  <Text style={{ color: C.text4, marginTop: 12, fontSize: 14 }}>No PDF selected</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── SPLIT TAB ─────────────────────────────────────────────────────── */}
        {tab === 3 && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: C.text, marginBottom: 4 }}>Extract Pages</Text>
              <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>Extract specific pages or ranges from a PDF into a new file.</Text>
              {!splitFile ? (
                <TouchableOpacity onPress={pickSplitFile}
                  style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: C.border, borderRadius: 12,
                    padding: 32, alignItems: 'center', marginBottom: 16 }}>
                  <Ionicons name="cut-outline" size={40} color={C.text4} />
                  <Text style={{ color: C.text3, fontWeight: '600', marginTop: 12, fontSize: 15 }}>Select a PDF to split</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginBottom: 16 }}>
                  <FileCard file={splitFile} index={0} onRemove={() => { setSplitFile(null); setSplitProgress(''); }} />
                </View>
              )}
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text2, marginBottom: 8 }}>Page Range</Text>
              <TextInput
                value={splitRange}
                onChangeText={setSplitRange}
                placeholder="e.g. 1-3 or 1,3,5-7"
                placeholderTextColor={C.text4}
                style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12,
                  fontSize: 15, color: C.text, marginBottom: 8 }}
              />
              <Text style={{ fontSize: 12, color: C.text4, marginBottom: 12 }}>Examples: 1 · 1-3 · 1,3,5-7 · Last 2</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {['1', '1-3', '2-5', '1,3,5', 'Last 2'].map(preset => (
                  <TouchableOpacity key={preset} onPress={() => { Haptics.selectionAsync(); setSplitRange(preset); }}
                    style={{ backgroundColor: splitRange === preset ? C.primary : C.bg, borderRadius: 20,
                      paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1,
                      borderColor: splitRange === preset ? C.primary : C.border }}>
                    <Text style={{ fontSize: 13, fontWeight: '600',
                      color: splitRange === preset ? '#fff' : C.text3 }}>{preset}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {splitting && splitProgress !== '' && (
                <View style={{ backgroundColor: C.primary + '12', borderRadius: 10, padding: 12, marginBottom: 12,
                  flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600', flex: 1 }}>{splitProgress}</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleSplit} disabled={splitting || !splitFile || !splitRange.trim()}
                style={{ backgroundColor: (!splitFile || !splitRange.trim()) ? C.border : C.primary, borderRadius: 12,
                  padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {splitting ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="cut-outline" size={18} color={(!splitFile || !splitRange.trim()) ? C.text4 : '#fff'} />
                      <Text style={{ color: (!splitFile || !splitRange.trim()) ? C.text4 : '#fff', fontWeight: '700', fontSize: 15 }}>Extract & Share</Text></>}
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: C.text4, textAlign: 'center', marginTop: 10 }}>
                Uses pdf-lib (CDN). Internet required first use.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── ORGANIZE TAB ──────────────────────────────────────────────────── */}
        {tab === 4 && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: C.text, marginBottom: 4 }}>Organize Pages</Text>
              <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>
                Reorder, delete, or rotate pages. Apply changes to export a JSON config or share the original PDF with instructions.
              </Text>

              {!orgFile ? (
                <TouchableOpacity onPress={pickOrgFile}
                  style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: C.border, borderRadius: 12,
                    padding: 32, alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="layers-outline" size={40} color={C.text4} />
                  <Text style={{ color: C.text3, fontWeight: '600', marginTop: 12, fontSize: 15 }}>Select a PDF to organize</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginBottom: 12 }}>
                  <FileCard file={orgFile} index={0} onRemove={() => { setOrgFile(null); setOrgPages([]); }} />
                </View>
              )}

              {orgLoading && (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <ActivityIndicator size="large" color={C.primary} />
                  <Text style={{ color: C.text3, marginTop: 10 }}>Reading page count…</Text>
                </View>
              )}

              {orgPages.length > 0 && !orgLoading && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 13, color: C.text3, fontWeight: '600' }}>
                      {orgPages.length} pages — {orgPages.filter(p => !p.deleted).length} active
                    </Text>
                    <TouchableOpacity onPress={() => {
                      Haptics.selectionAsync();
                      setOrgPages(prev => prev.map(p => ({ ...p, deleted: false, rotation: 0 as Rotation })).sort((a, b) => a.id - b.id));
                    }}>
                      <Text style={{ fontSize: 12, color: C.primary, fontWeight: '700' }}>Reset All</Text>
                    </TouchableOpacity>
                  </View>

                  {orgPages.map((page, idx) => (
                    <Animated.View key={page.id} entering={FadeInDown.delay(idx * 30).springify()}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
                        backgroundColor: page.deleted ? '#fef2f2' : C.bg,
                        borderRadius: 12, padding: 10,
                        borderWidth: 1, borderColor: page.deleted ? '#fecaca' : C.border,
                        opacity: page.deleted ? 0.55 : 1 }}>

                      {/* Page number badge */}
                      <View style={{ width: 40, height: 52, borderRadius: 8,
                        backgroundColor: page.deleted ? '#fee2e2' : C.primary + '18',
                        justifyContent: 'center', alignItems: 'center', borderWidth: 1,
                        borderColor: page.deleted ? '#fca5a5' : C.primary + '40' }}>
                        <Ionicons name="document" size={18} color={page.deleted ? C.danger : C.primary} />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: page.deleted ? C.danger : C.primary, marginTop: 2 }}>
                          {page.id}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: page.deleted ? C.text4 : C.text }}>
                          {page.deleted ? `${page.label} (deleted)` : page.label}
                        </Text>
                        {page.rotation !== 0 && (
                          <Text style={{ fontSize: 11, color: C.warning, fontWeight: '600', marginTop: 2 }}>
                            Rotated {page.rotation}°
                          </Text>
                        )}
                      </View>

                      {/* Move up */}
                      <TouchableOpacity onPress={() => orgMove(idx, -1)} disabled={idx === 0 || page.deleted}
                        style={{ padding: 6, opacity: idx === 0 || page.deleted ? 0.3 : 1 }}>
                        <Ionicons name="chevron-up" size={20} color={C.text2} />
                      </TouchableOpacity>

                      {/* Move down */}
                      <TouchableOpacity onPress={() => orgMove(idx, 1)} disabled={idx === orgPages.length - 1 || page.deleted}
                        style={{ padding: 6, opacity: idx === orgPages.length - 1 || page.deleted ? 0.3 : 1 }}>
                        <Ionicons name="chevron-down" size={20} color={C.text2} />
                      </TouchableOpacity>

                      {/* Rotate */}
                      <TouchableOpacity onPress={() => orgRotate(idx)} disabled={page.deleted}
                        style={{ padding: 6, opacity: page.deleted ? 0.3 : 1 }}>
                        <Ionicons name="refresh" size={20} color={C.warning} />
                      </TouchableOpacity>

                      {/* Delete / Restore */}
                      <TouchableOpacity onPress={() => orgToggleDelete(idx)}
                        style={{ padding: 6 }}>
                        <Ionicons name={page.deleted ? 'add-circle-outline' : 'trash-outline'} size={20} color={page.deleted ? C.success : C.danger} />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}

                  <TouchableOpacity onPress={handleOrgApply} disabled={orgApplying}
                    style={{ backgroundColor: C.primary, borderRadius: 12,
                      padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                    {orgApplying ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Apply Changes</Text></>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        )}

        {/* ── PDF → IMAGES TAB ──────────────────────────────────────────────── */}
        {tab === 5 && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: C.text, marginBottom: 4 }}>PDF to Images</Text>
              <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>
                Convert each PDF page to an image file using PDF.js. Images are saved directly to your photo gallery.
              </Text>

              {!p2iFile ? (
                <TouchableOpacity onPress={pickP2iFile}
                  style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: C.border, borderRadius: 12,
                    padding: 32, alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="images-outline" size={40} color={C.text4} />
                  <Text style={{ color: C.text3, fontWeight: '600', marginTop: 12, fontSize: 15 }}>Select a PDF</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginBottom: 16 }}>
                  <FileCard file={p2iFile} index={0} onRemove={() => { setP2iFile(null); setP2iShowWebView(false); setP2iConverting(false); }} />
                </View>
              )}

              {/* Resolution selector */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text2, marginBottom: 8 }}>Resolution</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {(['1x', '1.5x', '2x'] as const).map(res => (
                  <TouchableOpacity key={res} onPress={() => { Haptics.selectionAsync(); setP2iResolution(res); }}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                      backgroundColor: p2iResolution === res ? C.primary : C.bg,
                      borderWidth: 1, borderColor: p2iResolution === res ? C.primary : C.border }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: p2iResolution === res ? '#fff' : C.text3 }}>{res}</Text>
                    <Text style={{ fontSize: 10, color: p2iResolution === res ? '#e0e7ff' : C.text4, marginTop: 2 }}>
                      {res === '1x' ? '96 DPI' : res === '1.5x' ? '144 DPI' : '192 DPI'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Format selector */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text2, marginBottom: 8 }}>Format</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {(['PNG', 'JPEG'] as const).map(fmt => (
                  <TouchableOpacity key={fmt} onPress={() => { Haptics.selectionAsync(); setP2iFormat(fmt); }}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                      backgroundColor: p2iFormat === fmt ? C.primary : C.bg,
                      borderWidth: 1, borderColor: p2iFormat === fmt ? C.primary : C.border }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: p2iFormat === fmt ? '#fff' : C.text3 }}>{fmt}</Text>
                    <Text style={{ fontSize: 10, color: p2iFormat === fmt ? '#e0e7ff' : C.text4, marginTop: 2 }}>
                      {fmt === 'PNG' ? 'Lossless' : 'Smaller size'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Progress */}
              {p2iConverting && p2iProgress !== '' && (
                <View style={{ backgroundColor: C.primary + '12', borderRadius: 10, padding: 14, marginBottom: 16,
                  flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600' }}>{p2iProgress}</Text>
                    {p2iTotal > 0 && (
                      <View style={{ height: 4, backgroundColor: C.border, borderRadius: 2, marginTop: 6 }}>
                        <View style={{ height: 4, backgroundColor: C.primary, borderRadius: 2,
                          width: `${Math.round((p2iSaved / p2iTotal) * 100)}%` }} />
                      </View>
                    )}
                  </View>
                </View>
              )}

              <TouchableOpacity onPress={handleP2iConvert} disabled={p2iConverting || !p2iFile}
                style={{ backgroundColor: !p2iFile ? C.border : C.primary, borderRadius: 12,
                  padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {p2iConverting ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="image-outline" size={18} color={!p2iFile ? C.text4 : '#fff'} />
                      <Text style={{ color: !p2iFile ? C.text4 : '#fff', fontWeight: '700', fontSize: 15 }}>
                        Convert & Save to Gallery
                      </Text></>}
              </TouchableOpacity>

              <Text style={{ fontSize: 11, color: C.text4, textAlign: 'center', marginTop: 10 }}>
                Uses PDF.js (CDN) in a background WebView. Internet connection required for first use.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── IMAGES → PDF TAB ──────────────────────────────────────────────── */}
        {tab === 6 && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={{ backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: C.text, marginBottom: 4 }}>Images to PDF</Text>
              <Text style={{ fontSize: 13, color: C.text3, marginBottom: 16 }}>
                Select photos, arrange their order, choose a page size, and create a PDF using jsPDF.
              </Text>

              {/* Image list */}
              {i2pImages.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  {i2pImages.map((img, idx) => (
                    <Animated.View key={`${img.uri}-${idx}`} entering={FadeInDown.delay(idx * 40).springify()}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
                        backgroundColor: C.bg, borderRadius: 12, padding: 10,
                        borderWidth: 1, borderColor: C.border }}>

                      {/* Index badge */}
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.primary + '18',
                        justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: C.primary }}>{idx + 1}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }} numberOfLines={1}>{img.name}</Text>
                      </View>

                      {/* Move up */}
                      <TouchableOpacity onPress={() => i2pMove(idx, -1)} disabled={idx === 0}
                        style={{ padding: 6, opacity: idx === 0 ? 0.3 : 1 }}>
                        <Ionicons name="chevron-up" size={20} color={C.text2} />
                      </TouchableOpacity>

                      {/* Move down */}
                      <TouchableOpacity onPress={() => i2pMove(idx, 1)} disabled={idx === i2pImages.length - 1}
                        style={{ padding: 6, opacity: idx === i2pImages.length - 1 ? 0.3 : 1 }}>
                        <Ionicons name="chevron-down" size={20} color={C.text2} />
                      </TouchableOpacity>

                      {/* Remove */}
                      <TouchableOpacity onPress={() => setI2pImages(prev => prev.filter((_, i) => i !== idx))}
                        style={{ padding: 6 }}>
                        <Ionicons name="trash-outline" size={18} color={C.danger} />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* Add images button */}
              <TouchableOpacity onPress={pickI2pImages}
                style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: C.primary, borderRadius: 12,
                  padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                <Ionicons name="add-circle-outline" size={22} color={C.primary} />
                <Text style={{ color: C.primary, fontWeight: '700', fontSize: 15 }}>
                  {i2pImages.length > 0 ? 'Add More Images' : 'Select Images'}
                </Text>
              </TouchableOpacity>

              {i2pImages.length > 0 && (
                <Text style={{ fontSize: 12, color: C.text4, textAlign: 'center', marginBottom: 14 }}>
                  {i2pImages.length} image{i2pImages.length > 1 ? 's' : ''} selected
                </Text>
              )}

              {/* Page size */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.text2, marginBottom: 8 }}>Page Size</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {(['A4', 'Letter', 'Custom'] as const).map(sz => (
                  <TouchableOpacity key={sz} onPress={() => { Haptics.selectionAsync(); setI2pPageSize(sz); }}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                      backgroundColor: i2pPageSize === sz ? C.primary : C.bg,
                      borderWidth: 1, borderColor: i2pPageSize === sz ? C.primary : C.border }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: i2pPageSize === sz ? '#fff' : C.text3 }}>{sz}</Text>
                    <Text style={{ fontSize: 10, color: i2pPageSize === sz ? '#e0e7ff' : C.text4, marginTop: 2 }}>
                      {sz === 'A4' ? '210×297mm' : sz === 'Letter' ? '8.5×11in' : 'Image size'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Progress */}
              {i2pCreating && i2pProgress !== '' && (
                <View style={{ backgroundColor: C.primary + '12', borderRadius: 10, padding: 14, marginBottom: 16,
                  flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600', flex: 1 }}>{i2pProgress}</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleI2pCreate} disabled={i2pCreating || i2pImages.length === 0}
                style={{ backgroundColor: i2pImages.length === 0 ? C.border : C.primary, borderRadius: 12,
                  padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {i2pCreating ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="document-text-outline" size={18} color={i2pImages.length === 0 ? C.text4 : '#fff'} />
                      <Text style={{ color: i2pImages.length === 0 ? C.text4 : '#fff', fontWeight: '700', fontSize: 15 }}>
                        Create PDF
                      </Text></>}
              </TouchableOpacity>

              <Text style={{ fontSize: 11, color: C.text4, textAlign: 'center', marginTop: 10 }}>
                Uses jsPDF (CDN) in a background WebView. Internet connection required for first use.
              </Text>
            </View>
          </Animated.View>
        )}

      </ScrollView>

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
                Alert.alert('Saved!', 'PDF saved to gallery.');
                setResultUri(null);
              } else {
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
                setResultUri(null);
              }
            }}
              style={{ backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Save to Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
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
