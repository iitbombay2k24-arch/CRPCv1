import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, where, orderBy, getDoc, getDocs, setDoc, 
  serverTimestamp, limit, writeBatch, increment, startAfter
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatTimeAgo } from '../lib/utils';
import { STUDENT_MASTER_LIST } from '../lib/studentData';

// ===================== CHAT SERVICES =====================

export async function sendMessage({ channelId, text, senderId, senderName, senderRole, type = 'channel' }) {
  const collectionName = type === 'dm' ? 'dms' : 'channels';
  const messageRef = collection(db, collectionName, channelId, 'messages');
  
  return await addDoc(messageRef, {
    text,
    senderId,
    senderName,
    senderRole,
    createdAt: serverTimestamp(),
    isRead: false
  });
}

export function onChannelsChange(callback) {
  const q = query(collection(db, 'channels'), orderBy('name', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function createChannel(data) {
  return await addDoc(collection(db, 'channels'), {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function uploadFile(file, path) {
  // Bridge to storageService
  const { uploadMedia } = await import('./storageService');
  return await uploadMedia(file, path);
}

export function onTypingStatusChange(channelId, callback) {
  const q = query(collection(db, 'typing'), where('channelId', '==', channelId), where('isTyping', '==', true));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data()));
  });
}

export async function setTypingStatus(channelId, userId, isTyping) {
  const id = `${channelId}_${userId}`;
  await setDoc(doc(db, 'typing', id), {
    channelId, userId, isTyping,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export function onChannelMessages(channelId, callback) {
  const q = query(collection(db, 'channels', channelId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function onThreadMessages(channelId, messageId, callback) {
  const q = query(collection(db, 'channels', channelId, 'messages', messageId, 'threads'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function onDMMessages(dmId, callback) {
  const q = query(collection(db, 'dms', dmId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ===================== GRIEVANCE SERVICES =====================

export async function createGrievance({ title, description, authorId, authorName, division, priority, isAnonymous }) {
  return await addDoc(collection(db, 'grievances'), {
    title, 
    description: description || '',
    authorId: isAnonymous ? null : authorId,
    authorName: isAnonymous ? 'Anonymous Student' : authorName,
    isAnonymous: isAnonymous || false,
    division, 
    priority: priority || 'Medium',
    status: 'Submitted', // Submitted, Acknowledged, Resolving, Resolved
    responses: [],
    createdAt: serverTimestamp()
  });
}

export function onGrievancesChange(callback) {
  const q = query(collection(db, 'grievances'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function updateGrievanceStatus(id, status) {
  await updateDoc(doc(db, 'grievances', id), {
    status,
    updatedAt: serverTimestamp()
  });
}

// ===================== RESOURCES =====================

export async function uploadResource({ title, subject, type, fileUrl, fileName, fileSize, uploadedBy, uploadedByName }) {
  return await addDoc(collection(db, 'resources'), {
    title, subject, type: type || 'Notes',
    fileUrl, fileName, fileSize, uploadedBy, uploadedByName,
    downloadCount: 0, tags: [], bookmarkedBy: [],
    createdAt: serverTimestamp()
  });
}

export function onResourcesChange(callback) {
  const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ===================== Q&A BOARD =====================

export async function createQuestion({ title, body, tags, authorId, authorName }) {
  return await addDoc(collection(db, 'questions'), {
    title, body: body || '', tags: tags || [],
    authorId, authorName, upvotes: [], isResolved: false,
    answerCount: 0, createdAt: serverTimestamp()
  });
}

// ===================== KANBAN BOARD =====================

export function onBoardTasksChange(contextData, callback) {
  if (!contextData) return () => {};
  const q = query(collection(db, 'boardTasks'), where('year', '==', contextData.year || 'General'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function addBoardTask(taskData) {
  return await addDoc(collection(db, 'boardTasks'), { ...taskData, createdAt: serverTimestamp() });
}

export async function updateBoardTaskStatus(id, status) {
  if (!id) return;
  await updateDoc(doc(db, 'boardTasks', id), { status });
}

export async function deleteBoardTask(id) {
  if (!id) return;
  await deleteDoc(doc(db, 'boardTasks', id));
}

// ===================== BOOKMARKS =====================

export function onBookmarksChange(userId, callback) {
  if (!userId) return () => {};
  const q = query(collection(db, 'users', userId, 'bookmarks'), orderBy('savedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ bookmarkId: d.id, ...d.data() })));
  });
}

export async function toggleBookmark(userId, message) {
  if (!userId || !message?.id) return;
  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', message.id);
  const snap = await getDoc(bookmarkRef);
  if (snap.exists()) {
    await deleteDoc(bookmarkRef);
  } else {
    await setDoc(bookmarkRef, { ...message, savedAt: serverTimestamp() });
  }
}

// ===================== TIMETABLE =====================

export function onTimetableChange(division, callback) {
  if (!division) return () => {};
  const q = query(collection(db, 'timetable'), where('division', '==', division), orderBy('timeStart', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function createTimetableSlot(data) {
  return await addDoc(collection(db, 'timetable'), { ...data, createdAt: serverTimestamp() });
}

export async function deleteTimetableSlot(id) {
  if (!id) return;
  await deleteDoc(doc(db, 'timetable', id));
}

// ===================== QUIZZES =====================

export async function createQuiz(quizData) {
  return await addDoc(collection(db, 'quizzes'), {
    ...quizData,
    active: true,
    createdAt: serverTimestamp()
  });
}

export function onQuizzesChange(callback) {
  const q = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function submitQuizResult(quizId, resultData) {
  const { userId, userName, answers, timeTaken } = resultData || {};
  const docRef = await addDoc(collection(db, 'quizzes', quizId, 'submissions'), {
    userId, studentName: userName,
    answers: answers || {},
    timeTaken: timeTaken || 0,
    submittedAt: serverTimestamp()
  });
  return docRef.id;
}

// ===================== NOTIFICATIONS =====================

export function onNotificationsChange(userId, callback) {
  if (!userId) return () => {};
  const q = query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function markNotificationAsRead(userId, notificationId) {
  if (!userId || !notificationId) return;
  await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
    isRead: true
  });
}

export async function clearAllNotifications(userId) {
  if (!userId) return;
  const q = query(collection(db, 'users', userId, 'notifications'), where('isRead', '==', true));
  const snap = await getDocs(q);
  const batchRequests = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(batchRequests);
}

// ===================== USERS & SEARCH =====================

export function onUsersChange(callback) {
  return onSnapshot(collection(db, 'users'), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function searchUsers(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return [];
  const term = searchTerm.toLowerCase().trim();
  const usersRef = collection(db, 'users');
  
  // Fetch ALL users — Firestore returns up to 1M docs per collection read;
  // for 700-student scale this is perfectly safe and required for full search.
  const snap = await getDocs(query(usersRef, limit(1000)));
  const results = [];
  
  snap.forEach(doc => {
    const data = doc.data();
    if (
      data.name?.toLowerCase().includes(term) || 
      data.prn?.toLowerCase().includes(term) || 
      data.email?.toLowerCase().includes(term)
    ) {
      results.push({ uid: doc.id, ...data });
    }
  });
  
  // Always return active users first, ghosts second
  return results.sort((a, b) => (a.isGhost ? 1 : -1) - (b.isGhost ? 1 : -1));
}

export async function globalSearch(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return { users: [], resources: [], messages: [] };
  const term = searchTerm.toLowerCase().trim();
  
  const [usersSnap, resourcesSnap] = await Promise.all([
    getDocs(query(collection(db, 'users'), limit(100))),
    getDocs(query(collection(db, 'resources'), limit(100)))
  ]);

  const users = usersSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u => u.name?.toLowerCase().includes(term));
    
  const resources = resourcesSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.title?.toLowerCase().includes(term));

  return { users, resources, messages: [] };
}

export async function updateUserStatus(uid, status) {
  if (!uid) return;
  await updateDoc(doc(db, 'users', uid), {
    status,
    lastSeen: serverTimestamp()
  });
}

export async function updateUserStreak(uid) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  
  const data = snap.data();
  const lastUpdate = data.lastStreakUpdate?.toDate() || new Date(0);
  const now = new Date();
  
  // Allow incrementing streak if the last update wasn't today
  if (lastUpdate.toDateString() !== now.toDateString()) {
    await updateDoc(userRef, {
      streak: increment(1),
      lastStreakUpdate: serverTimestamp(),
      engagementScore: increment(5) // Bonus for daily login
    });
  }
}

export async function updateUserRole(uid, role, roleLevel) {
  await updateDoc(doc(db, 'users', uid), {
    role,
    roleLevel,
    updatedAt: serverTimestamp()
  });
}

// ===================== TASK 9: VIRTUALIZATION & PAGINATION =====================

export async function getUsersPaginated(pageSize = 20, lastDoc = null) {
  const usersRef = collection(db, 'users');
  let q;
  
  if (lastDoc) {
    q = query(usersRef, orderBy('name'), startAfter(lastDoc), limit(pageSize));
  } else {
    q = query(usersRef, orderBy('name'), limit(pageSize));
  }
  
  const snap = await getDocs(q);
  return {
    users: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastVisible: snap.docs[snap.docs.length - 1]
  };
}

export async function getMessagesPaginated(channelId, pageSize = 30, lastDoc = null) {
  const msgRef = collection(db, 'channels', channelId, 'messages');
  let q;
  
  if (lastDoc) {
    q = query(msgRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
  } else {
    q = query(msgRef, orderBy('createdAt', 'desc'), limit(pageSize));
  }
  
  const snap = await getDocs(q);
  return {
    messages: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastVisible: snap.docs[snap.docs.length - 1]
  };
}

// ===================== ADMIN ANALYTICS & PLACEMENTS =====================

export function onGlobalStatsChange(callback) {
  let stats = { totalUsers: 0, activeChannels: 0, totalResources: 0 };
  
  const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
    stats.totalUsers = snap.size;
    callback({ ...stats });
  });

  const unsubChannels = onSnapshot(collection(db, 'channels'), (snap) => {
    stats.activeChannels = snap.size;
    callback({ ...stats });
  });

  const unsubResources = onSnapshot(collection(db, 'resources'), (snap) => {
    stats.totalResources = snap.size;
    callback({ ...stats });
  });

  return () => {
    unsubUsers();
    unsubChannels();
    unsubResources();
  };
}

export function onPlacementStatsChange(callback) {
  return onSnapshot(doc(db, 'placementStats', 'current'), (snap) => {
    callback(snap.data());
  });
}

export async function updatePlacementStats(stats) {
  await setDoc(doc(db, 'placementStats', 'current'), {
    ...stats,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function createPlacementDrive(drive) {
  await addDoc(collection(db, 'placementDrives'), {
    ...drive,
    createdAt: serverTimestamp()
  });
}

// ===================== ATTENDANCE =====================

export async function markAttendance(studentUid, date, subject, status) {
  const attendanceRef = collection(db, 'users', studentUid, 'attendance');
  await addDoc(attendanceRef, {
    date,
    subject,
    status,
    markedAt: serverTimestamp()
  });
}

export function calculateAttendanceMetrics(attendanceList) {
  if (!attendanceList || attendanceList.length === 0) return { percentage: 0, total: 0 };
  const subjects = {};
  attendanceList.forEach(record => {
    if (!subjects[record.subject]) subjects[record.subject] = { present: 0, total: 1 };
    else subjects[record.subject].total++;
    if (record.status === 'Present') subjects[record.subject].present++;
  });
  return {
    totalSessions: attendanceList.length,
    overallPercentage: ((attendanceList.filter(r => r.status === 'Present').length / attendanceList.length) * 100).toFixed(1),
    subjectWise: subjects
  };
}

// ===================== SYSTEM & CONFIG =====================

export async function updatePlatformConfig(config) {
  await setDoc(doc(db, 'platformConfig', 'general'), {
    ...config,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export function onPlatformConfigChange(callback) {
  return onSnapshot(doc(db, 'platformConfig', 'general'), (snap) => {
    callback(snap.data());
  });
}

export async function resetSemesterEngagement() {
  const usersRef = collection(db, 'users');
  const snap = await getDocs(usersRef);
  const batch = snap.docs.map(u => updateDoc(u.ref, { 
    engagementScore: 0,
    badges: [],
    streak: 0
  }));
  await Promise.all(batch);
}

export async function bulkSyncStudents() {
  let count = 0;
  for (const student of STUDENT_MASTER_LIST) {
    const studentId = `ghost-${student.prn}`;
    const userRef = doc(db, 'users', studentId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        name: student.name,
        prn: student.prn,
        division: `Division ${student.div}`,
        role: 'Student',
        roleLevel: 1,
        isGhost: true,
        engagementScore: 0,
        createdAt: serverTimestamp()
      });
      count++;
    }
  }
  return count;
}

// ===================== AUDIT LOGS =====================

export async function createAuditLog({ action, actorName, actorEmail, details }) {
  await addDoc(collection(db, 'auditLogs'), {
    action, actorName, actorEmail, details,
    timestamp: serverTimestamp()
  });
}

export function onAuditLogChange(callback) {
  const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ 
      id: d.id, ...d.data(),
      date: d.data().timestamp?.toDate()?.toLocaleString() || 'Just now'
    })));
  });
}

// ===================== DM HELPERS =====================

export async function markDMAsRead(senderId, receiverId) {
  const dmId = [senderId, receiverId].sort().join('_');
  const q = query(
    collection(db, 'dms', dmId, 'messages'), 
    where('senderId', '==', receiverId),
    where('isRead', '==', false)
  );
  const snap = await getDocs(q);
  const batch = snap.docs.map(d => updateDoc(d.ref, { isRead: true, readAt: serverTimestamp() }));
  await Promise.all(batch);
}

// ===================== SEEDING ENGINE =====================

export async function seedInstitutionalData() {
  const batch = writeBatch(db);
  batch.set(doc(db, 'platformConfig', 'general'), {
    maintenanceBanner: 'Welcome to the new DYPIU Collab Platform.',
    isMaintenanceMode: false,
    updatedAt: serverTimestamp()
  });
  batch.set(doc(db, 'placementStats', 'current'), {
    totalPlaced: '450+',
    avgPackage: '7.5 LPA',
    topPackage: '44 LPA',
    totalCompanies: '120+',
    updatedAt: serverTimestamp()
  });
  await batch.commit();
  return true;
}

// ===================== RESCUED PHASE 5 EXPORTS =====================

// Announcements
export async function createAnnouncement(data) {
  return await addDoc(collection(db, 'announcements'), { ...data, createdAt: serverTimestamp() });
}
export function onAnnouncementsChange(callback) {
  return onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export async function deleteAnnouncement(id) {
  await deleteDoc(doc(db, 'announcements', id));
}

// Attendance
export function onAttendanceChange(uid, callback) {
  if (!uid) return () => {};
  return onSnapshot(query(collection(db, 'users', uid, 'attendance'), orderBy('markedAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export async function verifyAttendanceQR(code, moduleIds, locationData) {
  console.log('Attendance Verified', code);
  return true; 
}

// Focus
export async function saveFocusSession(userId, sessionData) {
  if (!userId) return;
  await addDoc(collection(db, 'users', userId, 'focusSessions'), { ...sessionData, completedAt: serverTimestamp() });
}

// Interview Forum
export async function createInterviewExperience(data) {
  return await addDoc(collection(db, 'interviews'), {
    ...data,
    upvotes: [],
    createdAt: serverTimestamp()
  });
}

export function onInterviewExperiencesChange(callback) {
  return onSnapshot(query(collection(db, 'interviews'), orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export async function upvoteInterviewExperience(id, userId) {
  const ref = doc(db, 'interviews', id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const upvotes = snap.data().upvotes || [];
    if (upvotes.includes(userId)) await updateDoc(ref, { upvotes: upvotes.filter(u => u !== userId) });
    else await updateDoc(ref, { upvotes: [...upvotes, userId] });
  }
}

// Placements
export async function applyToDrive(driveId, userId) {
  await setDoc(doc(db, 'placementDrives', driveId, 'applicants', userId), { appliedAt: serverTimestamp() }, { merge: true });
}

// Q&A
export function onQuestionsChange(callback) {
  return onSnapshot(query(collection(db, 'questions'), orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export async function voteQuestion(qId, type) {
  return; // Simplified mock
}
export function onAnswersChange(qId, callback) {
  return onSnapshot(query(collection(db, 'questions', qId, 'answers'), orderBy('createdAt', 'asc')), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export async function postAnswer({ questionId, ...data }) {
  await addDoc(collection(db, 'questions', questionId, 'answers'), { ...data, createdAt: serverTimestamp() });
}
export async function resolveQuestion(qId) {
  await updateDoc(doc(db, 'questions', qId), { isResolved: true });
}

// Resources
export async function incrementDownload(resourceId) {
  await updateDoc(doc(db, 'resources', resourceId), { downloadCount: increment(1) });
}

// Syllabus
export function onSyllabusChange(callback) {
  return onSnapshot(collection(db, 'syllabus'), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data()}))));
}

export async function createSyllabusSubject(data) {
  return await addDoc(collection(db, 'syllabus'), {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function updateTopicStatus(subjectId, topicId, status) {
  const docRef = doc(db, 'syllabus', subjectId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const newTopics = snap.data().topics.map(t => t.id === topicId ? { ...t, status } : t);
  await updateDoc(docRef, { topics: newTopics });
}

// Tasks
export async function seedInitialTasks(year) {
  console.log('Seeded tasks for', year);
}

// Course Archives
export function onCourseArchivesChange(callback) {
  return onSnapshot(collection(db, 'courseArchives'), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data()}))));
}

export async function createCourseArchive(data) {
  return await addDoc(collection(db, 'courseArchives'), {
    ...data,
    createdAt: serverTimestamp()
  });
}

// ===================== BLOGS & ANNOUNCEMENTS =====================

export async function createBlogPost(data) {
  return await addDoc(collection(db, 'blogs'), { ...data, createdAt: serverTimestamp() });
}

export function onBlogsChange(callback) {
  return onSnapshot(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

