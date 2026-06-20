import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../../src/store/app';
import { Ionicons } from '@expo/vector-icons';

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const notes = useAppStore((state) => state.notes);
  const addNote = useAppStore((state) => state.addNote);
  const deleteNote = useAppStore((state) => state.deleteNote);

  const handleAdd = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    addNote({ title, body });
    setTitle('');
    setBody('');
    setShowForm(false);
  };

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
            <Text className="text-white font-semibold ml-2">New Note</Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <TextInput
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              className="border border-gray-300 rounded-lg p-3 mb-3 text-base"
              placeholderTextColor="#8a8a8a"
            />
            <TextInput
              placeholder="Body"
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-lg p-3 mb-3 text-base"
              placeholderTextColor="#8a8a8a"
            />
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

        {notes.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="document-outline" size={48} color="#8a8a8a" />
            <Text className="text-gray-500 text-center mt-4">No notes yet</Text>
          </View>
        ) : (
          notes.map((note) => (
            <View
              key={note.id}
              className="bg-white rounded-lg p-4 mb-3 shadow-sm flex-row justify-between items-start"
            >
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">
                  {note.title}
                </Text>
                <Text className="text-gray-600 mt-1">
                  {note.body.substring(0, 60)}...
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteNote(note.id)}
                className="ml-2 p-2"
              >
                <Ionicons name="trash" size={20} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
