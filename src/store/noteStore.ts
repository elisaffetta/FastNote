
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface NoteStore {
  notes: Note[];
  getNoteById: (id: string) => Note | undefined;
  createNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  filterNotesByTag: (tag: string) => Note[];
  searchNotes: (query: string) => Note[];
  getTags: () => string[];
}

// Sample notes for initial state
const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to SonicNoteHaven',
    content: 'This is your first note! Try recording your voice by clicking the microphone button at the bottom of the screen.\n\nYou can edit this note or create a new one.',
    tags: ['welcome', 'tutorial'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Meeting Notes - Project Alpha',
    content: 'Meeting with the team on Friday at 10am.\n\nAgenda:\n- Project status update\n- Timeline review\n- Resource allocation\n- Next steps\n\nRemember to prepare the presentation slides.',
    tags: ['work', 'meeting'],
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'Shopping List',
    content: '- Milk\n- Eggs\n- Bread\n- Apples\n- Coffee\n- Chicken\n- Rice',
    tags: ['personal', 'shopping'],
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const useNoteStore = create<NoteStore>()(
  devtools(
    persist(
      (set, get) => ({
        notes: initialNotes,
        
        getNoteById: (id) => {
          return get().notes.find(note => note.id === id);
        },
        
        createNote: (note) => {
          set(state => ({
            notes: [note, ...state.notes]
          }));
        },
        
        updateNote: (id, updates) => {
          set(state => ({
            notes: state.notes.map(note => 
              note.id === id ? { ...note, ...updates } : note
            )
          }));
        },
        
        deleteNote: (id) => {
          set(state => ({
            notes: state.notes.filter(note => note.id !== id)
          }));
        },
        
        filterNotesByTag: (tag) => {
          return get().notes.filter(note => note.tags.includes(tag));
        },
        
        searchNotes: (query) => {
          const lowerQuery = query.toLowerCase();
          return get().notes.filter(note => 
            note.title.toLowerCase().includes(lowerQuery) || 
            note.content.toLowerCase().includes(lowerQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
          );
        },
        
        getTags: () => {
          const allTags = get().notes.flatMap(note => note.tags);
          return [...new Set(allTags)];
        },
      }),
      {
        name: 'sonic-note-haven-storage',
      }
    )
  )
);
