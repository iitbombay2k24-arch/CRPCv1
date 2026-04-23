// ============================================
// Firebase Auth Service
// Handles: Login, Logout, Register, User profiles
// ============================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, collection, getDocs, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ROLE_LEVEL } from '../lib/rbac';

export async function loginUser(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      await updateDoc(doc(db, 'users', cred.user.uid), {
        status: 'online',
        lastSeen: serverTimestamp()
      });
      return { uid: cred.user.uid, ...userDoc.data() };
    }
  } catch (error) {
    // If it's a dev environment and password is 'testadmin', we can potentially bypass
    // But Firebase Auth is strict. The real solution is completing the bulk update.
    throw error;
  }
  return null;
}

// ---- REGISTER ----
export async function registerUser({ email, password, name, prn, role, division, batch, branch }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Send email verification (PRD: unverified users cannot access app)
  await sendEmailVerification(cred.user);

  const assignedRole = role || 'Student';
  const userData = {
    uid: cred.user.uid,
    email,
    name,
    prn: prn || '',
    role: assignedRole,
    roleLevel: ROLE_LEVEL[assignedRole] || 1,
    division: division || 'A',
    batch: batch || '',
    branch: branch || '',
    cgpa: 0,
    streak: 0,
    quizzesTaken: 0,
    isActive: true,
    status: 'online',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    privacySettings: {
      readReceiptsEnabled: true,
      onlineStatusVisible: true,
      profileVisibility: 'public'
    },
    engagementScore: 0,
    badgeList: [],
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp()
  };

  await setDoc(doc(db, 'users', cred.user.uid), userData);
  return { uid: cred.user.uid, ...userData };
}

// ---- LOGOUT ----
export async function logoutUser() {
  const user = auth.currentUser;
  if (user) {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status: 'offline',
        lastSeen: serverTimestamp()
      });
    } catch (_) { /* ignore if profile doesn't exist */ }
  }
  await signOut(auth);
}

// ---- GET USER PROFILE ----
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

// ---- UPDATE USER STATUS ----
export async function updateUserStatus(uid, status) {
  await updateDoc(doc(db, 'users', uid), { status, lastSeen: serverTimestamp() });
}

// ---- AUTH STATE LISTENER ----
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          // Ensure roleLevel is always present (backfill for existing users)
          if (!profile.roleLevel) {
            profile.roleLevel = ROLE_LEVEL[profile.role] || 1;
          }
          callback(user, profile);
        } else {
          const fallback = {
            uid: user.uid,
            name: user.email?.split('@')[0] || 'User',
            email: user.email,
            role: 'Student',
            roleLevel: 1,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
          };
          callback(user, fallback);
        }
      } catch (err) {
        console.warn('Failed to fetch user profile, using fallback:', err);
        callback(user, {
          uid: user.uid,
          name: user.email?.split('@')[0] || 'User',
          email: user.email,
          role: 'Student',
          roleLevel: 1,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
        });
      }
    } else {
      callback(null, null);
    }
  });
}

// ---- SEARCH USERS ----
export async function searchUsers(searchTerm) {
  const snap = await getDocs(collection(db, 'users'));
  const term = searchTerm.toLowerCase();
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(u =>
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.prn?.toLowerCase().includes(term)
    );
}

// ---- GET ALL USERS (Admin) ----
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}
