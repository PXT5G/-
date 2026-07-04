import { create } from 'zustand';
import type { Contact, ContactsDashboard, ContactsTab } from '../types';

interface ContactsState {
  activeTab: ContactsTab;
  dashboard: ContactsDashboard | null;
  selectedContact: Contact | null;
  searchQuery: string;
  loading: boolean;
  editing: boolean;
  setTab: (tab: ContactsTab) => void;
  setDashboard: (dashboard: ContactsDashboard | null) => void;
  setSelectedContact: (contact: Contact | null) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setEditing: (editing: boolean) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
  activeTab: 'home',
  dashboard: null,
  selectedContact: null,
  searchQuery: '',
  loading: true,
  editing: false,
  setTab: (activeTab) => set({ activeTab }),
  setDashboard: (dashboard) => set({ dashboard }),
  setSelectedContact: (selectedContact) => set({ selectedContact }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLoading: (loading) => set({ loading }),
  setEditing: (editing) => set({ editing }),
}));
