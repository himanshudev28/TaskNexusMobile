import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: number;
  createdAt: number;
}

export interface Reminder {
  id: string;
  text: string;
  at?: number;
  done: boolean;
  createdAt: number;
}

export interface BudgetTx {
  id: string;
  desc: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: number;
}

export interface QuickLink {
  id: string;
  label: string;
  url: string;
}

interface AppStore {
  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Todos
  todos: Todo[];
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  updateTodo: (id: string, todo: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;

  // Reminders
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;

  // Budget
  transactions: BudgetTx[];
  addTransaction: (tx: Omit<BudgetTx, 'id'>) => void;
  deleteTransaction: (id: string) => void;

  // Quick Links
  quickLinks: QuickLink[];
  addQuickLink: (link: Omit<QuickLink, 'id'>) => void;
  deleteQuickLink: (id: string) => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export const useAppStore = create<AppStore>((set, get) => ({
  notes: [],
  todos: [],
  reminders: [],
  transactions: [],
  quickLinks: [],

  addNote: (note) => {
    const newNote: Note = {
      ...note,
      id: uid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ notes: [newNote, ...state.notes] }));
  },

  updateNote: (id, note) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...note, updatedAt: Date.now() } : n
      ),
    }));
  },

  deleteNote: (id) => {
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  addTodo: (todo) => {
    const newTodo: Todo = {
      ...todo,
      id: uid(),
      createdAt: Date.now(),
    };
    set((state) => ({ todos: [newTodo, ...state.todos] }));
  },

  updateTodo: (id, todo) => {
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, ...todo } : t)),
    }));
  },

  deleteTodo: (id) => {
    set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }));
  },

  addReminder: (reminder) => {
    const newReminder: Reminder = {
      ...reminder,
      id: uid(),
      createdAt: Date.now(),
    };
    set((state) => ({ reminders: [newReminder, ...state.reminders] }));
  },

  updateReminder: (id, reminder) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, ...reminder } : r
      ),
    }));
  },

  deleteReminder: (id) => {
    set((state) => ({ reminders: state.reminders.filter((r) => r.id !== id) }));
  },

  addTransaction: (tx) => {
    const newTx: BudgetTx = {
      ...tx,
      id: uid(),
    };
    set((state) => ({ transactions: [newTx, ...state.transactions] }));
  },

  deleteTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  addQuickLink: (link) => {
    const newLink: QuickLink = {
      ...link,
      id: uid(),
    };
    set((state) => ({ quickLinks: [newLink, ...state.quickLinks] }));
  },

  deleteQuickLink: (id) => {
    set((state) => ({
      quickLinks: state.quickLinks.filter((l) => l.id !== id),
    }));
  },

  loadFromStorage: async () => {
    try {
      const [notes, todos, reminders, transactions, quickLinks] = await Promise.all([
        AsyncStorage.getItem('tn_notes'),
        AsyncStorage.getItem('tn_todos'),
        AsyncStorage.getItem('tn_reminders'),
        AsyncStorage.getItem('tn_transactions'),
        AsyncStorage.getItem('tn_quicklinks'),
      ]);

      set({
        notes: notes ? JSON.parse(notes) : [],
        todos: todos ? JSON.parse(todos) : [],
        reminders: reminders ? JSON.parse(reminders) : [],
        transactions: transactions ? JSON.parse(transactions) : [],
        quickLinks: quickLinks ? JSON.parse(quickLinks) : [],
      });
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      await Promise.all([
        AsyncStorage.setItem('tn_notes', JSON.stringify(state.notes)),
        AsyncStorage.setItem('tn_todos', JSON.stringify(state.todos)),
        AsyncStorage.setItem('tn_reminders', JSON.stringify(state.reminders)),
        AsyncStorage.setItem('tn_transactions', JSON.stringify(state.transactions)),
        AsyncStorage.setItem('tn_quicklinks', JSON.stringify(state.quickLinks)),
      ]);
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
}));
