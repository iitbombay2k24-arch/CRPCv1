// ============================================
// Firebase Auth Service
// Handles: Login, Logout, Register, User profiles
// ============================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, collection, getDocs, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ROLE_LEVEL, ROLES, isValidDomain } from '../lib/rbac';
import { STUDENT_MASTER_LIST } from '../lib/studentData';

function normalizeUserProfile(data = {}, uid) {
  const safeRole = ROLE_LEVEL[data.role] ? data.role : ROLES.STUDENT;
  return {
    uid,
    ...data,
    role: safeRole,
    roleLevel: ROLE_LEVEL[safeRole]
  };
}

function assertValidInstitutionEmail(email) {
  if (!isValidDomain(email)) {
    throw new Error('Use your DYPIU institutional email to continue.');
  }
}

// ---- LOGIN ----
export async function loginUser(email, password) {
  assertValidInstitutionEmail(email);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (userDoc.exists()) {
    await updateDoc(doc(db, 'users', cred.user.uid), {
      status: 'online',
      lastSeen: serverTimestamp()
    });
    return normalizeUserProfile(userDoc.data(), cred.user.uid);
  }
  return null;
}

// ---- REGISTER ----
export async function registerUser({ email, password, name, prn, division, batch, branch }) {
  assertValidInstitutionEmail(email);

  // MASTER PRN VALIDATION
  const masterRecord = STUDENT_MASTER_LIST.find(s => s.prn === prn);
  if (!masterRecord) {
    throw new Error('Invalid PRN. Enrollment verification failed. Please check your PRN or contact admin.');
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Send email verification (PRD: unverified users cannot access app)
  await sendEmailVerification(cred.user);

  const userData = {
    uid: cred.user.uid,
    email,
    name: masterRecord.name || name, // Prefer official records
    prn: prn,
    role: ROLES.STUDENT,
    division: masterRecord.div || division || 'A',
    batch: batch || '2024-2028',
    branch: branch || 'Computer Engineering',
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
  return normalizeUserProfile(userData, cred.user.uid);
}

export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found. Please sign in again.');
  }
  if (user.emailVerified) {
    return { alreadyVerified: true };
  }
  await sendEmailVerification(user);
  return { alreadyVerified: false };
}

export async function refreshCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;
  await reload(user);
  return auth.currentUser;
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
  return snap.exists() ? normalizeUserProfile(snap.data(), snap.id) : null;
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
        callback(user, profile || { 
          uid: user.uid,
          name: user.email?.split('@')[0] || 'User',
          email: user.email,
          role: ROLES.STUDENT,
          roleLevel: ROLE_LEVEL[ROLES.STUDENT],
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}` 
        });
      } catch (err) {
        console.warn('Failed to fetch user profile, using fallback:', err);
        callback(user, { 
          uid: user.uid,
          name: user.email?.split('@')[0] || 'User',
          email: user.email,
          role: ROLES.STUDENT,
          roleLevel: ROLE_LEVEL[ROLES.STUDENT],
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
