import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, Modal, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';

// ─── Constants ────────────────────────────────────────────────────────────────
const PRESETS = [1, 5, 10, 15, 25, 30, 60];

type Mode = 'timer' | 'stopwatch' | 'pomodoro';

type PomPhase = 'work' | 'short' | 'long';

const PHASE_CONFIG: Record<PomPhase, { label: string; color: string; bg: string; defaultMin: number }> = {
  work:  { label: 'Work',        color: '#dc2626', bg: '#fef2f2', defaultMin: 25 },
  short: { label: 'Short Break', color: '#16a34a', bg: '#f0fdf4', defaultMin: 5  },
  long:  { label: 'Long Break',  color: '#2563eb', bg: '#eff6ff', defaultMin: 15 },
};

// ─── SVG Ring ─────────────────────────────────────────────────────────────────
const RING_SIZE = 200;
const STROKE    = 10;
const RADIUS    = (RING_SIZE - STROKE) / 2;
const CIRCUM    = 2 * Math.PI * RADIUS;

function ProgressRing({ progress, color }: { progress: number; color: string }) {
  const dash = CIRCUM * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute' }}>
      {/* Track */}
      <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
        stroke="#e5e7eb" strokeWidth={STROKE} fill="none" />
      {/* Progress */}
      <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
        stroke={color} strokeWidth={STROKE} fill="none"
        strokeDasharray={CIRCUM} strokeDashoffset={dash}
        strokeLinecap="round"
        rotation={-90} origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`} />
    </Svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (s: number) => {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const fmtFocus = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TimerScreen() {
  const insets = useSafeAreaInsets();

  // ── Shared state ──────────────────────────────────────────────────────────
  const [mode, setMode]         = useState<Mode>('timer');
  const [seconds, setSeconds]   = useState(0);
  const [isActive, setIsActive] = useState(false);

  // ── Timer state ───────────────────────────────────────────────────────────
  const [inputMinutes, setInputMinutes] = useState('5');
  const [activePreset, setActivePreset] = useState(0);
  const [timerTotal, setTimerTotal]     = useState(0);

  // ── Stopwatch state ───────────────────────────────────────────────────────
  const [lapTime, setLapTime] = useState(0);
  const [laps, setLaps]       = useState<number[]>([]);

  // ── Pomodoro state ────────────────────────────────────────────────────────
  const [pomPhase, setPomPhase]         = useState<PomPhase>('work');
  const [pomDurations, setPomDurations] = useState<Record<PomPhase, number>>({
    work: 25, short: 5, long: 15,
  });
  const [pomTotal, setPomTotal]   = useState(0); // seconds remaining
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [sessions, setSessions]   = useState(0);
  const [focusToday, setFocusToday] = useState(0); // total work seconds today
  const [editPhase, setEditPhase] = useState<PomPhase | null>(null);
  const [editMinInput, setEditMinInput] = useState('');

  // keep a ref so interval callbacks can read latest values
  const pomPhaseRef       = useRef(pomPhase);
  const pomDurationsRef   = useRef(pomDurations);
  const autoAdvanceRef    = useRef(autoAdvance);
  const sessionsRef       = useRef(sessions);
  const focusTodayRef     = useRef(focusToday);

  useEffect(() => { pomPhaseRef.current     = pomPhase;    }, [pomPhase]);
  useEffect(() => { pomDurationsRef.current = pomDurations;}, [pomDurations]);
  useEffect(() => { autoAdvanceRef.current  = autoAdvance; }, [autoAdvance]);
  useEffect(() => { sessionsRef.current     = sessions;    }, [sessions]);
  useEffect(() => { focusTodayRef.current   = focusToday;  }, [focusToday]);

  // ── Init pomodoro when phase/durations change and timer is not running ────
  useEffect(() => {
    if (!isActive) {
      setPomTotal(pomDurations[pomPhase] * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomPhase, pomDurations]);

  // ── Master interval ───────────────────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive) {
      interval = setInterval(() => {
        if (mode === 'timer') {
          setSeconds((s) => {
            if (s <= 1) {
              setIsActive(false);
              Alert.alert('Timer Done', 'Your timer has finished!');
              return 0;
            }
            return s - 1;
          });
        } else if (mode === 'stopwatch') {
          setSeconds((s) => s + 1);
          setLapTime((l) => l + 1);
        } else if (mode === 'pomodoro') {
          setPomTotal((s) => {
            if (s <= 1) {
              // Phase ended
              const finishedPhase = pomPhaseRef.current;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

              let nextPhase: PomPhase = 'short';
              let newSessions = sessionsRef.current;
              let newFocus    = focusTodayRef.current;

              if (finishedPhase === 'work') {
                newSessions = sessionsRef.current + 1;
                newFocus    = focusTodayRef.current + pomDurationsRef.current.work * 60;
                setSessions(newSessions);
                setFocusToday(newFocus);
                sessionsRef.current   = newSessions;
                focusTodayRef.current = newFocus;
                nextPhase = newSessions % 4 === 0 ? 'long' : 'short';
                Alert.alert('Work Session Done!', `Great job! Take a ${nextPhase === 'long' ? 'long' : 'short'} break.`);
              } else {
                nextPhase = 'work';
                Alert.alert('Break Over!', 'Time to focus again!');
              }

              if (autoAdvanceRef.current) {
                pomPhaseRef.current = nextPhase;
                setPomPhase(nextPhase);
                const dur = pomDurationsRef.current[nextPhase] * 60;
                return dur;
              } else {
                setPomPhase(nextPhase);
                pomPhaseRef.current = nextPhase;
                setIsActive(false);
                return pomDurationsRef.current[nextPhase] * 60;
              }
            }
            return s - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, mode]);

  // ── Timer handlers ────────────────────────────────────────────────────────
  const handlePreset = (m: number) => {
    setSeconds(m * 60);
    setTimerTotal(m * 60);
    setIsActive(false);
    setActivePreset(m);
  };

  const handleSetTime = () => {
    const m = parseInt(inputMinutes) || 0;
    setSeconds(m * 60);
    setTimerTotal(m * 60);
    setIsActive(false);
    setActivePreset(0);
  };

  const handleReset = useCallback(() => {
    setIsActive(false);
    setSeconds(0);
    setTimerTotal(0);
    setLapTime(0);
    setLaps([]);
    setActivePreset(0);
  }, []);

  const handleLap = () => {
    setLaps((l) => [lapTime, ...l]);
    setLapTime(0);
  };

  // ── Pomodoro handlers ─────────────────────────────────────────────────────
  const switchPomPhase = (phase: PomPhase) => {
    if (isActive) setIsActive(false);
    setPomPhase(phase);
    setPomTotal(pomDurations[phase] * 60);
  };

  const handlePomReset = () => {
    setIsActive(false);
    setPomTotal(pomDurations[pomPhase] * 60);
  };

  const openEditPhase = (phase: PomPhase) => {
    setEditPhase(phase);
    setEditMinInput(String(pomDurations[phase]));
  };

  const saveEditPhase = () => {
    if (!editPhase) return;
    const m = Math.max(1, Math.min(99, parseInt(editMinInput) || pomDurations[editPhase]));
    const newDurs = { ...pomDurations, [editPhase]: m };
    setPomDurations(newDurs);
    if (editPhase === pomPhase && !isActive) {
      setPomTotal(m * 60);
    }
    setEditPhase(null);
  };

  // ── Mode switch ───────────────────────────────────────────────────────────
  const switchMode = (m: Mode) => {
    handleReset();
    setIsActive(false);
    setMode(m);
    if (m === 'pomodoro') {
      setPomTotal(pomDurations[pomPhase] * 60);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const timerProgress = mode === 'timer' && timerTotal > 0 ? seconds / timerTotal : 0;
  const pomProgress   = mode === 'pomodoro'
    ? pomTotal / (pomDurations[pomPhase] * 60)
    : 0;

  const ringProgress  = mode === 'timer' ? timerProgress : mode === 'pomodoro' ? pomProgress : 0;
  const ringColor     = mode === 'pomodoro'
    ? PHASE_CONFIG[pomPhase].color
    : isActive ? '#4f46e5' : '#4f46e5';

  const displaySeconds = mode === 'pomodoro' ? pomTotal : seconds;

  const MODES: { id: Mode; label: string }[] = [
    { id: 'timer',     label: 'Timer'     },
    { id: 'stopwatch', label: 'Stopwatch' },
    { id: 'pomodoro',  label: 'Pomodoro'  },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 60, alignItems: 'center' }}
    >
      {/* Header */}
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', alignItems: 'flex-start', marginBottom: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>Timer</Text>
      </View>

      {/* ── Mode Tabs ──────────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4, marginBottom: 24 }}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.id}
            onPress={() => switchMode(m.id)}
            style={{
              paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10,
              backgroundColor: mode === m.id ? '#4f46e5' : 'transparent',
            }}
          >
            <Text style={{ fontWeight: '700', color: mode === m.id ? '#fff' : '#6b7280', fontSize: 13 }}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Pomodoro Phase Selector ─────────────────────────────────────── */}
      {mode === 'pomodoro' && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, paddingHorizontal: 16 }}>
          {(Object.keys(PHASE_CONFIG) as PomPhase[]).map((phase) => {
            const cfg = PHASE_CONFIG[phase];
            const active = pomPhase === phase;
            return (
              <TouchableOpacity
                key={phase}
                onPress={() => switchPomPhase(phase)}
                onLongPress={() => openEditPhase(phase)}
                delayLongPress={500}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                  backgroundColor: active ? cfg.color : cfg.bg,
                  borderWidth: 1.5,
                  borderColor: active ? cfg.color : '#e5e7eb',
                }}
              >
                <Text style={{ fontWeight: '700', fontSize: 12, color: active ? '#fff' : cfg.color }}>
                  {cfg.label}
                </Text>
                <Text style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.8)' : '#9ca3af', marginTop: 2 }}>
                  {pomDurations[phase]}m
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── Clock Face ─────────────────────────────────────────────────── */}
      <View style={{ width: RING_SIZE, height: RING_SIZE, marginBottom: 28 }}>
        {/* SVG ring for timer/pomodoro */}
        {(mode === 'timer' || mode === 'pomodoro') && (
          <ProgressRing progress={ringProgress} color={ringColor} />
        )}
        {/* Simple border ring for stopwatch */}
        {mode === 'stopwatch' && (
          <View style={{
            position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2,
            borderWidth: STROKE, borderColor: isActive ? '#4f46e5' : '#e5e7eb',
          }} />
        )}
        {/* Center content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: RING_SIZE / 2 }}>
          {mode === 'pomodoro' && (
            <Text style={{ fontSize: 11, fontWeight: '700', color: PHASE_CONFIG[pomPhase].color,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              {PHASE_CONFIG[pomPhase].label}
            </Text>
          )}
          <Text style={{ fontSize: 44, fontWeight: '300', color: '#111', letterSpacing: -2 }}>
            {fmt(displaySeconds)}
          </Text>
          {mode === 'stopwatch' && laps.length > 0 && (
            <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>Lap: {fmt(lapTime)}</Text>
          )}
        </View>
      </View>

      {/* ── Pomodoro Stats ──────────────────────────────────────────────── */}
      {mode === 'pomodoro' && (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, paddingHorizontal: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center',
            borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#dc2626' }}>{sessions}</Text>
            <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Sessions Today</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center',
            borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#4f46e5' }}>
              {focusToday > 0 ? fmtFocus(focusToday) : '0m'}
            </Text>
            <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Focus Today</Text>
          </View>
        </View>
      )}

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 28, alignItems: 'center' }}>
        {mode === 'stopwatch' && isActive && (
          <TouchableOpacity
            onPress={handleLap}
            style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#e5e7eb',
              justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name="flag" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => setIsActive((a) => !a)}
          style={{
            width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center',
            backgroundColor: isActive ? '#dc2626' : '#4f46e5',
            shadowColor: isActive ? '#dc2626' : '#4f46e5',
            shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
          }}
        >
          <Ionicons name={isActive ? 'pause' : 'play'} size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={mode === 'pomodoro' ? handlePomReset : handleReset}
          style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#e5e7eb',
            justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name="refresh" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* ── Pomodoro Auto-advance toggle ────────────────────────────────── */}
      {mode === 'pomodoro' && (
        <TouchableOpacity
          onPress={() => setAutoAdvance((a) => !a)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff',
            borderRadius: 12, padding: 14, marginBottom: 20, paddingHorizontal: 20,
            borderWidth: 1, borderColor: '#e5e7eb',
          }}
        >
          <View style={{
            width: 40, height: 22, borderRadius: 11,
            backgroundColor: autoAdvance ? '#4f46e5' : '#d1d5db',
            justifyContent: 'center', paddingHorizontal: 2,
          }}>
            <View style={{
              width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
              alignSelf: autoAdvance ? 'flex-end' : 'flex-start',
            }} />
          </View>
          <Text style={{ fontWeight: '600', color: '#374151' }}>Auto-advance phases</Text>
        </TouchableOpacity>
      )}

      {/* ── Timer Mode: Presets ──────────────────────────────────────────── */}
      {mode === 'timer' && (
        <>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 10,
            textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Presets
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
            gap: 8, marginBottom: 18, paddingHorizontal: 20 }}>
            {PRESETS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => handlePreset(m)}
                style={{
                  paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
                  backgroundColor: activePreset === m ? '#4f46e5' : '#fff',
                  borderWidth: 1, borderColor: activePreset === m ? '#4f46e5' : '#e5e7eb',
                }}
              >
                <Text style={{ fontWeight: '700', color: activePreset === m ? '#fff' : '#374151' }}>
                  {m >= 60 ? `${m / 60}h` : `${m}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, width: '100%' }}>
            <TextInput
              value={inputMinutes}
              onChangeText={setInputMinutes}
              placeholder="Minutes"
              keyboardType="number-pad"
              style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
                fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb', textAlign: 'center' }}
            />
            <TouchableOpacity
              onPress={handleSetTime}
              style={{ backgroundColor: '#4f46e5', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Set</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Stopwatch Laps ──────────────────────────────────────────────── */}
      {mode === 'stopwatch' && laps.length > 0 && (
        <View style={{ width: '100%', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 10,
            textTransform: 'uppercase' }}>
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

      {/* ── Pomodoro: long-press edit modal ─────────────────────────────── */}
      <Modal visible={editPhase !== null} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setEditPhase(null)}
        >
          <Pressable
            style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: 280 }}
            onPress={(e) => e.stopPropagation()}
          >
            {editPhase && (
              <>
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 4 }}>
                  Edit {PHASE_CONFIG[editPhase].label}
                </Text>
                <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Set duration in minutes</Text>
                <TextInput
                  value={editMinInput}
                  onChangeText={setEditMinInput}
                  keyboardType="number-pad"
                  style={{ borderWidth: 1, borderColor: PHASE_CONFIG[editPhase].color, borderRadius: 10,
                    padding: 12, fontSize: 24, fontWeight: '700', textAlign: 'center',
                    color: PHASE_CONFIG[editPhase].color, marginBottom: 16 }}
                  autoFocus
                  selectTextOnFocus
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setEditPhase(null)}
                    style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' }}
                  >
                    <Text style={{ fontWeight: '600', color: '#6b7280' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveEditPhase}
                    style={{ flex: 1, padding: 12, borderRadius: 10,
                      backgroundColor: PHASE_CONFIG[editPhase].color, alignItems: 'center' }}
                  >
                    <Text style={{ fontWeight: '700', color: '#fff' }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
