// ============================================
// Firebase Firestore Service
// Handles: Channels, Messages, DMs, Resources, etc.
// ============================================

import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, increment, serverTimestamp,
  arrayUnion, arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { formatTimeAgo } from '../lib/utils';
import { ROLE_LEVEL } from '../lib/rbac';

// ===================== CHAT SERVICES =====================

export function onChannelsChange(user, callback) {
  // Real-time listener for channels
  // SuperAdmin sees all. Others see Global + their School.
  const q = query(collection(db, 'channels'), orderBy('name', 'asc'));
  
  return onSnapshot(q, (snap) => {
    const allChannels = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Filter based on user profile
    const filtered = allChannels.filter(ch => {
      if (user?.role === 'SuperAdmin' || user?.roleLevel >= 4) return true;
      if (ch.visibility === 'Global') return true;
      
      // Default to School filtering
      return ch.school === (user?.school || 'School of Engineering');
    });

    callback(filtered);
  });
}

export async function createChannel(data) {
  return await addDoc(collection(db, 'channels'), {
    ...data,
    createdAt: serverTimestamp()
  });
}

export function onChannelMessages(channelId, callback) {
  const q = query(collection(db, 'channels', channelId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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

export function onDMMessages(dmId, callback) {
  const q = query(collection(db, 'dms', dmId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
export function onActiveDMs(userId, callback) {
  const q = query(collection(db, 'dms'), where('participants', 'array-contains', userId));
  return onSnapshot(q, async (snap) => {
    const dmList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(dmList);
  });
}

export async function searchUsers(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return [];
  const q = query(
    collection(db, 'users'),
    where('name', '>=', searchTerm),
    where('name', '<=', searchTerm + '\uf8ff'),
    limit(5)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// ===================== FRIENDS SYSTEM =====================

export async function addFriend(userId, friendId) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    friends: arrayUnion(friendId)
  });
}

export async function removeFriend(userId, friendId) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    friends: arrayRemove(friendId)
  });
}

export function onFriendsChange(userId, callback) {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, async (snap) => {
    if (!snap.exists()) return callback([]);
    const friendIds = snap.data().friends || [];
    if (friendIds.length === 0) return callback([]);
    
    // Fetch friend data
    const friendsData = await Promise.all(
      friendIds.map(async (fid) => {
        const fDoc = await getDoc(doc(db, 'users', fid));
        return fDoc.exists() ? { uid: fDoc.id, ...fDoc.data() } : null;
      })
    );
    callback(friendsData.filter(Boolean));
  });
}
export async function logModerationEvent(data) {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      ...data,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging moderation event:', error);
  }
}

export async function sendMessage({ channelId, text, senderId, senderName, senderEmail, senderRole, type, parentId, files, participants }) {
  let collPath;
  if (type === 'dm') {
    const dmId = channelId; // For DMs, channelId is the combinedId
    collPath = `dms/${dmId}/messages`;
    // Ensure parent DM doc exists with participants array (required by Firestore rules)
    if (participants && participants.length === 2) {
      await setDoc(doc(db, 'dms', dmId), { participants }, { merge: true });
    }
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
  const q = query(
    collection(db, 'boardTasks'), 
    where('year', '==', contextData.year || 'General'),
    orderBy('createdAt', 'desc')
  );
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

export async function submitQuizResult({ quizId, studentId, studentName, score, total }) {
  return await addDoc(collection(db, 'quizzes', quizId, 'results'), {
    studentId, studentName, score, total, submittedAt: serverTimestamp()
  });
  return docRef.id;
}

export function onQuizSubmissions(quizId, callback) {
  // Reads from 'results' to match submitQuizResult which writes to 'results'
  const q = query(collection(db, 'quizzes', quizId, 'results'), orderBy('score', 'desc'));
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
    callback(snap.docs.map(d => ({ 
      id: d.id, ...d.data(), 
      date: d.data().timestamp?.toDate()?.toLocaleDateString() || 'Recently' 
    })));
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



// (Duplicated Board Task functions removed)

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

// ===================== INTERVIEW EXPERIENCES =====================


export async function postInterviewExperience({ company, role, fullText, tags, authorId, authorName }) {
  return await addDoc(collection(db, 'interviewExperiences'), {
    company,
    role,
    fullText,
    tags: tags || [],
    authorId,
    authorName,
    upvotes: [],
    createdAt: serverTimestamp()
  });
}

export async function voteInterviewExperience(expId, userId) {
  const ref = doc(db, 'interviewExperiences', expId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const upvotes = snap.data().upvotes || [];
  await updateDoc(ref, {
    upvotes: upvotes.includes(userId)
      ? upvotes.filter(u => u !== userId)
      : [...upvotes, userId]
  });
}

export async function deleteInterviewExperience(expId) {
  await deleteDoc(doc(db, 'interviewExperiences', expId));
}

// ===================== STUDY ROOMS =====================

export function onStudyRoomMessages(roomId, callback) {
  const q = query(
    collection(db, 'studyRooms', roomId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function sendStudyRoomMessage(roomId, { text, senderId, senderName }) {
  return await addDoc(collection(db, 'studyRooms', roomId, 'messages'), {
    text,
    senderId,
    senderName,
    createdAt: serverTimestamp()
  });
}

export async function joinStudyRoom(roomId, userId, userName) {
  await setDoc(doc(db, 'studyRooms', roomId, 'presence', userId), {
    userName,
    joinedAt: serverTimestamp()
  });
}

export async function leaveStudyRoom(roomId, userId) {
  try {
    await deleteDoc(doc(db, 'studyRooms', roomId, 'presence', userId));
  } catch (_) { /* ignore if already gone */ }
}

export function onStudyRoomPresence(roomId, callback) {
  return onSnapshot(collection(db, 'studyRooms', roomId, 'presence'), (snap) => {
    callback(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
  });
}

// ===================== FOCUS SESSIONS =====================

export async function saveFocusSession(userId, { durationMinutes, mode }) {
  await addDoc(collection(db, 'users', userId, 'focusSessions'), {
    durationMinutes,
    mode,
    completedAt: serverTimestamp()
  });
  // Each completed focus session earns 5 engagement points
  await updateDoc(doc(db, 'users', userId), { engagementScore: increment(5) });
}

export async function getFocusSessionCount(userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'focusSessions'));
  return snap.size;
}

// ===================== USER ROLE MANAGEMENT (Admin) =====================

export async function updateUserRole(targetUid, newRole) {
  const roleLevel = ROLE_LEVEL[newRole] || 1;
  await updateDoc(doc(db, 'users', targetUid), { role: newRole, roleLevel });
}

// ===================== FILE UPLOAD (Firebase Storage) =====================

export async function uploadFile(file, contextPath) {
  const storageRef = ref(storage, `${contextPath}/${Date.now()}_${file.name}`);
  const uploadTask = await uploadBytesResumable(storageRef, file);
  return await getDownloadURL(uploadTask.ref);
}

// ===================== NOTIFICATIONS =====================

export function onNotificationsChange(userId, callback) {
  if (!userId) return () => {};
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ===================== INTERVIEW EXPERIENCES =====================

export function onInterviewExperiencesChange(callback) {
  const q = query(collection(db, 'interviewExperiences'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      date: formatTimeAgo(d.data().createdAt?.toDate())
    })));
  });
}

// ===================== PLACEMENT DRIVES (Admin) =====================

export async function createPlacementDrive(data) {
  return await addDoc(collection(db, 'placementDrives'), {
    ...data,
    applicants: 0,
    createdAt: serverTimestamp()
  });
}

// ===================== SYLLABUS =====================

export async function createSyllabusSubject(data) {
  return await addDoc(collection(db, 'syllabus'), {
    ...data,
    createdAt: serverTimestamp()
  });
}

// ===================== COURSE ARCHIVE =====================

export async function createCourseArchive(data) {
  return await addDoc(collection(db, 'courseArchive'), {
    ...data,
    createdAt: serverTimestamp()
  });
}
