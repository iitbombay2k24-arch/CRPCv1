import fs from 'fs';

const API_KEY = 'AIzaSyDFCLrkYJghU0xdUvyGmTFfMxk7QoSLVsY';
const PROJECT_ID = 'crpcv1-9959d';

const users = [
  { email: 'student@dypiu.ac.in', password: 'test123', name: 'Test Student', role: 'Student' },
  { email: 'alumni@dypiu.ac.in', password: 'test123', name: 'Test Alumni', role: 'Alumni' },
  { email: 'faculty@dypiu.ac.in', password: 'test123', name: 'Test Faculty', role: 'Faculty' },
  { email: 'admin@dypiu.ac.in', password: 'test123', name: 'Test Admin', role: 'Admin' },
  { email: 'super@dypiu.ac.in', password: 'testadmin', name: 'System SuperAdmin', role: 'SuperAdmin' },
  
  // First 10 master students for immediate testing
  { prn: "20240802001", name: "SHARVANI GURUSIDHA GHUGARE", div: "A", email: "20240802001@dypiu.ac.in", password: "test123", role: 'Student' },
  { prn: "20240802002", name: "SWARAJ SACHIN SHASTRI", div: "A", email: "20240802002@dypiu.ac.in", password: "test123", role: 'Student' },
  { prn: "20240802003", name: "RISHI KUMAR PANDA", div: "A", email: "20240802003@dypiu.ac.in", password: "test123", role: 'Student' },
  { prn: "20240802006", name: "RUTUL RAJESH BHIWAPURKAR", div: "A", email: "20240802006@dypiu.ac.in", password: "test123", role: 'Student' },
  { prn: "20240802007", name: "MISHTI GOEL", div: "A", email: "20240802007@dypiu.ac.in", password: "test123", role: 'Student' },
  { prn: "20240802008", name: "ADARSH RANJAN", div: "A", email: "20240802008@dypiu.ac.in", password: "test123", role: 'Student' },
  { prn: "20240802009", name: "SNEHA CHAKRABORTY", div: "A", email: "20240802009@dypiu.ac.in", password: "test123", role: 'Student' },
  { prn: "20240802011", name: "VAIBHAV VISHWANATH PADAVE", div: "A", email: "20240802011@dypiu.ac.in", password: "test123", role: 'Student' },
  { prn: "20240802012", name: "PRATHAMESH DEORE", div: "A", email: "20240802012@dypiu.ac.in", password: "test123", role: 'Student' },
  { prn: "20240802013", name: "KRUSHNA NIRMALKAR", div: "A", email: "20240802013@dypiu.ac.in", password: "test123", role: 'Student' },
];

async function seed() {
  for (const u of users) {
    try {
      console.log(`Processing ${u.email}...`);
      
      // Step 1: Try to SignUp
      let res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, password: u.password, returnSecureToken: true })
      });
      let data = await res.json();
      
      let uid, idToken;

      if (data.error && data.error.message === 'EMAIL_EXISTS') {
        console.log(`Email ${u.email} exists. Refreshing profile...`);
        // Step 2: Login to get UID and Token if already exists
        const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: u.email, password: u.password, returnSecureToken: true })
        });
        const loginData = await loginRes.json();
        
        if (loginData.error) {
           // If password changed or something, let's try to update password? 
           // For simplicity in seeding, we assume test123/testadmin is used or we error.
           console.error(`Login failed for ${u.email}: ${loginData.error.message}`);
           continue;
        }
        uid = loginData.localId;
        idToken = loginData.idToken;
      } else if (data.error) {
        console.error(`Auth Error for ${u.email}:`, data.error.message);
        continue;
      } else {
        uid = data.localId;
        idToken = data.idToken;
      }

      await saveFirestoreProfile(uid, u, idToken);
    } catch (err) {
      console.error(`Error processing ${u.email}:`, err);
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
    role: { stringValue: u.role || 'Student' },
    status: { stringValue: 'offline' },
    avatar: { stringValue: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}` },
    createdAt: { timestampValue: new Date().toISOString() },
    lastSeen: { timestampValue: new Date().toISOString() }
  };

  if (u.prn) fields.prn = { stringValue: u.prn };
  if (u.div) fields.division = { stringValue: u.div };
  
  const res = await fetch(docUrl, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ fields })
  });
  
  const data = await res.json();
  if (data.error) console.error(`Firestore Error for ${u.email}:`, data.error);
  else console.log(`✓ Profile saved/updated for ${u.email} (${u.role || 'Student'})`);
}

seed();
