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

// ---- LOGIN ----
export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (userDoc.exists()) {
    await updateDoc(doc(db, 'users', cred.user.uid), {
      status: 'online',
      lastSeen: serverTimestamp()
    });
    return { uid: cred.user.uid, ...userDoc.data() };
  }
  return null;
}

// ---- REGISTER ----
export async function registerUser({ email, password, name, prn, role, division, batch, branch }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Send email verification (PRD: unverified users cannot access app)
  await sendEmailVerification(cred.user);

  const userData = {
    uid: cred.user.uid,
    email,
    name,
    prn: prn || '',
    role: role || 'Student',
    division: division || 'A',
    batch: batch || '',
    branch: branch || '',
    cgpa: 0,
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
    } catch (e) { /* ignore if profile doesn't exist */ }
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
      const profile = await getUserProfile(user.uid);
      callback(user, profile);
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
