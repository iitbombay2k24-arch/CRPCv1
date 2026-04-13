// Auth Store — manages user authentication state
import { create } from 'zustand';
import { hasPermission, ROLES } from '../lib/rbac';

const useAuthStore = create((set, get) => ({
  firebaseUser: null,
  user: null,
  isLoading: true,

  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  can: (permission) => hasPermission(get().user?.role || ROLES.STUDENT, permission),
  getUid: () => get().firebaseUser?.uid || null,
  getRole: () => get().user?.role || ROLES.STUDENT,

  logout: () => set({ firebaseUser: null, user: null, isLoading: false }),
}));

export default useAuthStore;
