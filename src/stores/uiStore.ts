import { create } from 'zustand';

interface UIState {
  // Home
  homeViewMode: 'grid' | 'list';
  selectedDocumentIds: string[];
  isSelectionMode: boolean;

  // Todo Page
  activeInputItemId: string | null;
  completedSectionExpanded: Record<string, boolean>;

  // Actions
  setHomeViewMode: (mode: 'grid' | 'list') => void;
  toggleHomeViewMode: () => void;
  toggleDocumentSelection: (id: string) => void;
  clearDocumentSelection: () => void;
  setActiveInputItemId: (id: string | null) => void;
  toggleCompletedSection: (documentId: string) => void;
  isCompletedSectionExpanded: (documentId: string) => boolean;
}

export const useUIStore = create<UIState>((set, get) => ({
  homeViewMode: 'grid',
  selectedDocumentIds: [],
  isSelectionMode: false,
  activeInputItemId: null,
  completedSectionExpanded: {},

  setHomeViewMode: (mode) => set({ homeViewMode: mode }),

  toggleHomeViewMode: () =>
    set((state) => ({
      homeViewMode: state.homeViewMode === 'grid' ? 'list' : 'grid',
    })),

  toggleDocumentSelection: (id) =>
    set((state) => {
      const exists = state.selectedDocumentIds.includes(id);
      const newIds = exists
        ? state.selectedDocumentIds.filter((item) => item !== id)
        : [...state.selectedDocumentIds, id];

      return {
        selectedDocumentIds: newIds,
        isSelectionMode: newIds.length > 0,
      };
    }),

  clearDocumentSelection: () =>
    set({
      selectedDocumentIds: [],
      isSelectionMode: false,
    }),

  setActiveInputItemId: (id) => set({ activeInputItemId: id }),

  toggleCompletedSection: (documentId) =>
    set((state) => ({
      completedSectionExpanded: {
        ...state.completedSectionExpanded,
        [documentId]: !(state.completedSectionExpanded[documentId] ?? true),
      },
    })),

  isCompletedSectionExpanded: (documentId) => {
    return get().completedSectionExpanded[documentId] ?? true;
  },
}));
