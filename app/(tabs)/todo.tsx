import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../../src/store/app';
import { Ionicons } from '@expo/vector-icons';

export default function TodoScreen() {
  const insets = useSafeAreaInsets();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const todos = useAppStore((state) => state.todos);
  const addTodo = useAppStore((state) => state.addTodo);
  const updateTodo = useAppStore((state) => state.updateTodo);
  const deleteTodo = useAppStore((state) => state.deleteTodo);

  const handleAdd = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a todo');
      return;
    }
    addTodo({ title, priority, done: false });
    setTitle('');
    setPriority('medium');
    setShowForm(false);
  };

  const priorityColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#dc2626',
  };

  const pending = todos.filter((t) => !t.done);
  const completed = todos.filter((t) => t.done);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 20 }}
    >
      <View className="px-4">
        {!showForm ? (
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            className="bg-indigo-600 rounded-lg p-4 mb-6 flex-row items-center justify-center"
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">New Todo</Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <TextInput
              placeholder="What needs to be done?"
              value={title}
              onChangeText={setTitle}
              className="border border-gray-300 rounded-lg p-3 mb-3 text-base"
              placeholderTextColor="#8a8a8a"
            />
            <View className="flex-row gap-2 mb-3">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPriority(p)}
                  className={`flex-1 rounded-lg p-2 border-2 ${
                    priority === p
                      ? 'bg-indigo-100 border-indigo-600'
                      : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      priority === p ? 'text-indigo-600' : 'text-gray-600'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleAdd}
                className="flex-1 bg-indigo-600 rounded-lg p-3"
              >
                <Text className="text-white text-center font-semibold">Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowForm(false)}
                className="flex-1 bg-gray-200 rounded-lg p-3"
              >
                <Text className="text-gray-700 text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {pending.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Pending ({pending.length})
            </Text>
            {pending.map((todo) => (
              <View
                key={todo.id}
                className="bg-white rounded-lg p-4 mb-2 shadow-sm flex-row items-center"
              >
                <TouchableOpacity
                  onPress={() => updateTodo(todo.id, { done: true })}
                  className="mr-3"
                >
                  <Ionicons name="checkbox-outline" size={24} color="#4f46e5" />
                </TouchableOpacity>
                <View className="flex-1">
                  <Text className="text-base text-gray-900 font-medium">
                    {todo.title}
                  </Text>
                  <View
                    className="w-2 h-2 rounded-full mt-1"
                    style={{ backgroundColor: priorityColor[todo.priority] }}
                  />
                </View>
                <TouchableOpacity onPress={() => deleteTodo(todo.id)}>
                  <Ionicons name="trash" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {completed.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              Completed ({completed.length})
            </Text>
            {completed.map((todo) => (
              <View
                key={todo.id}
                className="bg-white rounded-lg p-4 mb-2 shadow-sm flex-row items-center opacity-60"
              >
                <TouchableOpacity
                  onPress={() => updateTodo(todo.id, { done: false })}
                  className="mr-3"
                >
                  <Ionicons name="checkbox" size={24} color="#10b981" />
                </TouchableOpacity>
                <Text className="flex-1 text-base text-gray-600 line-through">
                  {todo.title}
                </Text>
                <TouchableOpacity onPress={() => deleteTodo(todo.id)}>
                  <Ionicons name="trash" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {todos.length === 0 && (
          <View className="items-center justify-center py-16">
            <Ionicons name="checkmark-circle-outline" size={48} color="#8a8a8a" />
            <Text className="text-gray-500 text-center mt-4">No todos yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
