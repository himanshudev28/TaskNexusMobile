import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store/app';

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reminders = useAppStore((s) => s.reminders);
  const addReminder = useAppStore((s) => s.addReminder);
  const updateReminder = useAppStore((s) => s.updateReminder);
  const deleteReminder = useAppStore((s) => s.deleteReminder);

  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  const handleAdd = () => {
    if (!text.trim()) { Alert.alert('Error', 'Enter reminder text'); return; }
    let at: number | undefined;
    if (dateStr && timeStr) {
      const combined = new Date(`${dateStr}T${timeStr}`);
      if (!isNaN(combined.getTime())) at = combined.getTime();
    }
    addReminder({ text, at, done: false });
    setText(''); setDateStr(''); setTimeStr('');
    setShowModal(false);
  };

  const fmtDate = (ts?: number) => {
    if (!ts) return 'No due date';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const isOverdue = (r: any) => r.at && r.at <= Date.now() && !r.done;
  const pending = reminders.filter((r) => !r.done);
  const done = reminders.filter((r) => r.done);

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '700', color: '#111' }}>Reminders</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={30} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {pending.length > 0 && (
          <>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pending ({pending.length})
            </Text>
            {pending.map((r) => (
              <View key={r.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
                borderLeftWidth: 4, borderLeftColor: isOverdue(r) ? '#dc2626' : '#4f46e5',
                shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <TouchableOpacity onPress={() => updateReminder(r.id, { done: true })} style={{ marginRight: 12, marginTop: 2 }}>
                    <Ionicons name="radio-button-off" size={22} color="#4f46e5" />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 }}>{r.text}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time" size={13} color={isOverdue(r) ? '#dc2626' : '#9ca3af'} />
                      <Text style={{ fontSize: 12, color: isOverdue(r) ? '#dc2626' : '#9ca3af' }}>
                        {fmtDate(r.at)}{isOverdue(r) ? ' · OVERDUE' : ''}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteReminder(r.id)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={18} color="#d1d5db" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {done.length > 0 && (
          <>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 10, marginTop: 16,
              textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Done ({done.length})
            </Text>
            {done.map((r) => (
              <View key={r.id} style={{ backgroundColor: '#f9fafb', borderRadius: 14, padding: 16, marginBottom: 10,
                opacity: 0.6, borderWidth: 1, borderColor: '#e5e7eb' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => updateReminder(r.id, { done: false })} style={{ marginRight: 12 }}>
                    <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                  </TouchableOpacity>
                  <Text style={{ flex: 1, fontSize: 15, color: '#6b7280', textDecorationLine: 'line-through' }}>{r.text}</Text>
                  <TouchableOpacity onPress={() => deleteReminder(r.id)}>
                    <Ionicons name="trash-outline" size={18} color="#d1d5db" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {reminders.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="notifications-outline" size={60} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', fontSize: 16, marginTop: 16 }}>No reminders yet</Text>
            <Text style={{ color: '#d1d5db', fontSize: 13, marginTop: 4 }}>Tap + to add a reminder</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 20, paddingBottom: insets.bottom + 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>New Reminder</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close-circle" size={26} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <TextInput value={text} onChangeText={setText} placeholder="Reminder text..."
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 }} />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TextInput value={dateStr} onChangeText={setDateStr} placeholder="YYYY-MM-DD"
                style={{ flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14 }} />
              <TextInput value={timeStr} onChangeText={setTimeStr} placeholder="HH:MM"
                style={{ flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14 }} />
            </View>
            <TouchableOpacity onPress={handleAdd}
              style={{ backgroundColor: '#4f46e5', borderRadius: 12, padding: 15 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>Add Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
