import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PRESETS = [1, 5, 10, 15, 25, 30, 60];

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('5');
  const [activePreset, setActivePreset] = useState(0);
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  const [lapTime, setLapTime] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive) {
      interval = setInterval(() => {
        if (mode === 'timer') {
          setSeconds((s) => {
            if (s <= 1) { setIsActive(false); return 0; }
            return s - 1;
          });
        } else {
          setSeconds((s) => s + 1);
          setLapTime((l) => l + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, mode]);

  const handlePreset = (m: number) => {
    setSeconds(m * 60);
    setIsActive(false);
    setActivePreset(m);
    setMode('timer');
  };

  const handleSetTime = () => {
    const m = parseInt(inputMinutes) || 0;
    setSeconds(m * 60);
    setIsActive(false);
    setActivePreset(0);
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(0);
    setLapTime(0);
    setLaps([]);
    setActivePreset(0);
  };

  const handleLap = () => {
    setLaps((l) => [lapTime, ...l]);
    setLapTime(0);
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'timer' && activePreset > 0
    ? seconds / (activePreset * 60)
    : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40, alignItems: 'center' }}>
      {/* Mode Toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4, marginBottom: 30 }}>
        {(['timer', 'stopwatch'] as const).map((m) => (
          <TouchableOpacity key={m} onPress={() => { setMode(m); handleReset(); }}
            style={{ paddingHorizontal: 28, paddingVertical: 8, borderRadius: 10,
              backgroundColor: mode === m ? '#4f46e5' : 'transparent' }}>
            <Text style={{ fontWeight: '700', color: mode === m ? '#fff' : '#6b7280', fontSize: 14 }}>
              {m === 'timer' ? 'Timer' : 'Stopwatch'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Clock Face */}
      <View style={{ width: 200, height: 200, borderRadius: 100, borderWidth: 6,
        borderColor: isActive ? '#4f46e5' : '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginBottom: 32,
        backgroundColor: '#fff', shadowColor: '#4f46e5', shadowOpacity: isActive ? 0.2 : 0, shadowRadius: 20, elevation: isActive ? 8 : 0 }}>
        <Text style={{ fontSize: 48, fontWeight: '300', color: '#111', letterSpacing: -2 }}>{fmt(seconds)}</Text>
        {mode === 'stopwatch' && laps.length > 0 && (
          <Text style={{ fontSize: 16, color: '#9ca3af', marginTop: 4 }}>Lap: {fmt(lapTime)}</Text>
        )}
      </View>

      {/* Controls */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
        {mode === 'stopwatch' && isActive && (
          <TouchableOpacity onPress={handleLap}
            style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="flag" size={22} color="#6b7280" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setIsActive(!isActive)}
          style={{ width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center',
            backgroundColor: isActive ? '#dc2626' : '#4f46e5',
            shadowColor: isActive ? '#dc2626' : '#4f46e5', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }}>
          <Ionicons name={isActive ? 'pause' : 'play'} size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReset}
          style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="refresh" size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Timer Mode: Presets */}
      {mode === 'timer' && (
        <>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Presets
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20, paddingHorizontal: 20 }}>
            {PRESETS.map((m) => (
              <TouchableOpacity key={m} onPress={() => handlePreset(m)}
                style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
                  backgroundColor: activePreset === m ? '#4f46e5' : '#fff',
                  borderWidth: 1, borderColor: activePreset === m ? '#4f46e5' : '#e5e7eb' }}>
                <Text style={{ fontWeight: '700', color: activePreset === m ? '#fff' : '#374151' }}>
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, width: '100%' }}>
            <TextInput value={inputMinutes} onChangeText={setInputMinutes} placeholder="Minutes"
              keyboardType="number-pad"
              style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15,
                borderWidth: 1, borderColor: '#e5e7eb', textAlign: 'center' }} />
            <TouchableOpacity onPress={handleSetTime}
              style={{ backgroundColor: '#4f46e5', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Set</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Stopwatch Laps */}
      {mode === 'stopwatch' && laps.length > 0 && (
        <View style={{ width: '100%', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase' }}>
            Laps
          </Text>
          {laps.map((lap, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between',
              backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6,
              borderWidth: 1, borderColor: '#e5e7eb' }}>
              <Text style={{ color: '#6b7280', fontWeight: '600' }}>Lap {laps.length - i}</Text>
              <Text style={{ fontFamily: 'monospace', fontWeight: '700', color: '#111' }}>{fmt(lap)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
