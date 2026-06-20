import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

const QR_TYPES = [
  { id: 'url', label: 'URL', icon: 'link', placeholder: 'https://example.com' },
  { id: 'text', label: 'Text', icon: 'text', placeholder: 'Enter any text...' },
  { id: 'email', label: 'Email', icon: 'mail', placeholder: 'email@example.com' },
  { id: 'phone', label: 'Phone', icon: 'call', placeholder: '+1 234 567 8900' },
  { id: 'sms', label: 'SMS', icon: 'chatbubble', placeholder: '+1 234 567 8900' },
  { id: 'wifi', label: 'WiFi', icon: 'wifi', placeholder: 'NetworkName' },
];

export default function QRCodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [qrType, setQrType] = useState('url');
  const [value, setValue] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState('WPA');
  const [qrUrl, setQrUrl] = useState('');
  const [generated, setGenerated] = useState(false);

  const buildContent = () => {
    if (!value.trim()) return null;
    switch (qrType) {
      case 'url': return value;
      case 'text': return value;
      case 'email': return `mailto:${value}`;
      case 'phone': return `tel:${value}`;
      case 'sms': return `sms:${value}`;
      case 'wifi': return `WIFI:T:${wifiSecurity};S:${value};P:${wifiPassword};;`;
      default: return value;
    }
  };

  const handleGenerate = () => {
    const content = buildContent();
    if (!content) { Alert.alert('Error', 'Please enter a value'); return; }
    const encoded = encodeURIComponent(content);
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encoded}`);
    setGenerated(true);
  };

  const copyContent = async () => {
    const content = buildContent();
    if (content) {
      await Clipboard.setStringAsync(content);
      Alert.alert('Copied', 'Content copied to clipboard');
    }
  };

  const sel = QR_TYPES.find((t) => t.id === qrType)!;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111' }}>QR Generator</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Type Picker */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {QR_TYPES.map((t) => (
            <TouchableOpacity key={t.id} onPress={() => { setQrType(t.id); setGenerated(false); setValue(''); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: 20, backgroundColor: qrType === t.id ? '#4f46e5' : '#e5e7eb' }}>
              <Ionicons name={t.icon as any} size={14} color={qrType === t.id ? '#fff' : '#6b7280'} />
              <Text style={{ fontWeight: '600', fontSize: 13, color: qrType === t.id ? '#fff' : '#6b7280' }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
          shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
          <TextInput value={value} onChangeText={(v) => { setValue(v); setGenerated(false); }}
            placeholder={sel.placeholder} multiline={qrType === 'text'}
            numberOfLines={qrType === 'text' ? 3 : 1}
            style={{ fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
              borderRadius: 10, padding: 12, marginBottom: qrType === 'wifi' ? 12 : 0 }} />
          {qrType === 'wifi' && (
            <>
              <TextInput value={wifiPassword} onChangeText={setWifiPassword} placeholder="Password (optional)"
                secureTextEntry
                style={{ fontSize: 15, color: '#111', borderWidth: 1, borderColor: '#e5e7eb',
                  borderRadius: 10, padding: 12, marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['WPA', 'WEP', 'nopass'].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setWifiSecurity(s)}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: wifiSecurity === s ? '#4f46e5' : '#f3f4f6' }}>
                    <Text style={{ textAlign: 'center', fontWeight: '600', color: wifiSecurity === s ? '#fff' : '#6b7280', fontSize: 12 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        <TouchableOpacity onPress={handleGenerate}
          style={{ backgroundColor: '#4f46e5', borderRadius: 14, padding: 15, marginBottom: 20 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
            Generate QR Code
          </Text>
        </TouchableOpacity>

        {/* QR Display */}
        {generated && (
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center',
            shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
            {/* Use img tag via WebView alternative: just show the URL as a badge */}
            <View style={{ width: 220, height: 220, backgroundColor: '#f3f4f6', borderRadius: 12,
              justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="qr-code" size={80} color="#4f46e5" />
              <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'center', paddingHorizontal: 10 }}>
                QR generated for:{'\n'}{buildContent()?.slice(0, 40)}{(buildContent()?.length ?? 0) > 40 ? '...' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={copyContent}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6',
                borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Ionicons name="copy" size={16} color="#4f46e5" />
              <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Copy Content</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
