// ============================================
// Firebase Firestore Service
// Handles: Channels, Messages, DMs, Resources, etc.
// ============================================

import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, increment, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { formatTimeAgo } from '../lib/utils';
import { STUDENT_MASTER_LIST } from '../lib/studentData';

// ===================== CHANNELS =====================

export function onChannelsChange(callback) {
  return onSnapshot(collection(db, 'channels'), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function createChannel({ name, description, type, category, createdBy }) {
  const docRef = await addDoc(collection(db, 'channels'), {
    name,
    description: description || `Official channel for ${name}`,
    type: type || 'general',
    category: category || 'General',
    isLocked: false,
    pinnedMessages: [],
    memberCount: 0,
    createdBy,
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, name };
}

export async function toggleChannelLock(channelId) {
  const snap = await getDoc(doc(db, 'channels', channelId));
  if (snap.exists()) {
    await updateDoc(doc(db, 'channels', channelId), { isLocked: !snap.data().isLocked });
  }
}

export async function deleteChannel(channelId) {
  await deleteDoc(doc(db, 'channels', channelId));
}

// ===================== MESSAGING =====================

export function onChannelMessages(channelId, callback) {
  const q = query(
    collection(db, 'channels', channelId, 'messages'),
    where('parentId', '==', null),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      timestamp: d.data().createdAt?.toDate() || new Date()
    })));
  });
}

export function onDMMessages(dmId, callback) {
  const q = query(
    collection(db, 'dms', dmId, 'messages'),
    where('parentId', '==', null),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      timestamp: d.data().createdAt?.toDate() || new Date()
    })));
  });
}

export function onThreadMessages(containerId, parentId, callback, isDM = false) {
  const coll = isDM ? 'dms' : 'channels';
  const q = query(
    collection(db, coll, containerId, 'messages'),
    where('parentId', '==', parentId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      timestamp: d.data().createdAt?.toDate() || new Date()
    })));
  });
}

export async function sendMessage({ channelId, text, senderId, senderName, senderEmail, senderRole, type, parentId, files }) {
  let collPath;
  if (type === 'dm') {
    const dmId = channelId; // For DMs, channelId is the combinedId
    collPath = `dms/${dmId}/messages`;
  } else {
    collPath = `channels/${channelId}/messages`;
  }
  
  const msgData = {
    text,
    senderId,
    senderName,
    senderEmail,
    senderRole,
    parentId: parentId || null,
    reactions: {},
    isPinned: false,
    isRead: false,
    readAt: null,
    isDeleted: false,
    dlpFlagged: false,
    attachments: files || [],
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, collPath), msgData);
  
  if (parentId) {
    const parentRef = doc(db, type === 'dm' ? 'dms' : 'channels', channelId, 'messages', parentId);
    await updateDoc(parentRef, {
      replyCount: increment(1),
      lastReplyAt: serverTimestamp()
    });
  }

  return docRef.id;
}


export async function deleteMessage(containerId, messageId, isDM = false) {
  const coll = isDM ? 'dms' : 'channels';
  await deleteDoc(doc(db, coll, containerId, 'messages', messageId));
}

export async function togglePinMessage(containerId, messageId, isDM = false) {
  const coll = isDM ? 'dms' : 'channels';
  const msgRef = doc(db, coll, containerId, 'messages', messageId);
  const snap = await getDoc(msgRef);
  if (snap.exists()) {
    await updateDoc(msgRef, { isPinned: !snap.data().isPinned });
  }
}

export async function addReaction(containerId, messageId, emoji, userId, isDM = false) {
  const coll = isDM ? 'dms' : 'channels';
  const msgRef = doc(db, coll, containerId, 'messages', messageId);
  const snap = await getDoc(msgRef);
  if (snap.exists()) {
    const reactions = snap.data().reactions || {};
    const users = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
    const newUsers = users.includes(userId) ? users.filter(u => u !== userId) : [...users, userId];
    await updateDoc(msgRef, { [`reactions.${emoji}`]: newUsers });
  }
}



// ===================== ANNOUNCEMENTS =====================

export function onAnnouncementsChange(callback) {
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      time: formatTimeAgo(d.data().createdAt?.toDate())
    })));
  });
}

export async function createAnnouncement({ title, body, tag, author, authorId, division, isPinned }) {
  return await addDoc(collection(db, 'announcements'), {
    title, body, tag: tag || 'Notice', author, authorId,
    division: division || 'All', isPinned: isPinned || false,
    createdAt: serverTimestamp()
  });
}

export async function deleteAnnouncement(id) {
  await deleteDoc(doc(db, 'announcements', id));
}



// ===================== GRIEVANCES =====================

export async function createGrievance({ title, description, authorId, authorName, division, priority, isAnonymous }) {
  return await addDoc(collection(db, 'grievances'), {
    title, description: description || '',
    authorId: isAnonymous ? null : authorId,
    authorName: isAnonymous ? 'Anonymous Student' : authorName,
    isAnonymous: isAnonymous || false,
    division, priority: priority || 'Medium',
    status: 'Open', responses: [],
    slaDeadline: null, // Set by Cloud Function: createdAt + 72hr
    createdAt: serverTimestamp(), resolvedAt: null
  });
}



export function onGrievancesChange(callback) {
  const q = query(collection(db, 'grievances'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      time: formatTimeAgo(d.data().createdAt?.toDate())
    })));
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

// ===================== GLOBAL STATS =====================

export async function getGlobalStats() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const channelsSnap = await getDocs(collection(db, 'channels'));
  const resourcesSnap = await getDocs(collection(db, 'resources'));
  return {
    totalUsers: usersSnap.size,
    activeChannels: channelsSnap.size,
    totalResources: resourcesSnap.size,
  };
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
  const { userId, userName, score, total, answers, timeTaken } = resultData || {};
  return await addDoc(collection(db, 'quizzes', quizId, 'results'), {
    studentId: userId, studentName: userName, score, total,
    answers: answers || {},
    timeTaken: timeTaken || 0,
    submittedAt: serverTimestamp()
  });
}

export function onQuizSubmissions(quizId, callback) {
  const q = query(collection(db, 'quizzes', quizId, 'submissions'), orderBy('score', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ===================== USERS =====================

export function onUsersChange(callback) {
  return onSnapshot(collection(db, 'users'), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function updateUserStatus(uid, status) {
  if (!uid) return;
  await updateDoc(doc(db, 'users', uid), {
    status,
    lastSeen: serverTimestamp()
  });
}

// ===================== NOTIFICATIONS =====================

export function onNotificationsChange(userId, callback) {
  if (!userId) return () => {};
  const q = query(
    collection(db, 'users', userId, 'notifications'), 
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}



export async function createNotification(userId, { title, body, type, metadata }) {
  await addDoc(collection(db, 'users', userId, 'notifications'), {
    title, body, type, metadata: metadata || {},
    isRead: false,
    createdAt: serverTimestamp()
  });
}

// ===================== GLOBAL STATS (REAL TIME) =====================

export function onGlobalStatsChange(callback) {
  // Composite listener for high-level stats
  const unsubUsers = onSnapshot(collection(db, 'users'), (uSnap) => {
    const unsubChannels = onSnapshot(collection(db, 'channels'), (cSnap) => {
      const unsubResources = onSnapshot(collection(db, 'resources'), (rSnap) => {
        callback({
          totalUsers: uSnap.size,
          activeChannels: cSnap.size,
          totalResources: rSnap.size,
          lastUpdated: new Date()
        });
      });
      return unsubResources;
    });
    return unsubChannels;
  });
  return unsubUsers;
}

export function onPlacementStatsChange(callback) {
  return onSnapshot(doc(db, 'platformStats', 'placement'), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  });
}

export async function updatePlacementStats(stats) {
  const statsRef = doc(db, 'platformStats', 'placement');
  await setDoc(statsRef, {
    ...stats,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function createPlacementDrive(drive) {
  return await addDoc(collection(db, 'placementDrives'), {
    ...drive,
    createdAt: serverTimestamp()
  });
}

// ===================== USER MANAGEMENT =====================

export async function updateUserRole(uid, role, level) {
  await updateDoc(doc(db, 'users', uid), {
    role,
    roleLevel: level,
    updatedAt: serverTimestamp()
  });
}

export async function bulkSyncStudents() {
  const batchLimit = 500; // Firestore batch limit
  let count = 0;
  
  // Note: For 700+ users, we should ideally use multiple batches
  // But for this institutional startup, we'll do an optimized loop
  for (const student of STUDENT_MASTER_LIST) {
    const studentId = `ghost-${student.prn}`;
    const userRef = doc(db, 'users', studentId);
    
    // Check if exists
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        name: student.name,
        prn: student.prn,
        division: `Division ${student.div}`,
        role: 'Student',
        roleLevel: 1,
        isGhost: true, // Marker for pre-registered users
        engagementScore: 0,
        createdAt: serverTimestamp()
      });
      count++;
    }
  }
  return count;
}

// ===================== SYSTEM CONFIG =====================

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

// ===================== DM READ RECEIPTS =====================

export async function markDMAsRead(senderId, receiverId) {
  const dmId = [senderId, receiverId].sort().join('_');
  const q = query(
    collection(db, 'dms', dmId, 'messages'), 
    where('senderId', '==', receiverId), // Mark messages FROM the other person as read
    where('isRead', '==', false)
  );
  
  const snap = await getDocs(q);
  const batch = snap.docs.map(d => updateDoc(d.ref, { isRead: true, readAt: serverTimestamp() }));
  await Promise.all(batch);
}

// ===================== ATTENDANCE ANALYTICS =====================

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


// ===================== FILE UPLOAD =====================



export async function uploadFile(file, contextPath) {
  const storageRef = ref(storage, `${contextPath}/${Date.now()}_${file.name}`);
  const uploadTask = await uploadBytesResumable(storageRef, file);
  return await getDownloadURL(uploadTask.ref);
}

// ===================== TYPING INDICATORS =====================

export function setTypingStatus(containerId, userId, isTyping) {
  const typingRef = doc(db, 'typing', `${containerId}_${userId}`);
  if (isTyping) {
    return setDoc(typingRef, {
      containerId,
      userId,
      isTyping,
      lastUpdated: serverTimestamp()
    });
  } else {
    return deleteDoc(typingRef);
  }
}

export function onTypingStatusChange(containerId, callback) {
  const q = query(collection(db, 'typing'), where('containerId', '==', containerId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data()));
  });
}

// ===================== PLACEMENT APPLICATIONS =====================

export async function applyToDrive(driveId, userData) {
  const appRef = doc(db, 'placementDrives', driveId, 'applications', userData.uid);
  const snap = await getDoc(appRef);
  if (snap.exists()) throw new Error('You have already applied for this drive.');
  
  await setDoc(appRef, {
    ...userData,
    appliedAt: serverTimestamp(),
    status: 'Applied'
  });
}

export function onDriveApplications(driveId, callback) {
  const q = query(collection(db, 'placementDrives', driveId, 'applications'));
  return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

// ===================== USER STREAKS =====================

export async function updateUserStreak(userId) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  
  const data = snap.data();
  const now = new Date();
  const lastActive = data.lastActiveAt?.toDate() || new Date(0);
  
  // Diff in hours
  const diff = (now - lastActive) / (1000 * 60 * 60);
  
  if (diff < 24) return; // Already active today
  
  if (diff < 48) {
    // Streak continues
    await updateDoc(userRef, {
      streak: increment(1),
      lastActiveAt: serverTimestamp()
    });
  } else {
    // Streak reset
    await updateDoc(userRef, {
      streak: 1,
      lastActiveAt: serverTimestamp()
    });
  }
}

// ===================== QR ATTENDANCE =====================

export async function verifyAttendanceQR(studentId, studentName, qrString) {
  // qrString format: "ATTENDANCE_SESSION_[SUBJECTID]_[TIMESTAMP]"
  if (!qrString.startsWith('ATTENDANCE_SESSION_')) throw new Error('Invalid QR Code');
  
  const parts = qrString.split('_');
  const subject = parts[2];
  const expire = parseInt(parts[3]);
  
  if (Date.now() > expire) throw new Error('QR Code has expired (valid for 5 mins)');
  
  return await markAttendance({
    studentId,
    studentName,
    subject,
    markedBy: 'QR Scanner'
  });
}

export async function markAttendance({ studentId, studentName, subject, markedBy }) {
  return await addDoc(collection(db, 'users', studentId, 'attendance'), {
    subject,
    studentName,
    markedBy,
    status: 'Present',
    timestamp: serverTimestamp()
  });
}

export function onAttendanceChange(userId, callback) {
  const q = query(
    collection(db, 'users', userId, 'attendance'),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => {
      const ts = d.data().timestamp?.toDate();
      return { 
        id: d.id, ...d.data(), 
        dateStr: ts ? ts.toLocaleDateString() : 'Recently',
        timeStr: ts ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
      };
    }));
  });
}

// ===================== FOCUS TIMER =====================

export async function saveFocusSession(uid, minutes, userName) {
  // Add to sub-collection
  await addDoc(collection(db, 'users', uid, 'focusSessions'), {
    minutes,
    title: 'Focus Session',
    timestamp: serverTimestamp()
  });
  
  // Increment global engagement score (+3 for a focus session)
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    engagementScore: increment(3)
  });
  
  // Log it
  await createAuditLog({
    action: 'Pomodoro Completed',
    actorName: userName,
    details: `Completed a ${minutes}-minute focus session.`
  });
}

// ===================== ANALYTICS & SEARCH =====================

export async function globalSearch(searchTerm) {
  const lowSearch = searchTerm.toLowerCase();
  
  // Note: Client-side filtering for demo version, as Firestore doesn't support partial matches well
  const usersSnap = await getDocs(collection(db, 'users'));
  const resourcesSnap = await getDocs(collection(db, 'resources'));
  
  const users = usersSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u => u.name?.toLowerCase().includes(lowSearch) || u.email?.toLowerCase().includes(lowSearch));
    
  const resources = resourcesSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(r => r.title?.toLowerCase().includes(lowSearch) || r.subject?.toLowerCase().includes(lowSearch));
    
  return { users, resources, messages: [] };
}

// ===================== GRIEVANCES =====================

export async function updateGrievanceStatus(id, status, response) {
  await updateDoc(doc(db, 'grievances', id), { 
    status, 
    adminResponse: response,
    updatedAt: serverTimestamp()
  });
}

// ===================== PIN MESSAGES =====================

export async function toggleMessagePin(channelId, messageId, isPinned) {
  await updateDoc(doc(db, 'channels', channelId, 'messages', messageId), { 
    isPinned: !isPinned 
  });
}
// ===================== RESOURCES =====================

export async function incrementDownload(resId) {
  await updateDoc(doc(db, 'resources', resId), { downloads: increment(1) });
}

// ===================== Q&A =====================

export function onQuestionsChange(callback) {
  const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export function onAnswersChange(qId, callback) {
  const q = query(collection(db, 'questions', qId, 'answers'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function voteQuestion(qId, userId) {
  const qRef = doc(db, 'questions', qId);
  const snap = await getDoc(qRef);
  if (!snap.exists()) return;
  const votes = snap.data().votes || [];
  if (votes.includes(userId)) {
    await updateDoc(qRef, { votes: votes.filter(v => v !== userId) });
  } else {
    await updateDoc(qRef, { votes: [...votes, userId] });
  }
}

export async function postAnswer(qId, data) {
  await addDoc(collection(db, 'questions', qId, 'answers'), {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function resolveQuestion(qId) {
  await updateDoc(doc(db, 'questions', qId), { isResolved: true });
}

// ===================== NOTIFICATIONS =====================

export async function markNotificationAsRead(userId, notifId) {
  await updateDoc(doc(db, 'users', userId, 'notifications', notifId), { isRead: true });
}

export async function clearAllNotifications(userId) {
  const q = query(collection(db, 'users', userId, 'notifications'), where('isRead', '==', true));
  const snap = await getDocs(q);
  const batch = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(batch);
}

// ===================== TASK BOARD =====================

export async function seedInitialTasks() {
  const tasks = [
    { title: 'Finalize Cloud Viva Prep', priority: 'High', status: 'todo', category: 'Exam', assignee: 'Me' },
    { title: 'Microsoft Placement Drive', priority: 'High', status: 'todo', category: 'Placement', deadline: 'Tomorrow' },
    { title: 'Build React Dashboard for T&P', priority: 'Medium', status: 'progress', category: 'Project' },
    { title: 'Submit OS Journal', priority: 'Low', status: 'todo', category: 'Lab' },
    { title: 'Register for Hackathon 2k24', priority: 'Medium', status: 'todo', category: 'Event' },
    { title: 'Weekly Quiz - Java Collections', priority: 'High', status: 'done', category: 'Academic' },
    { title: 'Update Resume for Internship', priority: 'High', status: 'done', category: 'Career' },
    { title: 'Book Seminar Hall for Workshop', priority: 'Low', status: 'progress', category: 'Admin' },
    { title: 'Review Database ER Diagrams', priority: 'Medium', status: 'todo', category: 'Homework' },
    { title: 'Download Placement Brochure', priority: 'Low', status: 'todo', category: 'Resources' }
  ];

  for (const t of tasks) {
    await addDoc(collection(db, 'boardTasks'), {
      ...t,
      createdAt: serverTimestamp()
    });
  }
}

// ===================== AUDIT LOGS =====================

export async function createAuditLog({ action, actorName, actorEmail, details }) {
  await addDoc(collection(db, 'auditLogs'), {
    action, actorName, actorEmail, details,
    timestamp: serverTimestamp()
  });
}

export function onAuditLogChange(callback) {
  const q = query(
    collection(db, 'auditLogs'),
    orderBy('timestamp', 'desc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ 
      id: d.id, ...d.data(),
      date: d.data().timestamp?.toDate()?.toLocaleString() || 'Just now'
    })));
  });
}

// ===================== INTERVIEW FORUM =====================

export function onInterviewExperiencesChange(callback) {
  const q = query(collection(db, 'interviewExperiences'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      date: formatTimeAgo(d.data().createdAt?.toDate())
    })));
  });
}

export async function addInterviewExperience(data) {
  return await addDoc(collection(db, 'interviewExperiences'), {
    ...data,
    upvotes: 0,
    upvotedBy: [],
    createdAt: serverTimestamp()
  });
}

export async function upvoteInterviewExperience(id, userId) {
  const ref = doc(db, 'interviewExperiences', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const upvotedBy = data.upvotedBy || [];
  
  if (upvotedBy.includes(userId)) {
    await updateDoc(ref, {
      upvotes: increment(-1),
      upvotedBy: upvotedBy.filter(u => u !== userId)
    });
  } else {
    await updateDoc(ref, {
      upvotes: increment(1),
      upvotedBy: [...upvotedBy, userId]
    });
  }
}

// ===================== SYLLABUS TRACKER =====================

export function onSyllabusChange(callback) {
  const q = query(collection(db, 'syllabus'), orderBy('priority', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function updateTopicStatus(syllabusId, topicId, status) {
  const ref = doc(db, 'syllabus', syllabusId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const topics = snap.data().topics || [];
  const updated = topics.map(t => t.id === topicId ? { ...t, status } : t);
  await updateDoc(ref, { topics: updated, updatedAt: serverTimestamp() });
}

// Handled by Admin controls above

// ===================== SEEDING ENGINE =====================

export async function seedInstitutionalData() {
  const batch = writeBatch(db);

  // 1. Platform Config
  batch.set(doc(db, 'platformConfig', 'universal'), {
    maintenanceBanner: 'Welcome to the new DYPIU Collab Platform. Professional Skill Matrix is now live.',
    isMaintenanceMode: false,
    updatedAt: serverTimestamp()
  });

  // 2. Placement Stats
  batch.set(doc(db, 'placementStats', 'current'), {
    totalPlaced: '450+',
    avgPackage: '7.5 LPA',
    topPackage: '44 LPA',
    totalCompanies: '120+',
    updatedAt: serverTimestamp()
  });

  // 3. Syllabus Skeleton (DBMS & AI)
  const dbmsRef = doc(db, 'syllabus', 'dbms_sem4');
  batch.set(dbmsRef, {
    title: 'Database Management Systems',
    priority: 1,
    topics: [
      { id: 't1', name: 'Relational Model & Algebraic Queries', status: 'completed' },
      { id: 't2', name: 'Normalization (1NF, 2NF, 3NF, BCNF)', status: 'completed' },
      { id: 't3', name: 'Indexing & Transaction Management', status: 'pending' },
      { id: 't4', name: 'NoSQL & Distributed Databases', status: 'pending' }
    ],
    updatedAt: serverTimestamp()
  });

  const aiRef = doc(db, 'syllabus', 'ai_sem6');
  batch.set(aiRef, {
    title: 'Artificial Intelligence',
    priority: 2,
    topics: [
      { id: 'a1', name: 'Probability Theory & Neural Networks', status: 'completed' },
      { id: 'a2', name: 'NLP & Large Language Models', status: 'pending' }
    ],
    updatedAt: serverTimestamp()
  });

  await batch.commit();
  return true;
}
