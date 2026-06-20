import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/app';
import { Ionicons } from '@expo/vector-icons';

const PRIORITY_CONFIG = {
  low: { color: '#10b981', bg: '#dcfce7', label: 'Low' },
  medium: { color: '#f59e0b', bg: '#fef3c7', label: 'Medium' },
  high: { color: '#dc2626', bg: '#fee2e2', label: 'High' },
};

export default function TodoScreen() {
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const todos = useAppStore((s) => s.todos);
  const addTodo = useAppStore((s) => s.addTodo);
  const updateTodo = useAppStore((s) => s.updateTodo);
  const deleteTodo = useAppStore((s) => s.deleteTodo);

  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('Error', 'Enter a todo'); return; }
    addTodo({ title, priority, done: false });
    setTitle(''); setPriority('medium');
    setShowModal(false);
  };

  const shown = todos.filter((t) =>
    filter === 'all' ? true : filter === 'pending' ? !t.done : t.done
  );

  const pending = todos.filter((t) => !t.done).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      {/* Header Stats */}
      <View style={{ backgroundColor: '#4f46e5', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Pending tasks</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{pending}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['all', 'pending', 'done'] as const).map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                backgroundColor: filter === f ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)' }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {shown.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="checkmark-circle-outline" size={60} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', fontSize: 16, marginTop: 16 }}>
              {filter === 'done' ? 'No completed todos' : 'No todos yet'}
            </Text>
          </View>
        ) : shown.map((todo) => {
          const p = PRIORITY_CONFIG[todo.priority];
          return (
            <View key={todo.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
              flexDirection: 'row', alignItems: 'center', gap: 12,
              shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
              borderLeftWidth: 3, borderLeftColor: p.color, opacity: todo.done ? 0.6 : 1 }}>
              <TouchableOpacity onPress={() => updateTodo(todo.id, { done: !todo.done })}>
                <Ionicons name={todo.done ? 'checkbox' : 'square-outline'} size={24} color={p.color} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111',
                  textDecorationLine: todo.done ? 'line-through' : 'none' }}>
                  {todo.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <View style={{ backgroundColor: p.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: p.color }}>{p.label}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteTodo(todo.id)}>
                <Ionicons name="trash-outline" size={18} color="#d1d5db" />
              </TouchableOpacity>
            </View>
          );
        })}
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
              <Text style={{ fontSize: 18, fontWeight: '700' }}>New Todo</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close-circle" size={26} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <TextInput value={title} onChangeText={setTitle} placeholder="What needs to be done?"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15 }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {(['low', 'medium', 'high'] as const).map((p) => {
                const cfg = PRIORITY_CONFIG[p];
                return (
                  <TouchableOpacity key={p} onPress={() => setPriority(p)} style={{ flex: 1, paddingVertical: 10, borderRadius: 10,
                    backgroundColor: priority === p ? cfg.bg : '#f3f4f6',
                    borderWidth: 2, borderColor: priority === p ? cfg.color : 'transparent' }}>
                    <Text style={{ textAlign: 'center', fontWeight: '700', color: priority === p ? cfg.color : '#6b7280' }}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={handleAdd}
              style={{ backgroundColor: '#4f46e5', borderRadius: 12, padding: 15 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>Add Todo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
