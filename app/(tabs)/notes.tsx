import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/app';
import { Ionicons } from '@expo/vector-icons';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cols = width > 500 ? 3 : 2;
  const cardW = `${Math.floor(100 / cols)}%` as any;
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const notes = useAppStore((s) => s.notes);
  const addNote = useAppStore((s) => s.addNote);
  const deleteNote = useAppStore((s) => s.deleteNote);

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title'); return; }
    addNote({ title, body });
    setTitle(''); setBody('');
    setShowModal(false);
  };

  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const COLORS = ['#ede9fe', '#fce7f3', '#dbeafe', '#dcfce7', '#fef3c7', '#fee2e2'];

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>Notes</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={28} color="#4f46e5" />
        </TouchableOpacity>
      </View>
      {/* Search */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
          borderRadius: 12, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search notes..."
            style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: '#111' }}
            placeholderTextColor="#9ca3af" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 100 }}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="document-outline" size={60} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', fontSize: 16, marginTop: 16 }}>
              {search ? 'No notes found' : 'No notes yet'}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {filtered.map((note, i) => (
              <View key={note.id} style={{ width: cardW, backgroundColor: COLORS[i % COLORS.length],
                borderRadius: 16, padding: 16, position: 'relative',
                shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: '#111', marginBottom: 6 }} numberOfLines={2}>
                  {note.title}
                </Text>
                <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 18 }} numberOfLines={4}>
                  {note.body || 'No content'}
                </Text>
                <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>{fmtDate(note.createdAt)}</Text>
                <TouchableOpacity onPress={() => deleteNote(note.id)}
                  style={{ position: 'absolute', top: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={20} color="rgba(0,0,0,0.15)" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity onPress={() => setShowModal(true)}
        style={{ position: 'absolute', bottom: insets.bottom + 20, right: 20,
          width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5',
          justifyContent: 'center', alignItems: 'center',
          shadowColor: '#4f46e5', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 20, paddingBottom: insets.bottom + 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>New Note</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close-circle" size={26} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <TextInput value={title} onChangeText={setTitle} placeholder="Title"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 16, fontWeight: '600' }} />
            <TextInput value={body} onChangeText={setBody} placeholder="Write something..." multiline numberOfLines={5}
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 16,
                fontSize: 14, minHeight: 100, textAlignVertical: 'top' }} />
            <TouchableOpacity onPress={handleAdd}
              style={{ backgroundColor: '#4f46e5', borderRadius: 12, padding: 15 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>Add Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
