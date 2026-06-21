import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Unit = { label: string; factor: number };
type Category = { name: string; icon: string; base: string; units: Unit[] };

const CATEGORIES: Category[] = [
  { name: 'Length', icon: 'resize', base: 'm', units: [
    { label: 'Meter', factor: 1 }, { label: 'Kilometer', factor: 0.001 },
    { label: 'Mile', factor: 0.000621371 }, { label: 'Foot', factor: 3.28084 },
    { label: 'Inch', factor: 39.3701 }, { label: 'Yard', factor: 1.09361 },
    { label: 'Centimeter', factor: 100 }, { label: 'Millimeter', factor: 1000 },
  ]},
  { name: 'Weight', icon: 'barbell', base: 'kg', units: [
    { label: 'Kilogram', factor: 1 }, { label: 'Gram', factor: 1000 },
    { label: 'Pound', factor: 2.20462 }, { label: 'Ounce', factor: 35.274 },
    { label: 'Ton', factor: 0.001 }, { label: 'Milligram', factor: 1e6 },
  ]},
  { name: 'Temperature', icon: 'thermometer', base: 'c', units: [
    { label: '°Celsius', factor: 1 }, { label: '°Fahrenheit', factor: 1 }, { label: 'Kelvin', factor: 1 },
  ]},
  { name: 'Area', icon: 'square', base: 'm2', units: [
    { label: 'Sq Meter', factor: 1 }, { label: 'Sq Km', factor: 1e-6 },
    { label: 'Sq Mile', factor: 3.861e-7 }, { label: 'Hectare', factor: 1e-4 },
    { label: 'Sq Foot', factor: 10.7639 }, { label: 'Acre', factor: 0.000247105 },
  ]},
  { name: 'Speed', icon: 'speedometer', base: 'ms', units: [
    { label: 'm/s', factor: 1 }, { label: 'km/h', factor: 3.6 },
    { label: 'mph', factor: 2.23694 }, { label: 'knot', factor: 1.94384 },
  ]},
  { name: 'Volume', icon: 'flask', base: 'l', units: [
    { label: 'Liter', factor: 1 }, { label: 'Milliliter', factor: 1000 },
    { label: 'Gallon', factor: 0.264172 }, { label: 'Fluid Oz', factor: 33.814 },
    { label: 'Cup', factor: 4.22675 }, { label: 'Pint', factor: 2.11338 },
  ]},
  // base unit: bits
  { name: 'Data Storage', icon: 'server', base: 'bit', units: [
    { label: 'Bit', factor: 1 },
    { label: 'Byte', factor: 0.125 },
    { label: 'Kilobyte', factor: 0.000125 },
    { label: 'Megabyte', factor: 1.25e-7 },
    { label: 'Gigabyte', factor: 1.25e-10 },
    { label: 'Terabyte', factor: 1.25e-13 },
    { label: 'Petabyte', factor: 1.25e-16 },
  ]},
  // base unit: seconds
  { name: 'Time', icon: 'time', base: 's', units: [
    { label: 'Millisecond', factor: 1000 },
    { label: 'Second', factor: 1 },
    { label: 'Minute', factor: 1 / 60 },
    { label: 'Hour', factor: 1 / 3600 },
    { label: 'Day', factor: 1 / 86400 },
    { label: 'Week', factor: 1 / 604800 },
    { label: 'Month', factor: 1 / 2629746 },
    { label: 'Year', factor: 1 / 31556952 },
  ]},
  // base unit: pascal
  { name: 'Pressure', icon: 'water', base: 'pa', units: [
    { label: 'Pascal', factor: 1 },
    { label: 'Kilopascal', factor: 0.001 },
    { label: 'Bar', factor: 1e-5 },
    { label: 'PSI', factor: 0.000145038 },
    { label: 'Atmosphere', factor: 9.8692e-6 },
    { label: 'mmHg', factor: 0.00750062 },
    { label: 'Torr', factor: 0.00750062 },
  ]},
  // base unit: joules
  { name: 'Energy', icon: 'flash', base: 'j', units: [
    { label: 'Joule', factor: 1 },
    { label: 'Kilojoule', factor: 0.001 },
    { label: 'Calorie', factor: 0.239006 },
    { label: 'Kilocalorie', factor: 0.000239006 },
    { label: 'Watt-hour', factor: 0.000277778 },
    { label: 'kWh', factor: 2.77778e-7 },
    { label: 'BTU', factor: 0.000947817 },
    { label: 'Electronvolt', factor: 6.242e18 },
  ]},
];

export default function ConverterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [catIdx, setCatIdx] = useState(0);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [value, setValue] = useState('1');

  const cat = CATEGORIES[catIdx];

  const convert = (v: string, from: number, to: number): string => {
    const num = parseFloat(v);
    if (isNaN(num)) return '';
    if (cat.name === 'Temperature') {
      let celsius = num;
      if (from === 1) celsius = (num - 32) / 1.8;
      if (from === 2) celsius = num - 273.15;
      if (to === 0) return parseFloat(celsius.toFixed(6)).toString();
      if (to === 1) return parseFloat((celsius * 1.8 + 32).toFixed(6)).toString();
      if (to === 2) return parseFloat((celsius + 273.15).toFixed(6)).toString();
    }
    const inBase = num / cat.units[from].factor;
    return parseFloat((inBase * cat.units[to].factor).toFixed(8)).toString();
  };

  const result = convert(value, fromIdx, toIdx);

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12,
        backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', flex: 1 }}>Unit Converter</Text>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 16 }}>
        {CATEGORIES.map((c, i) => (
          <TouchableOpacity key={c.name} onPress={() => { setCatIdx(i); setFromIdx(0); setToIdx(1); setValue('1'); }}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
              backgroundColor: catIdx === i ? '#4f46e5' : '#e5e7eb' }}>
            <Text style={{ fontWeight: '600', color: catIdx === i ? '#fff' : '#6b7280' }}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Input */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
          shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>FROM</Text>
          <TextInput value={value} onChangeText={setValue} keyboardType="decimal-pad"
            style={{ fontSize: 32, fontWeight: '700', color: '#111', marginBottom: 12 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cat.units.map((u, i) => (
              <TouchableOpacity key={u.label} onPress={() => setFromIdx(i)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8,
                  backgroundColor: fromIdx === i ? '#4f46e5' : '#f3f4f6' }}>
                <Text style={{ fontWeight: '600', color: fromIdx === i ? '#fff' : '#6b7280', fontSize: 13 }}>
                  {u.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Swap */}
        <View style={{ alignItems: 'center', marginVertical: 4 }}>
          <TouchableOpacity onPress={() => { setFromIdx(toIdx); setToIdx(fromIdx); }}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#4f46e5',
              justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="swap-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Result */}
        <View style={{ backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16, marginTop: 4,
          borderWidth: 1, borderColor: '#bbf7d0' }}>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>TO</Text>
          <Text style={{ fontSize: 32, fontWeight: '700', color: '#16a34a', marginBottom: 12 }}>
            {result || '–'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cat.units.map((u, i) => (
              <TouchableOpacity key={u.label} onPress={() => setToIdx(i)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8,
                  backgroundColor: toIdx === i ? '#16a34a' : '#f3f4f6' }}>
                <Text style={{ fontWeight: '600', color: toIdx === i ? '#fff' : '#6b7280', fontSize: 13 }}>
                  {u.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Formula */}
        {value && result && (
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16 }}>
            <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }}>
              {value} {cat.units[fromIdx].label} = {result} {cat.units[toIdx].label}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
