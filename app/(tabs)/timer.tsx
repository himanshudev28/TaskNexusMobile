import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('5');
  const [preset, setPreset] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const handleSetTime = () => {
    const mins = parseInt(inputMinutes) || 0;
    setSeconds(mins * 60);
    setIsActive(false);
  };

  const handlePreset = (mins: number) => {
    setSeconds(mins * 60);
    setIsActive(false);
    setPreset(mins);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
    >
      <View className="px-4 items-center">
        <View className="w-40 h-40 rounded-full bg-indigo-600 justify-center items-center mb-8 shadow-lg">
          <Text className="text-6xl font-bold text-white">
            {formatTime(seconds)}
          </Text>
        </View>

        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity
            onPress={() => setIsActive(!isActive)}
            className={`flex-1 rounded-lg p-4 ${
              isActive ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isActive ? 'Pause' : 'Start'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setSeconds(0);
              setIsActive(false);
            }}
            className="flex-1 bg-gray-600 rounded-lg p-4"
          >
            <Text className="text-white text-center font-semibold text-lg">
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-lg font-semibold text-gray-900 mb-4">Presets</Text>
        <View className="flex-row gap-3 mb-8 flex-wrap justify-center">
          {[1, 5, 10, 15, 30].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => handlePreset(m)}
              className={`rounded-lg px-6 py-3 ${
                preset === m
                  ? 'bg-indigo-600'
                  : 'bg-white border border-gray-300'
              }`}
            >
              <Text
                className={`font-semibold ${
                  preset === m ? 'text-white' : 'text-gray-900'
                }`}
              >
                {m}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Custom Time
        </Text>
        <View className="w-full flex-row gap-2">
          <TextInput
            placeholder="Minutes"
            value={inputMinutes}
            onChangeText={setInputMinutes}
            keyboardType="number-pad"
            className="flex-1 border border-gray-300 rounded-lg p-3 text-base"
            placeholderTextColor="#8a8a8a"
          />
          <TouchableOpacity
            onPress={handleSetTime}
            className="bg-indigo-600 rounded-lg px-6 justify-center"
          >
            <Text className="text-white font-semibold">Set</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
