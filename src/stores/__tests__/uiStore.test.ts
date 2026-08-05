import { useUIStore } from '../uiStore';

describe('useUIStore Zustand Store', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useUIStore.setState({
      homeViewMode: 'grid',
      selectedDocumentIds: [],
      isSelectionMode: false,
      activeInputItemId: null,
      completedSectionExpanded: {},
    });
  });

  it('should initialize with default values', () => {
    const state = useUIStore.getState();
    expect(state.homeViewMode).toBe('grid');
    expect(state.selectedDocumentIds).toEqual([]);
    expect(state.isSelectionMode).toBe(false);
    expect(state.activeInputItemId).toBeNull();
  });

  it('should set home view mode', () => {
    useUIStore.getState().setHomeViewMode('list');
    expect(useUIStore.getState().homeViewMode).toBe('list');
  });

  it('should toggle home view mode', () => {
    expect(useUIStore.getState().homeViewMode).toBe('grid');
    useUIStore.getState().toggleHomeViewMode();
    expect(useUIStore.getState().homeViewMode).toBe('list');
    useUIStore.getState().toggleHomeViewMode();
    expect(useUIStore.getState().homeViewMode).toBe('grid');
  });

  it('should toggle document selection and manage selection mode', () => {
    const docId = 'doc-1';
    useUIStore.getState().toggleDocumentSelection(docId);
    
    expect(useUIStore.getState().selectedDocumentIds).toEqual([docId]);
    expect(useUIStore.getState().isSelectionMode).toBe(true);

    // Toggle same doc again should deselect it
    useUIStore.getState().toggleDocumentSelection(docId);
    expect(useUIStore.getState().selectedDocumentIds).toEqual([]);
    expect(useUIStore.getState().isSelectionMode).toBe(false);
  });

  it('should clear document selection', () => {
    useUIStore.getState().toggleDocumentSelection('doc-1');
    useUIStore.getState().toggleDocumentSelection('doc-2');
    expect(useUIStore.getState().selectedDocumentIds.length).toBe(2);

    useUIStore.getState().clearDocumentSelection();
    expect(useUIStore.getState().selectedDocumentIds).toEqual([]);
    expect(useUIStore.getState().isSelectionMode).toBe(false);
  });

  it('should set active input item ID', () => {
    useUIStore.getState().setActiveInputItemId('item-123');
    expect(useUIStore.getState().activeInputItemId).toBe('item-123');
    useUIStore.getState().setActiveInputItemId(null);
    expect(useUIStore.getState().activeInputItemId).toBeNull();
  });

  it('should manage expanded state of completed sections', () => {
    const docId = 'doc-xyz';
    // Defaults to true
    expect(useUIStore.getState().isCompletedSectionExpanded(docId)).toBe(true);

    useUIStore.getState().toggleCompletedSection(docId);
    expect(useUIStore.getState().isCompletedSectionExpanded(docId)).toBe(false);

    useUIStore.getState().toggleCompletedSection(docId);
    expect(useUIStore.getState().isCompletedSectionExpanded(docId)).toBe(true);
  });
});
