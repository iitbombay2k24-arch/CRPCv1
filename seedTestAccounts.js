import fs from 'fs';

const API_KEY = 'AIzaSyDFCLrkYJghU0xdUvyGmTFfMxk7QoSLVsY';
const PROJECT_ID = 'crpcv1-9959d';

const users = [
  { email: 'student@dypiu.ac.in', password: 'password123', name: 'Test Student', role: 'Student' },
  { email: 'alumni@dypiu.ac.in', password: 'password123', name: 'Test Alumni', role: 'Alumni' },
  { email: 'faculty@dypiu.ac.in', password: 'password123', name: 'Test Faculty', role: 'Faculty' },
  { email: 'admin@dypiu.ac.in', password: 'password123', name: 'Test Admin', role: 'Admin' },
  { email: 'super@dypiu.ac.in', password: 'password123', name: 'System SuperAdmin', role: 'SuperAdmin' },
  { email: '20240802001@dypiu.ac.in', password: 'password123', name: 'SHARVANI GURUSIDHA GHUGARE', role: 'Student' },
  { email: '20240802002@dypiu.ac.in', password: 'password123', name: 'SWARAJ SACHIN SHASTRI', role: 'Student' },
];

async function seed() {
  for (const u of users) {
    try {
      console.log(`Creating ${u.email}...`);
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, password: u.password, returnSecureToken: true })
      });
      const data = await res.json();
      if (data.error && data.error.message !== 'EMAIL_EXISTS') {
        console.error('Auth Error:', data.error.message);
        continue;
      }
      
      const uid = data.localId;
      if (!uid) {
        // If EMAIL_EXISTS, we'd need to sign in to get the UID, but let's assume this is fresh or we just skip
        console.log(`Email exists or error. Attempting Login to get UID...`);
        const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email: u.email, password: u.password, returnSecureToken: true })
        });
        const loginData = await loginRes.json();
        if (loginData.localId) {
           await saveFirestoreProfile(loginData.localId, u, loginData.idToken);
        }
        continue;
      }

      await saveFirestoreProfile(uid, u, data.idToken);
    } catch (err) {
      console.error(err);
    }
  }
}

async function saveFirestoreProfile(uid, u, idToken) {
  console.log(`Saving profile for ${uid}...`);
  const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const fields = {
    uid: { stringValue: uid },
    email: { stringValue: u.email },
    name: { stringValue: u.name },
    role: { stringValue: u.role },
    status: { stringValue: 'offline' },
    avatar: { stringValue: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}` },
    createdAt: { timestampValue: new Date().toISOString() },
    lastSeen: { timestampValue: new Date().toISOString() }
  };
  
  const res = await fetch(docUrl, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ fields })
  });
  const data = await res.json();
  if (data.error) console.error('Firestore Error:', data.error);
  else console.log(`✓ Profile saved for ${u.role}`);
}

seed();
