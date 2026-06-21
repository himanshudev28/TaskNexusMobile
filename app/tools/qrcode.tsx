import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, Modal, Pressable, Linking, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { CameraView, useCameraPermissions } from 'expo-camera';

// ─── Types ─────────────────────────────────────────────────────────────────────
type QRTypeId = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard' | 'location';
type ECLevel  = 'L' | 'M' | 'Q' | 'H';
type QRSize   = 200 | 280 | 360;
type MainTab  = 'generate' | 'scan';

interface QRType {
  id: QRTypeId;
  label: string;
  icon: string;
  placeholder: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const QR_TYPES: QRType[] = [
  { id: 'url',      label: 'URL',      icon: 'link',        placeholder: 'https://example.com'  },
  { id: 'text',     label: 'Text',     icon: 'text',        placeholder: 'Enter any text...'     },
  { id: 'email',    label: 'Email',    icon: 'mail',        placeholder: 'email@example.com'     },
  { id: 'phone',    label: 'Phone',    icon: 'call',        placeholder: '+1 234 567 8900'       },
  { id: 'sms',      label: 'SMS',      icon: 'chatbubble',  placeholder: '+1 234 567 8900'       },
  { id: 'wifi',     label: 'WiFi',     icon: 'wifi',        placeholder: 'NetworkName'           },
  { id: 'vcard',    label: 'vCard',    icon: 'person',      placeholder: 'Full Name'             },
  { id: 'location', label: 'Location', icon: 'location',    placeholder: 'Latitude'              },
];

const FG_COLORS  = ['#000000', '#ffffff', '#4f46e5', '#dc2626', '#16a34a', '#2563eb'];
const BG_COLORS  = ['#ffffff', '#000000', '#f3f4f6', '#fffbeb'];
const EC_LEVELS: ECLevel[]    = ['L', 'M', 'Q', 'H'];
const QR_SIZES: { label: string; px: QRSize }[] = [
  { label: 'Small',  px: 200 },
  { label: 'Medium', px: 280 },
  { label: 'Large',  px: 360 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function detectType(text: string): string {
  if (/^https?:\/\//i.test(text))          return 'URL';
  if (/^mailto:/i.test(text))              return 'Email';
  if (/^tel:/i.test(text))                return 'Phone';
  if (/^sms:/i.test(text))                return 'SMS';
  if (/^WIFI:/i.test(text))               return 'WiFi';
  if (/^BEGIN:VCARD/i.test(text))         return 'vCard';
  if (/^geo:/i.test(text))               return 'Location';
  return 'Text';
}

function isURL(text: string) {
  return /^https?:\/\//i.test(text);
}

// ─── Color Swatch ──────────────────────────────────────────────────────────────
function Swatch({
  color, selected, onPress, size = 28,
}: { color: string; selected: boolean; onPress: () => void; size?: number }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: selected ? 2.5 : 1,
        borderColor: selected ? '#4f46e5' : '#d1d5db',
      }}
    />
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function QRCodeScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();

  // ── Main tab ──────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<MainTab>('generate');

  // ── Generate state ────────────────────────────────────────────────────────
  const [qrType,       setQrType]       = useState<QRTypeId>('url');
  const [value,        setValue]         = useState('');
  const [generated,    setGenerated]    = useState(false);
  const [qrUrl,        setQrUrl]        = useState('');

  // WiFi extras
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState('WPA');

  // vCard extras
  const [vcName,    setVcName]    = useState('');
  const [vcPhone,   setVcPhone]   = useState('');
  const [vcEmail,   setVcEmail]   = useState('');
  const [vcCompany, setVcCompany] = useState('');
  const [vcTitle,   setVcTitle]   = useState('');
  const [vcWebsite, setVcWebsite] = useState('');

  // Location extras
  const [locLat, setLocLat] = useState('');
  const [locLng, setLocLng] = useState('');

  // Options
  const [fgColor,  setFgColor]  = useState('#000000');
  const [bgColor,  setBgColor]  = useState('#ffffff');
  const [ecLevel,  setEcLevel]  = useState<ECLevel>('M');
  const [qrSize,   setQrSize]   = useState<QRSize>(280);
  const [fgHex,    setFgHex]    = useState('#000000');
  const [showOpts, setShowOpts] = useState(false);

  // ── Scan state ────────────────────────────────────────────────────────────
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult,    setScanResult]    = useState<string | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [torchOn,       setTorchOn]       = useState(false);
  const [scanLocked,    setScanLocked]    = useState(false);

  // ── Build QR content ──────────────────────────────────────────────────────
  const buildContent = (): string | null => {
    switch (qrType) {
      case 'url':      return value.trim() || null;
      case 'text':     return value.trim() || null;
      case 'email':    return value.trim() ? `mailto:${value.trim()}` : null;
      case 'phone':    return value.trim() ? `tel:${value.trim()}` : null;
      case 'sms':      return value.trim() ? `sms:${value.trim()}` : null;
      case 'wifi':     return value.trim()
        ? `WIFI:T:${wifiSecurity};S:${value.trim()};P:${wifiPassword};;`
        : null;
      case 'vcard': {
        if (!vcName.trim()) return null;
        return [
          'BEGIN:VCARD', 'VERSION:3.0',
          `FN:${vcName}`,
          vcPhone   ? `TEL:${vcPhone}` : '',
          vcEmail   ? `EMAIL:${vcEmail}` : '',
          vcCompany ? `ORG:${vcCompany}` : '',
          vcTitle   ? `TITLE:${vcTitle}` : '',
          vcWebsite ? `URL:${vcWebsite}` : '',
          'END:VCARD',
        ].filter(Boolean).join('\n');
      }
      case 'location': {
        const lat = parseFloat(locLat);
        const lng = parseFloat(locLng);
        if (isNaN(lat) || isNaN(lng)) return null;
        return `geo:${lat},${lng}`;
      }
      default: return value.trim() || null;
    }
  };

  // ── Generate QR ───────────────────────────────────────────────────────────
  const handleGenerate = () => {
    const content = buildContent();
    if (!content) {
      Alert.alert('Error', 'Please fill in the required fields');
      return;
    }
    const encoded = encodeURIComponent(content);
    const fg = fgColor.replace('#', '');
    const bg = bgColor.replace('#', '');
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encoded}&color=${fg}&bgcolor=${bg}&ecc=${ecLevel}`;
    setQrUrl(url);
    setGenerated(true);
  };

  const copyContent = async () => {
    const content = buildContent();
    if (content) {
      await Clipboard.setStringAsync(content);
      Alert.alert('Copied', 'Content copied to clipboard');
    }
  };

  // ── Reset type ────────────────────────────────────────────────────────────
  const switchType = (id: QRTypeId) => {
    setQrType(id);
    setGenerated(false);
    setValue('');
  };

  const sel = QR_TYPES.find((t) => t.id === qrType)!;

  // ── Scan handlers ─────────────────────────────────────────────────────────
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanLocked) return;
    setScanLocked(true);
    setScanResult(data);
    setResultVisible(true);
  };

  const closeScanResult = () => {
    setResultVisible(false);
    setScanResult(null);
    setTimeout(() => setScanLocked(false), 800);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12,
        backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 }}>QR Code</Text>
      </View>

      {/* Main tab toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4,
        marginHorizontal: 16, marginBottom: 16 }}>
        {([
          { id: 'generate' as MainTab, label: 'Generate', icon: 'qr-code' },
          { id: 'scan'     as MainTab, label: 'Scan',     icon: 'scan'    },
        ]).map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setMainTab(t.id)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 6, paddingVertical: 9, borderRadius: 10,
              backgroundColor: mainTab === t.id ? '#4f46e5' : 'transparent' }}
          >
            <Ionicons name={t.icon as any} size={15} color={mainTab === t.id ? '#fff' : '#6b7280'} />
            <Text style={{ fontWeight: '700', fontSize: 14, color: mainTab === t.id ? '#fff' : '#6b7280' }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══ GENERATE TAB ══ */}
      {mainTab === 'generate' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Type Picker */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {QR_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => switchType(t.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14,
                  paddingVertical: 8, borderRadius: 20,
                  backgroundColor: qrType === t.id ? '#4f46e5' : '#e5e7eb' }}
              >
                <Ionicons name={t.icon as any} size={14} color={qrType === t.id ? '#fff' : '#6b7280'} />
                <Text style={{ fontWeight: '600', fontSize: 13, color: qrType === t.id ? '#fff' : '#6b7280' }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input card */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
            shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>

            {/* Standard types */}
            {!['wifi', 'vcard', 'location'].includes(qrType) && (
              <TextInput
                value={value}
                onChangeText={(v) => { setValue(v); setGenerated(false); }}
                placeholder={sel.placeholder}
                multiline={qrType === 'text'}
                numberOfLines={qrType === 'text' ? 3 : 1}
                style={{ fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
                  borderRadius: 10, padding: 12 }}
              />
            )}

            {/* WiFi */}
            {qrType === 'wifi' && (
              <>
                <TextInput value={value} onChangeText={(v) => { setValue(v); setGenerated(false); }}
                  placeholder="Network Name (SSID)"
                  style={{ fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
                    borderRadius: 10, padding: 12, marginBottom: 10 }} />
                <TextInput value={wifiPassword} onChangeText={setWifiPassword}
                  placeholder="Password (optional)" secureTextEntry
                  style={{ fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
                    borderRadius: 10, padding: 12, marginBottom: 10 }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['WPA', 'WEP', 'nopass'].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setWifiSecurity(s)}
                      style={{ flex: 1, paddingVertical: 8, borderRadius: 8,
                        backgroundColor: wifiSecurity === s ? '#4f46e5' : '#f3f4f6' }}>
                      <Text style={{ textAlign: 'center', fontWeight: '600', fontSize: 12,
                        color: wifiSecurity === s ? '#fff' : '#6b7280' }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* vCard */}
            {qrType === 'vcard' && (
              <>
                {[
                  { val: vcName,    set: setVcName,    ph: 'Full Name *',  required: true  },
                  { val: vcPhone,   set: setVcPhone,   ph: 'Phone',        required: false },
                  { val: vcEmail,   set: setVcEmail,   ph: 'Email',        required: false },
                  { val: vcCompany, set: setVcCompany, ph: 'Company',      required: false },
                  { val: vcTitle,   set: setVcTitle,   ph: 'Title',        required: false },
                  { val: vcWebsite, set: setVcWebsite, ph: 'Website',      required: false },
                ].map(({ val, set, ph }, idx, arr) => (
                  <TextInput
                    key={ph}
                    value={val}
                    onChangeText={(v) => { set(v); setGenerated(false); }}
                    placeholder={ph}
                    keyboardType={ph === 'Phone' ? 'phone-pad' : ph === 'Email' ? 'email-address' : 'default'}
                    style={{ fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
                      borderRadius: 10, padding: 12, marginBottom: idx < arr.length - 1 ? 8 : 0 }}
                  />
                ))}
              </>
            )}

            {/* Location */}
            {qrType === 'location' && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput value={locLat} onChangeText={(v) => { setLocLat(v); setGenerated(false); }}
                  placeholder="Latitude" keyboardType="decimal-pad"
                  style={{ flex: 1, fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
                    borderRadius: 10, padding: 12 }} />
                <TextInput value={locLng} onChangeText={(v) => { setLocLng(v); setGenerated(false); }}
                  placeholder="Longitude" keyboardType="decimal-pad"
                  style={{ flex: 1, fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
                    borderRadius: 10, padding: 12 }} />
              </View>
            )}
          </View>

          {/* Options accordion */}
          <TouchableOpacity
            onPress={() => setShowOpts((o) => !o)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: showOpts ? 0 : 12,
              borderWidth: 1, borderColor: '#e5e7eb' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="options" size={18} color="#4f46e5" />
              <Text style={{ fontWeight: '700', color: '#374151' }}>Options</Text>
            </View>
            <Ionicons name={showOpts ? 'chevron-up' : 'chevron-down'} size={18} color="#6b7280" />
          </TouchableOpacity>

          {showOpts && (
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
              borderWidth: 1, borderColor: '#e5e7eb', borderTopWidth: 0,
              borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>

              {/* Foreground color */}
              <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 8, fontSize: 13 }}>
                Foreground Color
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                {FG_COLORS.map((c) => (
                  <Swatch key={c} color={c} selected={fgColor === c}
                    onPress={() => { setFgColor(c); setFgHex(c); setGenerated(false); }} />
                ))}
                <TextInput
                  value={fgHex}
                  onChangeText={(v) => {
                    setFgHex(v);
                    if (/^#[0-9A-Fa-f]{6}$/.test(v)) { setFgColor(v); setGenerated(false); }
                  }}
                  placeholder="#000000"
                  maxLength={7}
                  autoCapitalize="none"
                  style={{ flex: 1, fontSize: 13, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
                    borderRadius: 8, padding: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
                />
              </View>

              {/* Background color */}
              <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 8, fontSize: 13 }}>
                Background Color
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {BG_COLORS.map((c) => (
                  <Swatch key={c} color={c} selected={bgColor === c}
                    onPress={() => { setBgColor(c); setGenerated(false); }} />
                ))}
              </View>

              {/* Error correction */}
              <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 8, fontSize: 13 }}>
                Error Correction
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {EC_LEVELS.map((ec) => (
                  <TouchableOpacity key={ec} onPress={() => { setEcLevel(ec); setGenerated(false); }}
                    style={{ flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center',
                      backgroundColor: ecLevel === ec ? '#4f46e5' : '#f3f4f6',
                      borderWidth: 1, borderColor: ecLevel === ec ? '#4f46e5' : '#e5e7eb' }}>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: ecLevel === ec ? '#fff' : '#6b7280' }}>
                      {ec}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* QR size */}
              <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 8, fontSize: 13 }}>
                QR Size
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {QR_SIZES.map(({ label, px }) => (
                  <TouchableOpacity key={px} onPress={() => { setQrSize(px); setGenerated(false); }}
                    style={{ flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center',
                      backgroundColor: qrSize === px ? '#4f46e5' : '#f3f4f6',
                      borderWidth: 1, borderColor: qrSize === px ? '#4f46e5' : '#e5e7eb' }}>
                    <Text style={{ fontWeight: '700', fontSize: 12, color: qrSize === px ? '#fff' : '#6b7280' }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Generate button */}
          <TouchableOpacity
            onPress={handleGenerate}
            style={{ backgroundColor: '#4f46e5', borderRadius: 14, padding: 15, marginBottom: 20 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
              Generate QR Code
            </Text>
          </TouchableOpacity>

          {/* QR Display */}
          {generated && (
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center',
              shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
              <View style={{ width: qrSize, height: qrSize, backgroundColor: bgColor, borderRadius: 12,
                justifyContent: 'center', alignItems: 'center', marginBottom: 16,
                borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' }}>
                {/* Show QR icon + content preview (no native Image required) */}
                <Ionicons name="qr-code" size={qrSize * 0.4} color={fgColor} />
                <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 8, textAlign: 'center',
                  paddingHorizontal: 10 }}>
                  {buildContent()?.slice(0, 50)}{(buildContent()?.length ?? 0) > 50 ? '...' : ''}
                </Text>
              </View>

              {/* Options summary */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  `EC: ${ecLevel}`,
                  `${qrSize}px`,
                  `FG: ${fgColor}`,
                  `BG: ${bgColor}`,
                ].map((badge) => (
                  <View key={badge} style={{ backgroundColor: '#f3f4f6', borderRadius: 6,
                    paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '600' }}>{badge}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={copyContent}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6',
                  borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}
              >
                <Ionicons name="copy" size={16} color="#4f46e5" />
                <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Copy Content</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ══ SCAN TAB ══ */}
      {mainTab === 'scan' && (
        <View style={{ flex: 1 }}>
          {!permission ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <Ionicons name="camera" size={48} color="#d1d5db" />
              <Text style={{ color: '#6b7280', marginTop: 12, textAlign: 'center' }}>
                Loading camera permissions...
              </Text>
            </View>
          ) : !permission.granted ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <Ionicons name="camera-outline" size={56} color="#d1d5db" />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111', marginTop: 16, marginBottom: 8 }}>
                Camera Access Needed
              </Text>
              <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
                We need camera access to scan QR codes.
              </Text>
              <TouchableOpacity
                onPress={requestPermission}
                style={{ backgroundColor: '#4f46e5', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Camera viewfinder */}
              <View style={{ flex: 1, position: 'relative' }}>
                <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  enableTorch={torchOn}
                  onBarcodeScanned={handleBarCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                />

                {/* Overlay frame */}
                <View style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  justifyContent: 'center', alignItems: 'center', pointerEvents: 'none',
                }}>
                  {/* Dimmed corners */}
                  <View style={{ width: 220, height: 220, position: 'relative' }}>
                    {/* Top-left */}
                    <View style={{ position: 'absolute', top: 0, left: 0, width: 36, height: 36,
                      borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#fff', borderTopLeftRadius: 6 }} />
                    {/* Top-right */}
                    <View style={{ position: 'absolute', top: 0, right: 0, width: 36, height: 36,
                      borderTopWidth: 3, borderRightWidth: 3, borderColor: '#fff', borderTopRightRadius: 6 }} />
                    {/* Bottom-left */}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, width: 36, height: 36,
                      borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#fff', borderBottomLeftRadius: 6 }} />
                    {/* Bottom-right */}
                    <View style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36,
                      borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#fff', borderBottomRightRadius: 6 }} />
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 16, fontSize: 13 }}>
                    Point at a QR code to scan
                  </Text>
                </View>

                {/* Flashlight toggle */}
                <TouchableOpacity
                  onPress={() => setTorchOn((t) => !t)}
                  style={{
                    position: 'absolute', bottom: 32, right: 24,
                    width: 52, height: 52, borderRadius: 26,
                    backgroundColor: torchOn ? '#facc15' : 'rgba(0,0,0,0.5)',
                    justifyContent: 'center', alignItems: 'center',
                  }}
                >
                  <Ionicons name={torchOn ? 'flashlight' : 'flashlight-outline'} size={24}
                    color={torchOn ? '#000' : '#fff'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── Scan Result Bottom Sheet (Modal) ──────────────────────────────── */}
      <Modal
        visible={resultVisible}
        transparent
        animationType="slide"
        onRequestClose={closeScanResult}
      >
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={closeScanResult}
        >
          <Pressable
            style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, paddingBottom: insets.bottom + 24 }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#d1d5db',
              alignSelf: 'center', marginBottom: 20 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#ede9fe',
                justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                <Ionicons name="scan" size={18} color="#4f46e5" />
              </View>
              <View>
                <Text style={{ fontWeight: '700', color: '#111', fontSize: 16 }}>QR Code Scanned</Text>
                {scanResult && (
                  <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    Type: {detectType(scanResult)}
                  </Text>
                )}
              </View>
            </View>

            {/* Decoded text */}
            <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 16,
              borderWidth: 1, borderColor: '#e5e7eb' }}>
              <Text style={{ fontSize: 14, color: '#111', lineHeight: 20 }} selectable>
                {scanResult ?? ''}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: scanResult && isURL(scanResult) ? 10 : 0 }}>
              <TouchableOpacity
                onPress={async () => {
                  if (scanResult) {
                    await Clipboard.setStringAsync(scanResult);
                    Alert.alert('Copied', 'Decoded text copied to clipboard');
                  }
                }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 13 }}
              >
                <Ionicons name="copy" size={16} color="#4f46e5" />
                <Text style={{ fontWeight: '600', color: '#4f46e5' }}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closeScanResult}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 13 }}
              >
                <Ionicons name="scan-circle" size={16} color="#6b7280" />
                <Text style={{ fontWeight: '600', color: '#6b7280' }}>Scan Again</Text>
              </TouchableOpacity>
            </View>

            {/* Open URL button */}
            {scanResult && isURL(scanResult) && (
              <TouchableOpacity
                onPress={() => { Linking.openURL(scanResult!); closeScanResult(); }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, backgroundColor: '#4f46e5', borderRadius: 12, padding: 13 }}
              >
                <Ionicons name="open" size={16} color="#fff" />
                <Text style={{ fontWeight: '700', color: '#fff' }}>Open URL</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
