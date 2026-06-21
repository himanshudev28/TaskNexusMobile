import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#111827',
  display: '#1f2937',
  btnNum: '#374151',
  btnOp: '#4f46e5',
  btnFn: '#1e3a5f',
  btnAlt: '#374151',
  btnEqual: '#4f46e5',
  btnClear: '#7f1d1d',
  btnBack: '#374151',
  textPrimary: '#f9fafb',
  textSecondary: '#9ca3af',
  textOp: '#a5b4fc',
  accent: '#6366f1',
  chip: '#1f2937',
  chipActive: '#4f46e5',
  card: '#1f2937',
  border: '#374151',
  positive: '#10b981',
  negative: '#ef4444',
};

// ─── Haptic helper ────────────────────────────────────────────────────────────
const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// ─── Degree ↔ Radian helper ──────────────────────────────────────────────────
const toRad = (deg: number) => (deg * Math.PI) / 180;

// ─── Safe evaluate for scientific expressions ─────────────────────────────────
function safeEval(expr: string): number {
  // Replace display symbols with JS operators
  let e = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');
  // Evaluate safely — only allow math characters
  if (/[^0-9+\-*/.()e%\s]/.test(e)) throw new Error('Invalid');
  // eslint-disable-next-line no-new-func
  return Function('"use strict"; return (' + e + ')')();
}

// ────────────────────────────────────────────────────────────────────────────
//  STANDARD MODE
// ────────────────────────────────────────────────────────────────────────────
const STD_ROWS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

function StandardCalculator() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleButton = useCallback(
    (btn: string) => {
      tap();
      if (btn === 'C') {
        setDisplay('0');
        setExpression('');
        setPrev(null);
        setOp(null);
        setWaitingForOperand(false);
      } else if (btn === '⌫') {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1));
        } else {
          setDisplay('0');
        }
      } else if (btn === '±') {
        const val = parseFloat(display) * -1;
        setDisplay(val.toString());
      } else if (btn === '%') {
        const val = parseFloat(display) / 100;
        setDisplay(val.toString());
      } else if (['÷', '×', '−', '+'].includes(btn)) {
        const cur = parseFloat(display);
        setExpression(`${display} ${btn}`);
        setPrev(cur);
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
          const entry = `${prev} ${op} ${cur} = ${isNaN(result) ? 'Error' : parseFloat(result.toFixed(10))}`;
          setHistory((h) => [entry, ...h.slice(0, 9)]);
          setExpression(entry);
          setDisplay(isNaN(result) ? 'Error' : parseFloat(result.toFixed(10)).toString());
          setPrev(null);
          setOp(null);
          setWaitingForOperand(false);
        }
      } else if (btn === '.') {
        if (waitingForOperand) {
          setDisplay('0.');
          setWaitingForOperand(false);
          return;
        }
        if (!display.includes('.')) setDisplay(display + '.');
      } else {
        if (waitingForOperand || display === '0') {
          setDisplay(btn);
          setWaitingForOperand(false);
        } else {
          if (display.length < 15) setDisplay(display + btn);
        }
      }
    },
    [display, prev, op, waitingForOperand]
  );

  const btnStyle = (btn: string) => {
    if (btn === '=') return { bg: C.btnEqual, text: C.textPrimary };
    if (['÷', '×', '−', '+'].includes(btn)) return { bg: C.btnOp, text: C.textPrimary };
    if (btn === 'C') return { bg: C.btnClear, text: C.textPrimary };
    if (btn === '⌫') return { bg: C.btnBack, text: '#f87171' };
    if (['±', '%'].includes(btn)) return { bg: C.btnAlt, text: C.textOp };
    return { bg: C.btnNum, text: C.textPrimary };
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Display */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={{
          backgroundColor: C.display,
          marginHorizontal: 16,
          borderRadius: 20,
          padding: 20,
          marginBottom: 12,
          minHeight: 120,
          justifyContent: 'flex-end',
        }}
      >
        <Text
          numberOfLines={1}
          style={{ color: C.textSecondary, fontSize: 14, textAlign: 'right', marginBottom: 4 }}
        >
          {expression || ' '}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: C.textPrimary,
            fontSize: 52,
            fontWeight: '200',
            textAlign: 'right',
            letterSpacing: -1,
          }}
        >
          {display}
        </Text>
      </Animated.View>

      {/* History */}
      {history.length > 0 && (
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <ScrollView
            style={{ maxHeight: 70, marginHorizontal: 16, marginBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {history.map((h, i) => (
              <Text
                key={i}
                style={{ color: C.textSecondary, fontSize: 11, textAlign: 'right', marginBottom: 2 }}
              >
                {h}
              </Text>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Buttons */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={{ paddingHorizontal: 16, gap: 10 }}
      >
        {STD_ROWS.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 10 }}>
            {row.map((btn) => {
              const { bg, text } = btnStyle(btn);
              const isZero = btn === '0';
              return (
                <TouchableOpacity
                  key={btn}
                  onPress={() => handleButton(btn)}
                  activeOpacity={0.75}
                  style={{
                    flex: isZero ? 2 : 1,
                    paddingVertical: 18,
                    borderRadius: 16,
                    backgroundColor: bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {btn === '⌫' ? (
                    <Ionicons name="backspace-outline" size={20} color={text} />
                  ) : (
                    <Text style={{ fontSize: 20, fontWeight: '600', color: text }}>{btn}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  SCIENTIFIC MODE
// ────────────────────────────────────────────────────────────────────────────
function ScientificCalculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [isRad, setIsRad] = useState(false);
  const [error, setError] = useState('');

  const appendToExpr = (val: string) => {
    tap();
    setExpression((e) => e + val);
    setError('');
  };

  const handleSci = (fn: string) => {
    tap();
    setError('');
    // For trig functions, we need to evaluate current expression or use it as argument
    const curVal = expression;

    const applyFn = (f: (x: number) => number, label: string) => {
      try {
        const num = curVal ? safeEval(curVal) : 0;
        const arg = isRad ? num : toRad(num);
        const res = f(arg);
        const entry = `${label}(${parseFloat(num.toFixed(6))})`;
        setExpression(entry);
        setResult(parseFloat(res.toFixed(10)).toString());
      } catch {
        setError('Error');
      }
    };

    const applyInverseTrig = (f: (x: number) => number, label: string) => {
      try {
        const num = curVal ? safeEval(curVal) : 0;
        const res = isRad ? f(num) : (f(num) * 180) / Math.PI;
        const entry = `${label}(${parseFloat(num.toFixed(6))})`;
        setExpression(entry);
        setResult(parseFloat(res.toFixed(10)).toString());
      } catch {
        setError('Error');
      }
    };

    const applyUnary = (f: (x: number) => number, label: string) => {
      try {
        const num = curVal ? safeEval(curVal) : 0;
        const res = f(num);
        const entry = `${label}(${parseFloat(num.toFixed(6))})`;
        setExpression(entry);
        setResult(isNaN(res) || !isFinite(res) ? 'Error' : parseFloat(res.toFixed(10)).toString());
      } catch {
        setError('Error');
      }
    };

    switch (fn) {
      case 'sin': applyFn(Math.sin, 'sin'); break;
      case 'cos': applyFn(Math.cos, 'cos'); break;
      case 'tan': applyFn(Math.tan, 'tan'); break;
      case 'sin⁻¹': applyInverseTrig(Math.asin, 'asin'); break;
      case 'cos⁻¹': applyInverseTrig(Math.acos, 'acos'); break;
      case 'tan⁻¹': applyInverseTrig(Math.atan, 'atan'); break;
      case 'log': applyUnary(Math.log10, 'log'); break;
      case 'ln': applyUnary(Math.log, 'ln'); break;
      case 'log₂': applyUnary(Math.log2, 'log₂'); break;
      case '√': applyUnary(Math.sqrt, '√'); break;
      case '∛': applyUnary(Math.cbrt, '∛'); break;
      case 'x²': {
        try {
          const num = curVal ? safeEval(curVal) : 0;
          setExpression(`(${parseFloat(num.toFixed(6))})²`);
          setResult(parseFloat((num * num).toFixed(10)).toString());
        } catch { setError('Error'); }
        break;
      }
      case 'x³': {
        try {
          const num = curVal ? safeEval(curVal) : 0;
          setExpression(`(${parseFloat(num.toFixed(6))})³`);
          setResult(parseFloat((num * num * num).toFixed(10)).toString());
        } catch { setError('Error'); }
        break;
      }
      case 'xʸ': appendToExpr('**'); break;
      case 'π': appendToExpr(Math.PI.toString()); break;
      case 'e': appendToExpr(Math.E.toString()); break;
      case 'EXP': appendToExpr('e+'); break;
      case '(': appendToExpr('('); break;
      case ')': appendToExpr(')'); break;
    }
  };

  const handleButton = (btn: string) => {
    tap();
    setError('');
    if (btn === 'C') {
      setExpression('');
      setResult('');
      setError('');
    } else if (btn === '⌫') {
      setExpression((e) => (e.length > 1 ? e.slice(0, -1) : ''));
    } else if (btn === '=') {
      try {
        // Replace display ** with JS **
        const evalExpr = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        // eslint-disable-next-line no-new-func
        const res: number = Function('"use strict"; return (' + evalExpr + ')')();
        if (isNaN(res) || !isFinite(res)) {
          setError('Error');
        } else {
          const rounded = parseFloat(res.toFixed(10));
          setResult(rounded.toString());
        }
      } catch {
        setError('Error');
      }
    } else if (['+', '−', '×', '÷'].includes(btn)) {
      appendToExpr(` ${btn} `);
    } else if (btn === '.') {
      appendToExpr('.');
    } else if (btn === '%') {
      try {
        const num = expression ? safeEval(expression) : 0;
        setExpression((num / 100).toString());
        setResult('');
      } catch { setError('Error'); }
    } else {
      appendToExpr(btn);
    }
  };

  const sciRows: { label: string; type: 'sci' | 'btn'; value?: string }[][] = [
    [
      { label: isRad ? 'RAD' : 'DEG', type: 'btn', value: 'MODE' },
      { label: 'sin', type: 'sci' },
      { label: 'cos', type: 'sci' },
      { label: 'tan', type: 'sci' },
    ],
    [
      { label: 'sin⁻¹', type: 'sci' },
      { label: 'cos⁻¹', type: 'sci' },
      { label: 'tan⁻¹', type: 'sci' },
      { label: 'π', type: 'sci' },
    ],
    [
      { label: 'log', type: 'sci' },
      { label: 'ln', type: 'sci' },
      { label: 'log₂', type: 'sci' },
      { label: 'e', type: 'sci' },
    ],
    [
      { label: '√', type: 'sci' },
      { label: '∛', type: 'sci' },
      { label: 'x²', type: 'sci' },
      { label: 'x³', type: 'sci' },
    ],
    [
      { label: 'xʸ', type: 'sci' },
      { label: '(', type: 'sci' },
      { label: ')', type: 'sci' },
      { label: 'EXP', type: 'sci' },
    ],
    // Standard row
    [
      { label: 'C', type: 'btn' },
      { label: '%', type: 'btn' },
      { label: '⌫', type: 'btn' },
      { label: '÷', type: 'btn' },
    ],
  ];

  const numRows = [
    ['7', '8', '9', '×'],
    ['4', '5', '6', '−'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', '='],
  ];

  const getSciBtnStyle = (label: string) => {
    if (label === 'C') return { bg: C.btnClear, text: C.textPrimary, fs: 16 };
    if (label === '⌫') return { bg: C.btnBack, text: '#f87171', fs: 16 };
    if (['÷', '×', '−', '+'].includes(label)) return { bg: C.btnOp, text: C.textPrimary, fs: 18 };
    if (['MODE', '%'].includes(label)) return { bg: C.btnAlt, text: C.textOp, fs: 13 };
    return { bg: C.btnFn, text: '#93c5fd', fs: 13 };
  };

  const getNumBtnStyle = (label: string) => {
    if (label === '=') return { bg: C.btnEqual, text: C.textPrimary, fs: 20 };
    if (['÷', '×', '−', '+'].includes(label)) return { bg: C.btnOp, text: C.textPrimary, fs: 20 };
    return { bg: C.btnNum, text: C.textPrimary, fs: 20 };
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Display */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={{
          backgroundColor: C.display,
          marginHorizontal: 16,
          borderRadius: 20,
          padding: 16,
          marginBottom: 10,
          minHeight: 100,
          justifyContent: 'flex-end',
        }}
      >
        <Text
          numberOfLines={2}
          style={{ color: C.textSecondary, fontSize: 14, textAlign: 'right', marginBottom: 4 }}
        >
          {expression || ' '}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: error ? '#f87171' : C.textPrimary,
            fontSize: 40,
            fontWeight: '200',
            textAlign: 'right',
          }}
        >
          {error || result || '0'}
        </Text>
        <Text style={{ color: C.textSecondary, fontSize: 10, textAlign: 'right', marginTop: 2 }}>
          {isRad ? 'RAD' : 'DEG'}
        </Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Scientific function rows */}
        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={{ paddingHorizontal: 16, gap: 8, marginBottom: 8 }}
        >
          {sciRows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
              {row.map((item) => {
                const s = getSciBtnStyle(item.label);
                const isMode = item.label === (isRad ? 'RAD' : 'DEG');
                return (
                  <TouchableOpacity
                    key={item.label}
                    activeOpacity={0.75}
                    onPress={() => {
                      tap();
                      if (item.label === (isRad ? 'RAD' : 'DEG') || item.value === 'MODE') {
                        setIsRad((r) => !r);
                      } else if (item.type === 'sci') {
                        handleSci(item.label);
                      } else {
                        handleButton(item.label);
                      }
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: s.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.label === '⌫' ? (
                      <Ionicons name="backspace-outline" size={16} color={s.text} />
                    ) : (
                      <Text
                        style={{
                          fontSize: s.fs,
                          fontWeight: '600',
                          color: s.text,
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {item.label}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </Animated.View>

        {/* Number pad */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={{ paddingHorizontal: 16, gap: 8, marginBottom: 16 }}
        >
          {numRows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
              {row
                .filter((_, idx) => !(ri === 3 && idx === 3))
                .map((btn, idx) => {
                  const s = getNumBtnStyle(btn);
                  const isEqual = btn === '=';
                  const isLast = ri === 3 && idx === 2;
                  return (
                    <TouchableOpacity
                      key={`${ri}-${idx}`}
                      activeOpacity={0.75}
                      onPress={() => handleButton(btn)}
                      style={{
                        flex: isEqual && ri === 3 ? 2 : 1,
                        paddingVertical: 16,
                        borderRadius: 14,
                        backgroundColor: s.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: s.fs, fontWeight: '600', color: s.text }}>
                        {btn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  FINANCIAL MODE
// ────────────────────────────────────────────────────────────────────────────
type FinChip = 'Simple Interest' | 'Compound Interest' | 'EMI' | 'ROI';
const FIN_CHIPS: FinChip[] = ['Simple Interest', 'Compound Interest', 'EMI', 'ROI'];

interface FinResult {
  lines: { label: string; value: string; highlight?: boolean }[];
}

function FinancialInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: C.textSecondary, fontSize: 12, marginBottom: 4, marginLeft: 2 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || '0'}
        placeholderTextColor={C.textSecondary}
        keyboardType="numeric"
        style={{
          backgroundColor: C.display,
          color: C.textPrimary,
          fontSize: 16,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.border,
        }}
      />
    </View>
  );
}

function ResultCard({ result }: { result: FinResult | null }) {
  if (!result) return null;
  return (
    <Animated.View
      entering={FadeInDown.delay(50).springify()}
      style={{
        backgroundColor: C.card,
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <Text style={{ color: C.textSecondary, fontSize: 12, marginBottom: 10, fontWeight: '600' }}>
        RESULT
      </Text>
      {result.lines.map((line, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 6,
            borderBottomWidth: i < result.lines.length - 1 ? 1 : 0,
            borderBottomColor: C.border,
          }}
        >
          <Text style={{ color: C.textSecondary, fontSize: 13 }}>{line.label}</Text>
          <Text
            style={{
              color: line.highlight ? C.positive : C.textPrimary,
              fontSize: 14,
              fontWeight: '700',
            }}
          >
            {line.value}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}

function SimpleInterestCalc() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');
  const [result, setResult] = useState<FinResult | null>(null);

  const calculate = () => {
    tap();
    const P = parseFloat(principal);
    const R = parseFloat(rate);
    const T = parseFloat(time);
    if (isNaN(P) || isNaN(R) || isNaN(T) || P <= 0 || R <= 0 || T <= 0) {
      setResult({ lines: [{ label: 'Error', value: 'Enter valid values', highlight: false }] });
      return;
    }
    const I = (P * R * T) / 100;
    const A = P + I;
    setResult({
      lines: [
        { label: 'Principal', value: `₹${P.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
        { label: 'Interest', value: `₹${I.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, highlight: true },
        { label: 'Total Amount', value: `₹${A.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, highlight: true },
        { label: 'Rate × Time', value: `${R}% × ${T} yr` },
      ],
    });
  };

  return (
    <View>
      <FinancialInput label="Principal (₹)" value={principal} onChange={setPrincipal} placeholder="e.g. 10000" />
      <FinancialInput label="Rate (% per year)" value={rate} onChange={setRate} placeholder="e.g. 8" />
      <FinancialInput label="Time (years)" value={time} onChange={setTime} placeholder="e.g. 3" />
      <TouchableOpacity
        onPress={calculate}
        style={{
          backgroundColor: C.accent,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Calculate</Text>
      </TouchableOpacity>
      <ResultCard result={result} />
    </View>
  );
}

function CompoundInterestCalc() {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [time, setTime] = useState('');
  const [n, setN] = useState('12');
  const [result, setResult] = useState<FinResult | null>(null);

  const calculate = () => {
    tap();
    const P = parseFloat(principal);
    const R = parseFloat(rate) / 100;
    const T = parseFloat(time);
    const N = parseFloat(n);
    if (isNaN(P) || isNaN(R) || isNaN(T) || isNaN(N) || P <= 0 || N <= 0 || T <= 0) {
      setResult({ lines: [{ label: 'Error', value: 'Enter valid values' }] });
      return;
    }
    const A = P * Math.pow(1 + R / N, N * T);
    const I = A - P;
    setResult({
      lines: [
        { label: 'Principal', value: `₹${P.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
        { label: 'Compound Interest', value: `₹${I.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, highlight: true },
        { label: 'Total Amount', value: `₹${A.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, highlight: true },
        { label: 'Compounding', value: `${N}x/year for ${T} yr` },
        { label: 'Effective Rate', value: `${((A / P - 1) * 100).toFixed(2)}% total` },
      ],
    });
  };

  return (
    <View>
      <FinancialInput label="Principal (₹)" value={principal} onChange={setPrincipal} placeholder="e.g. 10000" />
      <FinancialInput label="Annual Rate (%)" value={rate} onChange={setRate} placeholder="e.g. 8" />
      <FinancialInput label="Time (years)" value={time} onChange={setTime} placeholder="e.g. 5" />
      <FinancialInput label="Compounds per Year" value={n} onChange={setN} placeholder="12 = monthly" />
      <TouchableOpacity
        onPress={calculate}
        style={{
          backgroundColor: C.accent,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Calculate</Text>
      </TouchableOpacity>
      <ResultCard result={result} />
    </View>
  );
}

function EMICalc() {
  const [loanAmount, setLoanAmount] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [result, setResult] = useState<FinResult | null>(null);

  const calculate = () => {
    tap();
    const P = parseFloat(loanAmount);
    const annR = parseFloat(annualRate);
    const n = parseFloat(tenureMonths);
    if (isNaN(P) || isNaN(annR) || isNaN(n) || P <= 0 || n <= 0) {
      setResult({ lines: [{ label: 'Error', value: 'Enter valid values' }] });
      return;
    }
    // Monthly rate
    const r = annR / (12 * 100);
    let emi: number;
    if (r === 0) {
      // Zero interest
      emi = P / n;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;
    setResult({
      lines: [
        { label: 'Monthly EMI', value: `₹${emi.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, highlight: true },
        { label: 'Total Payment', value: `₹${totalPayment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
        { label: 'Principal', value: `₹${P.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
        { label: 'Total Interest', value: `₹${totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
        { label: 'Interest %', value: `${((totalInterest / P) * 100).toFixed(1)}% of principal` },
      ],
    });
  };

  return (
    <View>
      <FinancialInput label="Loan Amount (₹)" value={loanAmount} onChange={setLoanAmount} placeholder="e.g. 500000" />
      <FinancialInput label="Annual Interest Rate (%)" value={annualRate} onChange={setAnnualRate} placeholder="e.g. 9.5" />
      <FinancialInput label="Tenure (months)" value={tenureMonths} onChange={setTenureMonths} placeholder="e.g. 60" />
      <TouchableOpacity
        onPress={calculate}
        style={{
          backgroundColor: C.accent,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Calculate</Text>
      </TouchableOpacity>
      <ResultCard result={result} />
    </View>
  );
}

function ROICalc() {
  const [initialInvestment, setInitialInvestment] = useState('');
  const [finalValue, setFinalValue] = useState('');
  const [result, setResult] = useState<FinResult | null>(null);

  const calculate = () => {
    tap();
    const IV = parseFloat(initialInvestment);
    const FV = parseFloat(finalValue);
    if (isNaN(IV) || isNaN(FV) || IV <= 0) {
      setResult({ lines: [{ label: 'Error', value: 'Enter valid values' }] });
      return;
    }
    const roi = ((FV - IV) / IV) * 100;
    const profit = FV - IV;
    const multiplier = FV / IV;
    const isProfit = profit >= 0;
    setResult({
      lines: [
        {
          label: 'ROI',
          value: `${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`,
          highlight: isProfit,
        },
        {
          label: isProfit ? 'Profit' : 'Loss',
          value: `${isProfit ? '+' : ''}₹${Math.abs(profit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
          highlight: isProfit,
        },
        { label: 'Initial Investment', value: `₹${IV.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
        { label: 'Final Value', value: `₹${FV.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` },
        { label: 'Multiplier', value: `${multiplier.toFixed(2)}x` },
      ],
    });
  };

  return (
    <View>
      <FinancialInput label="Initial Investment (₹)" value={initialInvestment} onChange={setInitialInvestment} placeholder="e.g. 100000" />
      <FinancialInput label="Final Value (₹)" value={finalValue} onChange={setFinalValue} placeholder="e.g. 150000" />
      <TouchableOpacity
        onPress={calculate}
        style={{
          backgroundColor: C.accent,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Calculate</Text>
      </TouchableOpacity>
      <ResultCard result={result} />
    </View>
  );
}

function FinancialCalculator() {
  const [activeChip, setActiveChip] = useState<FinChip>('Simple Interest');

  return (
    <View style={{ flex: 1 }}>
      {/* Chip selector */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 16, marginBottom: 16 }}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          {FIN_CHIPS.map((chip) => {
            const active = chip === activeChip;
            return (
              <TouchableOpacity
                key={chip}
                onPress={() => { tap(); setActiveChip(chip); }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: active ? C.chipActive : C.chip,
                  borderWidth: 1,
                  borderColor: active ? C.accent : C.border,
                }}
              >
                <Text
                  style={{
                    color: active ? '#fff' : C.textSecondary,
                    fontSize: 13,
                    fontWeight: active ? '700' : '400',
                  }}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          {activeChip === 'Simple Interest' && <SimpleInterestCalc />}
          {activeChip === 'Compound Interest' && <CompoundInterestCalc />}
          {activeChip === 'EMI' && <EMICalc />}
          {activeChip === 'ROI' && <ROICalc />}
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ────────────────────────────────────────────────────────────────────────────
type Mode = 'Standard' | 'Scientific' | 'Financial';
const MODES: Mode[] = ['Standard', 'Scientific', 'Financial'];

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('Standard');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(0).springify()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => { tap(); router.back(); }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.display,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: C.textPrimary, flex: 1 }}>
            Calculator
          </Text>
        </Animated.View>

        {/* Tab switcher */}
        <Animated.View
          entering={FadeInDown.delay(50).springify()}
          style={{
            flexDirection: 'row',
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: C.display,
            borderRadius: 14,
            padding: 4,
          }}
        >
          {MODES.map((m) => {
            const active = m === mode;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => { tap(); setMode(m); }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: active ? C.accent : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: active ? '#fff' : C.textSecondary,
                    fontSize: 13,
                    fontWeight: active ? '700' : '400',
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Mode content */}
        <View style={{ flex: 1 }}>
          {mode === 'Standard' && <StandardCalculator />}
          {mode === 'Scientific' && <ScientificCalculator />}
          {mode === 'Financial' && <FinancialCalculator />}
        </View>

        {/* Bottom safe area */}
        <View style={{ height: insets.bottom }} />
      </View>
    </KeyboardAvoidingView>
  );
}
