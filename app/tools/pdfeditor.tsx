import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Alert, Dimensions, ScrollView, Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const { width: W, height: H } = Dimensions.get('window');

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  primary: '#4f46e5',
  bg: '#1a1a2e',
  surface: '#16213e',
  text: '#f1f5f9',
  text2: '#94a3b8',
  text3: '#64748b',
  border: '#1e3a5f',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
};

// ─── Tool definitions ─────────────────────────────────────────────────────────
type Tool = 'select' | 'text' | 'highlight' | 'draw' | 'eraser';
type StrokeSize = 'S' | 'M' | 'L';

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'draw', icon: 'pencil', label: 'Draw' },
  { id: 'text', icon: 'text', label: 'Text' },
  { id: 'highlight', icon: 'color-fill', label: 'Highlight' },
  { id: 'eraser', icon: 'remove-circle-outline', label: 'Eraser' },
];

const COLORS = [
  { value: '#1a1a1a', label: 'Black' },
  { value: '#ef4444', label: 'Red' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#eab308', label: 'Yellow' },
];

const STROKE_SIZES: { id: StrokeSize; px: number }[] = [
  { id: 'S', px: 2 },
  { id: 'M', px: 5 },
  { id: 'L', px: 10 },
];

// ─── PDF.js WebView HTML ───────────────────────────────────────────────────────
const buildHtml = (pdfUri: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes"/>
<title>PDF Editor</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{
    background:#1a1a2e;
    font-family:sans-serif;
    overflow-x:hidden;
    min-height:100vh;
  }
  #app{
    display:flex;
    flex-direction:column;
    align-items:center;
    padding:8px 0 80px;
    gap:8px;
  }
  #loading{
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    min-height:80vh;
    color:#94a3b8;
    font-size:16px;
    gap:12px;
  }
  .spinner{
    width:40px;height:40px;
    border:3px solid #1e3a5f;
    border-top-color:#4f46e5;
    border-radius:50%;
    animation:spin 0.8s linear infinite;
  }
  @keyframes spin{to{transform:rotate(360deg);}}
  .page-wrapper{
    position:relative;
    display:inline-block;
    box-shadow:0 4px 24px rgba(0,0,0,0.5);
  }
  .page-canvas{
    display:block;
  }
  .annotation-canvas{
    position:absolute;
    top:0;left:0;
    cursor:crosshair;
    touch-action:none;
  }
  .text-input-overlay{
    position:absolute;
    border:2px dashed #4f46e5;
    background:rgba(79,70,229,0.08);
    outline:none;
    font-size:16px;
    color:#1a1a1a;
    padding:4px 8px;
    min-width:80px;
    min-height:28px;
    border-radius:4px;
    resize:both;
    overflow:auto;
    font-family:sans-serif;
    cursor:text;
    z-index:10;
  }
  #error-msg{
    color:#ef4444;
    padding:24px;
    text-align:center;
    font-size:15px;
  }
</style>
</head>
<body>
<div id="app"><div id="loading"><div class="spinner"></div><span>Loading PDF…</span></div></div>

<script>
(function(){
  var pdfUrl = ${JSON.stringify(pdfUri)};
  var pdfjsLib = window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // ── State ──────────────────────────────────────────────
  var currentTool   = 'draw';
  var currentColor  = '#1a1a1a';
  var currentSize   = 5;
  var annotations   = [];   // {type,pageIndex,data}
  var history       = [];   // snapshots for undo (array of annotation arrays)

  // ── Per-page canvas references ──────────────────────────
  var pages = []; // {wrapper, pdfCanvas, annoCanvas, ctx, pageIndex}

  // ── Drawing state ───────────────────────────────────────
  var isDrawing   = false;
  var drawPath    = [];
  var highlightStart = null;

  // ── RN bridge ───────────────────────────────────────────
  function postMsg(type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
    } catch(e){}
  }

  // ── Receive messages from RN ─────────────────────────────
  window.addEventListener('message', function(e) {
    var msg;
    try { msg = JSON.parse(e.data); } catch(e){ return; }
    switch(msg.type) {
      case 'SET_TOOL':   currentTool  = msg.payload; break;
      case 'SET_COLOR':  currentColor = msg.payload; repaintAll(); break;
      case 'SET_SIZE':   currentSize  = msg.payload; break;
      case 'UNDO':       undo(); break;
      case 'GET_ANNOTATIONS':
        postMsg('ANNOTATIONS', annotations);
        break;
      case 'CLEAR_ALL':
        annotations = [];
        history = [];
        repaintAll();
        break;
    }
  });

  // ── Undo ────────────────────────────────────────────────
  function snapshot() {
    history.push(JSON.parse(JSON.stringify(annotations)));
    if (history.length > 50) history.shift();
  }
  function undo() {
    if (history.length === 0) { postMsg('TOAST', 'Nothing to undo'); return; }
    annotations = history.pop();
    repaintAll();
    postMsg('TOAST', 'Undone');
  }

  // ── Repaint all annotation canvases ─────────────────────
  function repaintAll() {
    pages.forEach(function(p) { repaintPage(p); });
  }

  function repaintPage(p) {
    var ctx = p.ctx;
    var w   = p.annoCanvas.width;
    var h   = p.annoCanvas.height;
    ctx.clearRect(0, 0, w, h);

    annotations.forEach(function(ann) {
      if (ann.pageIndex !== p.pageIndex) return;
      renderAnnotation(ctx, ann);
    });
  }

  function renderAnnotation(ctx, ann) {
    if (ann.type === 'draw') {
      if (!ann.data.path || ann.data.path.length < 2) return;
      ctx.save();
      ctx.strokeStyle = ann.data.color;
      ctx.lineWidth   = ann.data.size;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      ctx.moveTo(ann.data.path[0].x, ann.data.path[0].y);
      for (var i = 1; i < ann.data.path.length; i++) {
        ctx.lineTo(ann.data.path[i].x, ann.data.path[i].y);
      }
      ctx.stroke();
      ctx.restore();
    } else if (ann.type === 'highlight') {
      ctx.save();
      ctx.fillStyle = ann.data.color.replace('rgb','rgba').replace(')',',0.35)');
      // If color is hex, convert
      var c = ann.data.color;
      if (c && c[0] === '#') {
        var r = parseInt(c.slice(1,3),16);
        var g = parseInt(c.slice(3,5),16);
        var b = parseInt(c.slice(5,7),16);
        ctx.fillStyle = 'rgba('+r+','+g+','+b+',0.35)';
      }
      ctx.fillRect(ann.data.x, ann.data.y, ann.data.w, ann.data.h);
      ctx.restore();
    } else if (ann.type === 'text') {
      ctx.save();
      ctx.fillStyle = ann.data.color;
      ctx.font      = ann.data.size + 'px sans-serif';
      ctx.fillText(ann.data.text, ann.data.x, ann.data.y + ann.data.size);
      ctx.restore();
    }
  }

  // ── Get pointer position relative to canvas ──────────────
  function getPos(canvas, e) {
    var rect = canvas.getBoundingClientRect();
    var clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    var clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top)  * (canvas.height / rect.height)
    };
  }

  // ── Eraser: remove annotations near point ───────────────
  function eraseNear(pageIndex, x, y) {
    var radius = 20;
    snapshot();
    annotations = annotations.filter(function(ann) {
      if (ann.pageIndex !== pageIndex) return true;
      if (ann.type === 'draw') {
        for (var i = 0; i < ann.data.path.length; i++) {
          var p = ann.data.path[i];
          var dx = p.x - x, dy = p.y - y;
          if (Math.sqrt(dx*dx+dy*dy) < radius) return false;
        }
        return true;
      } else if (ann.type === 'highlight') {
        if (x > ann.data.x && x < ann.data.x + ann.data.w &&
            y > ann.data.y && y < ann.data.y + ann.data.h) return false;
        return true;
      } else if (ann.type === 'text') {
        var dx = ann.data.x - x, dy = ann.data.y - y;
        return Math.sqrt(dx*dx+dy*dy) >= radius;
      }
      return true;
    });
  }

  // ── Bind events to a page's annotation canvas ───────────
  function bindEvents(p) {
    var ac = p.annoCanvas;

    function onStart(e) {
      e.preventDefault();
      var pos = getPos(ac, e);

      if (currentTool === 'draw') {
        snapshot();
        isDrawing = true;
        drawPath  = [pos];
      } else if (currentTool === 'highlight') {
        snapshot();
        isDrawing      = true;
        highlightStart = pos;
      } else if (currentTool === 'eraser') {
        eraseNear(p.pageIndex, pos.x, pos.y);
        repaintPage(p);
      } else if (currentTool === 'text') {
        placeTextInput(p, pos);
      }
    }

    function onMove(e) {
      e.preventDefault();
      if (!isDrawing) return;
      var pos = getPos(ac, e);

      if (currentTool === 'draw') {
        drawPath.push(pos);
        // live preview
        repaintPage(p);
        var ctx = p.ctx;
        ctx.save();
        ctx.strokeStyle = currentColor;
        ctx.lineWidth   = currentSize;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(drawPath[0].x, drawPath[0].y);
        for (var i = 1; i < drawPath.length; i++) ctx.lineTo(drawPath[i].x, drawPath[i].y);
        ctx.stroke();
        ctx.restore();
      } else if (currentTool === 'highlight' && highlightStart) {
        repaintPage(p);
        var ctx = p.ctx;
        var r = parseInt(currentColor.slice(1,3),16);
        var g = parseInt(currentColor.slice(3,5),16);
        var b = parseInt(currentColor.slice(5,7),16);
        ctx.save();
        ctx.fillStyle = 'rgba('+r+','+g+','+b+',0.35)';
        ctx.fillRect(highlightStart.x, highlightStart.y,
          pos.x - highlightStart.x, pos.y - highlightStart.y);
        ctx.restore();
      } else if (currentTool === 'eraser') {
        eraseNear(p.pageIndex, pos.x, pos.y);
        repaintPage(p);
      }
    }

    function onEnd(e) {
      if (!isDrawing) return;
      isDrawing = false;
      var pos = e.changedTouches
        ? getPos(ac, e.changedTouches[0])
        : getPos(ac, e);

      if (currentTool === 'draw' && drawPath.length > 1) {
        annotations.push({
          type: 'draw', pageIndex: p.pageIndex,
          data: { path: drawPath.slice(), color: currentColor, size: currentSize }
        });
        drawPath = [];
        repaintPage(p);
      } else if (currentTool === 'highlight' && highlightStart) {
        var w = pos.x - highlightStart.x;
        var h = pos.y - highlightStart.y;
        if (Math.abs(w) > 4 && Math.abs(h) > 4) {
          annotations.push({
            type: 'highlight', pageIndex: p.pageIndex,
            data: { x: highlightStart.x, y: highlightStart.y, w: w, h: h, color: currentColor }
          });
        }
        highlightStart = null;
        repaintPage(p);
      }
    }

    // Touch events
    ac.addEventListener('touchstart', onStart, { passive: false });
    ac.addEventListener('touchmove',  onMove,  { passive: false });
    ac.addEventListener('touchend',   onEnd,   { passive: false });
    // Mouse events (web/simulator)
    ac.addEventListener('mousedown', onStart);
    ac.addEventListener('mousemove', onMove);
    ac.addEventListener('mouseup',   onEnd);
  }

  // ── Text tool: place a contenteditable div ───────────────
  function placeTextInput(p, pos) {
    var wrapper = p.wrapper;
    var inp = document.createElement('textarea');
    inp.className = 'text-input-overlay';

    var rect     = p.annoCanvas.getBoundingClientRect();
    var scaleX   = p.annoCanvas.width  / rect.width;
    var scaleY   = p.annoCanvas.height / rect.height;
    inp.style.left   = (pos.x / scaleX) + 'px';
    inp.style.top    = (pos.y / scaleY) + 'px';
    inp.style.color  = currentColor;
    inp.style.fontSize = (currentSize * 3) + 'px';

    wrapper.appendChild(inp);
    inp.focus();

    function commit() {
      var txt = inp.value.trim();
      if (txt) {
        snapshot();
        annotations.push({
          type: 'text', pageIndex: p.pageIndex,
          data: { x: pos.x, y: pos.y, text: txt, color: currentColor, size: currentSize * 3 }
        });
        repaintPage(p);
      }
      wrapper.removeChild(inp);
    }

    inp.addEventListener('blur', commit);
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { wrapper.removeChild(inp); }
    });
  }

  // ── Render PDF ───────────────────────────────────────────
  var app = document.getElementById('app');

  pdfjsLib.getDocument(pdfUrl).promise.then(function(pdfDoc) {
    app.innerHTML = '';
    var total = pdfDoc.numPages;
    var renderQueue = Promise.resolve();

    for (var i = 1; i <= total; i++) {
      (function(pageNum) {
        renderQueue = renderQueue.then(function() {
          return pdfDoc.getPage(pageNum).then(function(page) {
            var vp      = page.getViewport({ scale: 1.5 });
            var wrapper = document.createElement('div');
            wrapper.className = 'page-wrapper';
            wrapper.style.width  = vp.width + 'px';
            wrapper.style.maxWidth = '100%';

            var pdfCanvas    = document.createElement('canvas');
            pdfCanvas.className = 'page-canvas';
            pdfCanvas.width  = vp.width;
            pdfCanvas.height = vp.height;
            pdfCanvas.style.width  = '100%';
            pdfCanvas.style.height = 'auto';

            var annoCanvas    = document.createElement('canvas');
            annoCanvas.className = 'annotation-canvas';
            annoCanvas.width  = vp.width;
            annoCanvas.height = vp.height;
            annoCanvas.style.width  = '100%';
            annoCanvas.style.height = '100%';

            wrapper.appendChild(pdfCanvas);
            wrapper.appendChild(annoCanvas);
            app.appendChild(wrapper);

            var pageObj = {
              wrapper:    wrapper,
              pdfCanvas:  pdfCanvas,
              annoCanvas: annoCanvas,
              ctx:        annoCanvas.getContext('2d'),
              pageIndex:  pageNum - 1
            };
            pages.push(pageObj);
            bindEvents(pageObj);

            return page.render({
              canvasContext: pdfCanvas.getContext('2d'),
              viewport:      vp
            }).promise;
          });
        });
      })(i);
    }

    renderQueue.then(function() {
      postMsg('LOADED', { pages: total });
    });

  }).catch(function(err) {
    app.innerHTML = '<div id="error-msg">Failed to load PDF.<br/>' + err.message + '</div>';
    postMsg('ERROR', err.message);
  });

})();
</script>
</body>
</html>
`;

// ─── Main component ───────────────────────────────────────────────────────────
export default function PdfEditorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  const [pdfFile, setPdfFile]       = useState<{ uri: string; name: string } | null>(null);
  const [loading, setLoading]       = useState(false);
  const [pdfLoaded, setPdfLoaded]   = useState(false);
  const [pdfError, setPdfError]     = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('draw');
  const [activeColor, setActiveColor] = useState(COLORS[0].value);
  const [activeSize, setActiveSize]   = useState<StrokeSize>('M');
  const [toast, setToast]             = useState<string | null>(null);

  // ── Toast helper ──────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  // ── Inject JS helpers ─────────────────────────────────────
  const inject = useCallback((js: string) => {
    webViewRef.current?.injectJavaScript(js + '; true;');
  }, []);

  // ── Pick PDF ───────────────────────────────────────────────
  const pickPdf = async () => {
    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled) { setLoading(false); return; }
      const asset = result.assets[0];
      setPdfFile({ uri: asset.uri, name: asset.name ?? 'document.pdf' });
      setPdfLoaded(false);
      setPdfError(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not open file');
    } finally {
      setLoading(false);
    }
  };

  // ── Tool change ────────────────────────────────────────────
  const changeTool = (tool: Tool) => {
    setActiveTool(tool);
    Haptics.selectionAsync();
    inject(`window.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'SET_TOOL',payload:'${tool}'})}));`);
  };

  // ── Color change ───────────────────────────────────────────
  const changeColor = (color: string) => {
    setActiveColor(color);
    Haptics.selectionAsync();
    inject(`window.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'SET_COLOR',payload:'${color}'})}));`);
  };

  // ── Size change ────────────────────────────────────────────
  const changeSize = (s: StrokeSize) => {
    setActiveSize(s);
    const px = STROKE_SIZES.find(x => x.id === s)?.px ?? 5;
    Haptics.selectionAsync();
    inject(`window.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'SET_SIZE',payload:${px}})}));`);
  };

  // ── Undo ───────────────────────────────────────────────────
  const undo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    inject(`window.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'UNDO'})}));`);
  };

  // ── Save / Share ───────────────────────────────────────────
  const saveAndShare = async () => {
    if (!pdfFile) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Request annotations from WebView, then share original PDF
    inject(`window.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'GET_ANNOTATIONS'})}));`);
    // Share original PDF (annotation flattening requires native lib)
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) { Alert.alert('Sharing not available on this device'); return; }
      await Sharing.shareAsync(pdfFile.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share PDF',
        UTI: 'com.adobe.pdf',
      });
    } catch (e: any) {
      Alert.alert('Share Error', e?.message ?? 'Could not share file');
    }
  };

  // ── WebView message handler ────────────────────────────────
  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; payload: any };
      switch (msg.type) {
        case 'LOADED':
          setPdfLoaded(true);
          setPdfError(null);
          showToast(`PDF loaded — ${msg.payload.pages} page${msg.payload.pages !== 1 ? 's' : ''}`);
          break;
        case 'ERROR':
          setPdfError(msg.payload ?? 'Unknown error');
          setPdfLoaded(false);
          break;
        case 'TOAST':
          showToast(msg.payload);
          break;
        case 'ANNOTATIONS':
          // Could persist/export here; for now just acknowledge
          break;
      }
    } catch (_) {}
  }, [showToast]);

  // ── Derived ────────────────────────────────────────────────
  const htmlContent = pdfFile ? buildHtml(pdfFile.uri) : '';

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>

      {/* ── Header ── */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingVertical: 12,
          backgroundColor: C.surface,
          borderBottomWidth: 1, borderBottomColor: C.border,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: 'rgba(79,70,229,0.15)',
            justifyContent: 'center', alignItems: 'center',
          }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color={C.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontWeight: '700', fontSize: 16 }}>PDF Editor</Text>
          {pdfFile && (
            <Text style={{ color: C.text2, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
              {pdfFile.name}
            </Text>
          )}
        </View>

        {pdfFile && (
          <TouchableOpacity
            onPress={pickPdf}
            style={{
              paddingHorizontal: 12, paddingVertical: 7,
              borderRadius: 10, backgroundColor: 'rgba(79,70,229,0.15)',
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
            accessibilityLabel="Open different PDF"
            accessibilityRole="button"
          >
            <Ionicons name="folder-open-outline" size={16} color={C.primary} />
            <Text style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>Open</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Body ── */}
      {!pdfFile ? (
        // ── Upload card ──
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Animated.View
            entering={FadeInDown.duration(450).springify()}
            style={{
              width: '100%', backgroundColor: C.surface,
              borderRadius: 24, padding: 36, alignItems: 'center',
              borderWidth: 2, borderColor: C.border, borderStyle: 'dashed',
              gap: 16,
            }}
          >
            <View style={{
              width: 80, height: 80, borderRadius: 24,
              backgroundColor: 'rgba(79,70,229,0.15)',
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Ionicons name="document-text" size={38} color={C.primary} />
            </View>
            <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
              Open a PDF to Edit
            </Text>
            <Text style={{ color: C.text2, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              Annotate, draw, highlight, and add text on top of any PDF document.
            </Text>
            <TouchableOpacity
              onPress={pickPdf}
              disabled={loading}
              style={{
                backgroundColor: C.primary, borderRadius: 14,
                paddingHorizontal: 28, paddingVertical: 14,
                flexDirection: 'row', alignItems: 'center', gap: 8,
                marginTop: 8, opacity: loading ? 0.7 : 1,
              }}
              accessibilityLabel="Pick PDF file"
              accessibilityRole="button"
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="add-circle-outline" size={20} color="#fff" />
              }
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {loading ? 'Opening…' : 'Choose PDF'}
              </Text>
            </TouchableOpacity>

            {/* Feature chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 }}>
              {['Draw', 'Text', 'Highlight', 'Erase', 'Undo', 'Share'].map(f => (
                <View key={f} style={{
                  backgroundColor: 'rgba(79,70,229,0.1)',
                  borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
                }}>
                  <Text style={{ color: C.primary, fontSize: 12, fontWeight: '600' }}>{f}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      ) : (
        // ── Editor area ──
        <View style={{ flex: 1 }}>
          {/* PDF WebView */}
          <View style={{ flex: 1, position: 'relative' }}>
            <WebView
              ref={webViewRef}
              source={{ html: htmlContent, baseUrl: '' }}
              style={{ flex: 1, backgroundColor: C.bg }}
              onMessage={onMessage}
              javaScriptEnabled
              domStorageEnabled
              allowFileAccess
              allowUniversalAccessFromFileURLs
              allowFileAccessFromFileURLs
              originWhitelist={['*']}
              mixedContentMode="always"
              scalesPageToFit={false}
              onError={(e) => setPdfError(e.nativeEvent.description)}
            />

            {/* Loading overlay while PDF.js is initialising */}
            {!pdfLoaded && !pdfError && (
              <View style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: C.bg,
                justifyContent: 'center', alignItems: 'center', gap: 12,
              }}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={{ color: C.text2, fontSize: 14 }}>Rendering PDF…</Text>
              </View>
            )}

            {/* Error overlay */}
            {pdfError && (
              <View style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: C.bg,
                justifyContent: 'center', alignItems: 'center',
                padding: 32, gap: 16,
              }}>
                <Ionicons name="alert-circle" size={48} color={C.danger} />
                <Text style={{ color: C.text, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                  Could not load PDF
                </Text>
                <Text style={{ color: C.text2, fontSize: 13, textAlign: 'center' }}>{pdfError}</Text>
                <TouchableOpacity
                  onPress={pickPdf}
                  style={{
                    backgroundColor: C.primary, borderRadius: 12,
                    paddingHorizontal: 24, paddingVertical: 12,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Try another file"
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Try Another File</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Toast */}
            {toast && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={{
                  position: 'absolute', bottom: 8, left: 16, right: 16,
                  backgroundColor: 'rgba(30,58,95,0.95)',
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
                  alignItems: 'center',
                  borderWidth: 1, borderColor: C.border,
                }}
              >
                <Text style={{ color: C.text, fontSize: 13, fontWeight: '500' }}>{toast}</Text>
              </Animated.View>
            )}
          </View>

          {/* ── Bottom control bar ── */}
          <Animated.View
            entering={FadeInDown.duration(350).springify()}
            style={{
              backgroundColor: C.surface,
              borderTopWidth: 1, borderTopColor: C.border,
              paddingBottom: insets.bottom + 4,
            }}
          >
            {/* Tool row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 12, paddingTop: 10, gap: 6,
              }}
            >
              {TOOLS.map(tool => (
                <TouchableOpacity
                  key={tool.id}
                  onPress={() => changeTool(tool.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 14, paddingVertical: 8,
                    borderRadius: 12,
                    backgroundColor: activeTool === tool.id
                      ? C.primary
                      : 'rgba(79,70,229,0.1)',
                    borderWidth: 1,
                    borderColor: activeTool === tool.id ? C.primary : 'transparent',
                  }}
                  accessibilityLabel={tool.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeTool === tool.id }}
                >
                  <Ionicons
                    name={tool.icon as any}
                    size={17}
                    color={activeTool === tool.id ? '#fff' : C.primary}
                  />
                  <Text style={{
                    fontSize: 13, fontWeight: '600',
                    color: activeTool === tool.id ? '#fff' : C.primary,
                  }}>
                    {tool.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Divider */}
              <View style={{ width: 1, height: 28, backgroundColor: C.border, marginHorizontal: 4 }} />

              {/* Undo */}
              <TouchableOpacity
                onPress={undo}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: 'rgba(239,68,68,0.1)',
                }}
                accessibilityLabel="Undo last action"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-undo" size={17} color={C.danger} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.danger }}>Undo</Text>
              </TouchableOpacity>

              {/* Save/Share */}
              <TouchableOpacity
                onPress={saveAndShare}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: 'rgba(16,185,129,0.15)',
                }}
                accessibilityLabel="Save and share PDF"
                accessibilityRole="button"
              >
                <Ionicons name="share-outline" size={17} color={C.success} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.success }}>Share</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Color + size row */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6,
              gap: 10,
            }}>
              {/* Color label */}
              <Text style={{ color: C.text3, fontSize: 12, fontWeight: '600', minWidth: 40 }}>Color</Text>

              {/* Color swatches */}
              <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
                {COLORS.map(col => (
                  <TouchableOpacity
                    key={col.value}
                    onPress={() => changeColor(col.value)}
                    style={{
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: col.value,
                      borderWidth: activeColor === col.value ? 2.5 : 1.5,
                      borderColor: activeColor === col.value ? '#fff' : 'rgba(255,255,255,0.2)',
                      shadowColor: activeColor === col.value ? col.value : 'transparent',
                      shadowRadius: 6, shadowOpacity: 0.6,
                      elevation: activeColor === col.value ? 4 : 0,
                    }}
                    accessibilityLabel={col.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activeColor === col.value }}
                  />
                ))}
              </View>

              {/* Divider */}
              <View style={{ width: 1, height: 22, backgroundColor: C.border }} />

              {/* Stroke size */}
              <Text style={{ color: C.text3, fontSize: 12, fontWeight: '600' }}>Size</Text>
              {STROKE_SIZES.map(s => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => changeSize(s.id)}
                  style={{
                    width: 34, height: 30, borderRadius: 8,
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: activeSize === s.id
                      ? C.primary
                      : 'rgba(79,70,229,0.1)',
                  }}
                  accessibilityLabel={`Stroke size ${s.id}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeSize === s.id }}
                >
                  <Text style={{
                    fontSize: 13, fontWeight: '700',
                    color: activeSize === s.id ? '#fff' : C.primary,
                  }}>
                    {s.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// Minimal StyleSheet shim so absoluteFillObject works without importing StyleSheet
const StyleSheet = {
  absoluteFillObject: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
  },
};
