import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleButton = (btn: string) => {
    if (btn === 'C') {
      setDisplay('0'); setPrev(null); setOp(null); setWaitingForOperand(false);
    } else if (btn === '⌫') {
      setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
    } else if (btn === '±') {
      setDisplay((parseFloat(display) * -1).toString());
    } else if (btn === '%') {
      setDisplay((parseFloat(display) / 100).toString());
    } else if (['÷', '×', '−', '+'].includes(btn)) {
      setPrev(parseFloat(display));
      setOp(btn);
      setWaitingForOperand(true);
    } else if (btn === '=') {
      if (op && prev !== null) {
        const cur = parseFloat(display);
        let result = 0;
        if (op === '+') result = prev + cur;
        else if (op === '−') result = prev - cur;
        else if (op === '×') result = prev * cur;
        else if (op === '÷') result = cur !== 0 ? prev / cur : NaN;
        const entry = `${prev} ${op} ${cur} = ${result}`;
        setHistory((h) => [entry, ...h.slice(0, 9)]);
        setDisplay(isNaN(result) ? 'Error' : parseFloat(result.toFixed(10)).toString());
        setPrev(null); setOp(null); setWaitingForOperand(false);
      }
    } else if (btn === '.') {
      if (waitingForOperand) { setDisplay('0.'); setWaitingForOperand(false); return; }
      if (!display.includes('.')) setDisplay(display + '.');
    } else {
      if (waitingForOperand || display === '0') {
        setDisplay(btn); setWaitingForOperand(false);
      } else {
        setDisplay(display.length < 15 ? display + btn : display);
      }
    }
  };

  const btnColor = (btn: string) => {
    if (['÷', '×', '−', '+', '='].includes(btn)) return { bg: '#4f46e5', text: '#fff' };
    if (['C', '±', '%'].includes(btn)) return { bg: '#e5e7eb', text: '#111' };
    if (btn === '⌫') return { bg: '#fee2e2', text: '#dc2626' };
    return { bg: '#fff', text: '#111' };
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111' }}>Calculator</Text>
      </View>

      {/* History */}
      {history.length > 0 && (
        <ScrollView style={{ maxHeight: 80, paddingHorizontal: 16, marginBottom: 8 }}>
          {history.map((h, i) => (
            <Text key={i} style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>{h}</Text>
          ))}
        </ScrollView>
      )}

      {/* Display */}
      <View style={{ backgroundColor: '#1e1e2e', marginHorizontal: 16, borderRadius: 20, padding: 24, marginBottom: 16 }}>
        {op && prev !== null && (
          <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'right' }}>{prev} {op}</Text>
        )}
        <Text numberOfLines={1} adjustsFontSizeToFit
          style={{ color: '#fff', fontSize: 56, fontWeight: '300', textAlign: 'right', letterSpacing: -2 }}>
          {display}
        </Text>
      </View>

      {/* Buttons */}
      <View style={{ padding: 16, gap: 12 }}>
        {BUTTONS.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 12 }}>
            {row.map((btn) => {
              const { bg, text } = btnColor(btn);
              const isZero = btn === '0';
              return (
                <TouchableOpacity key={btn} onPress={() => handleButton(btn)}
                  activeOpacity={0.7}
                  style={{ flex: isZero ? 2 : 1, paddingVertical: 18, borderRadius: 16,
                    backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
                    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
                  <Text style={{ fontSize: 22, fontWeight: '600', color: text }}>{btn}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
