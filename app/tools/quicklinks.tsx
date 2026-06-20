import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Linking, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store/app';

export default function QuickLinksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const quickLinks = useAppStore((s) => s.quickLinks);
  const addQuickLink = useAppStore((s) => s.addQuickLink);
  const deleteQuickLink = useAppStore((s) => s.deleteQuickLink);

  const [showModal, setShowModal] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const handleAdd = () => {
    if (!label.trim() || !url.trim()) { Alert.alert('Error', 'Fill in both fields'); return; }
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    addQuickLink({ label, url: finalUrl });
    setLabel(''); setUrl('');
    setShowModal(false);
  };

  const openLink = async (u: string) => {
    try {
      const canOpen = await Linking.canOpenURL(u);
      if (canOpen) await Linking.openURL(u);
      else Alert.alert('Error', 'Cannot open this URL');
    } catch { Alert.alert('Error', 'Failed to open link'); }
  };

  const getFavicon = (u: string) => {
    try { return new URL(u).hostname; } catch { return ''; }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '700', color: '#111' }}>Quick Links</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={30} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {quickLinks.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="link-outline" size={60} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', fontSize: 16, marginTop: 16 }}>No quick links yet</Text>
          </View>
        ) : quickLinks.map((link) => (
          <TouchableOpacity key={link.id} onPress={() => openLink(link.url)}
            style={{ width: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center',
              shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, position: 'relative' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#ede9fe',
              justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 20 }}>🔗</Text>
            </View>
            <Text style={{ fontWeight: '700', fontSize: 14, color: '#111', textAlign: 'center' }} numberOfLines={1}>{link.label}</Text>
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'center' }} numberOfLines={1}>
              {getFavicon(link.url)}
            </Text>
            <TouchableOpacity onPress={() => deleteQuickLink(link.id)}
              style={{ position: 'absolute', top: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#d1d5db" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 20, paddingBottom: insets.bottom + 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Add Quick Link</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close-circle" size={26} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <TextInput value={label} onChangeText={setLabel} placeholder="Label (e.g. GitHub)"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 }} />
            <TextInput value={url} onChangeText={setUrl} placeholder="URL (e.g. github.com)"
              autoCapitalize="none" keyboardType="url"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15 }} />
            <TouchableOpacity onPress={handleAdd}
              style={{ backgroundColor: '#4f46e5', borderRadius: 12, padding: 15 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>Add Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
