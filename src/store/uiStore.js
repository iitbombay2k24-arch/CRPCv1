// UI Store — manages global UI state
import { create } from 'zustand';

const useUIStore = create((set) => ({
  activeTab: 'chat',
  isDarkMode: true,
  isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  dndEnabled: false,
  userStatus: 'online',
  profilePanelOpen: false,
  searchQuery: '',
  isSearching: false,
  dmTarget: null,
  dmList: [],
  callType: 'video',

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleDarkMode: () => set(s => ({ isDarkMode: !s.isDarkMode })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set(s => ({ isSidebarOpen: !s.isSidebarOpen })),
  closeMobileSidebar: () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) set({ isSidebarOpen: false });
  },
  setDndEnabled: (enabled) => set({ dndEnabled: enabled }),
  setUserStatus: (status) => set({ userStatus: status }),
  setProfilePanelOpen: (open) => set({ profilePanelOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setDmTarget: (target) => set({ dmTarget: target }),
  setDmList: (list) => set({ dmList: list }),
  setCallType: (type) => set({ callType: type }),
}));

export default useUIStore;
