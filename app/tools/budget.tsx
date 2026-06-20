import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, BudgetTx } from '../../src/store/app';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Health', 'Entertainment', 'Shopping', 'Education', 'Salary', 'Freelance', 'Investment', 'Other'];
const CATEGORY_ICONS: Record<string, string> = {
  Food: 'fast-food', Transport: 'car', Housing: 'home', Health: 'medkit',
  Entertainment: 'game-controller', Shopping: 'cart', Education: 'school',
  Salary: 'briefcase', Freelance: 'laptop', Investment: 'trending-up', Other: 'ellipsis-horizontal',
};

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const transactions = useAppStore((s) => s.transactions);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);

  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Other');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const filtered = transactions.filter((t) => filter === 'all' || t.type === filter);

  const handleAdd = () => {
    if (!desc.trim() || !amount.trim() || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    addTransaction({ desc, amount: parseFloat(amount), category, type, date: Date.now() });
    setDesc(''); setAmount(''); setCategory('Other');
    setShowModal(false);
  };

  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      {/* Summary Cards */}
      <View style={{ backgroundColor: '#4f46e5', padding: 20, paddingBottom: 30 }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>Total Balance</Text>
        <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 16 }}>
          ${balance.toFixed(2)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="arrow-down-circle" size={16} color="#4ade80" />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Income</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>${income.toFixed(2)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons name="arrow-up-circle" size={16} color="#f87171" />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Expenses</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>${expense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{ flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        {(['all', 'income', 'expense'] as const).map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 8,
              backgroundColor: filter === f ? '#4f46e5' : '#f3f4f6' }}>
            <Text style={{ textAlign: 'center', fontWeight: '600', fontSize: 13,
              color: filter === f ? '#fff' : '#6b7280' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Ionicons name="wallet-outline" size={48} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', marginTop: 12 }}>No transactions yet</Text>
          </View>
        ) : (
          filtered.map((tx) => (
            <View key={tx.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10,
              flexDirection: 'row', alignItems: 'center', gap: 12,
              shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
                backgroundColor: tx.type === 'income' ? '#dcfce7' : '#fee2e2' }}>
                <Ionicons name={CATEGORY_ICONS[tx.category] as any || 'cash'} size={20}
                  color={tx.type === 'income' ? '#16a34a' : '#dc2626'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 15, color: '#111' }}>{tx.desc}</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {tx.category} · {fmtDate(tx.date)}
                </Text>
              </View>
              <Text style={{ fontWeight: '700', fontSize: 16,
                color: tx.type === 'income' ? '#16a34a' : '#dc2626' }}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
              </Text>
              <TouchableOpacity onPress={() => deleteTransaction(tx.id)} style={{ padding: 4 }}>
                <Ionicons name="trash-outline" size={18} color="#d1d5db" />
              </TouchableOpacity>
            </View>
          ))
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close-circle" size={26} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Type Toggle */}
            <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: 16 }}>
              {(['income', 'expense'] as const).map((t) => (
                <TouchableOpacity key={t} onPress={() => setType(t)} style={{ flex: 1, paddingVertical: 8, borderRadius: 8,
                  backgroundColor: type === t ? '#4f46e5' : 'transparent' }}>
                  <Text style={{ textAlign: 'center', fontWeight: '600', color: type === t ? '#fff' : '#6b7280' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput placeholder="Description" value={desc} onChangeText={setDesc}
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 }} />
            <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 }} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8,
                    backgroundColor: category === c ? '#4f46e5' : '#f3f4f6' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: category === c ? '#fff' : '#6b7280' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={handleAdd}
              style={{ backgroundColor: '#4f46e5', borderRadius: 12, padding: 15 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
