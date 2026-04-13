// ============================================
// Firebase Firestore Service
// Handles: Channels, Messages, DMs, Resources, etc.
// ============================================

import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, increment, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { formatTimeAgo } from '../lib/utils';

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

// ===================== MESSAGES =====================

export async function sendMessage({ channelId, text, senderId, senderName, senderEmail, senderRole, type, receiverId, parentId, hasFile, fileName, fileSize, fileUrl, files }) {
  const msgData = {
    text,
    senderId,
    senderName,
    senderEmail,
    senderRole: senderRole || 'Student',
    type: type || 'channel',
    parentId: parentId || null,
    reactions: {},
    isPinned: false,
    isDeleted: false,
    dlpFlagged: false,
    attachments: files || [],
    createdAt: serverTimestamp()
  };

  if (hasFile) {
    msgData.hasFile = true;
    msgData.fileName = fileName;
    msgData.fileSize = fileSize;
    msgData.fileUrl = fileUrl;
  }

  if (type === 'dm') {
    msgData.receiverId = receiverId;
    const dmId = [senderId, receiverId].sort().join('_');
    const docRef = await addDoc(collection(db, 'dms', dmId, 'messages'), msgData);
    if (parentId) {
      await updateDoc(doc(db, 'dms', dmId, 'messages', parentId), { replyCount: increment(1) });
    }
    return docRef;
  } else {
    msgData.channelId = channelId;
    const docRef = await addDoc(collection(db, 'channels', channelId, 'messages'), msgData);
    if (parentId) {
      await updateDoc(doc(db, 'channels', channelId, 'messages', parentId), { replyCount: increment(1) });
    }
    return docRef;
  }
}

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

export function onDMMessages(userId1, userId2, callback) {
  const dmId = [userId1, userId2].sort().join('_');
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

export function onThreadMessages(channelId, parentId, callback, isDM = false) {
  const coll = isDM ? 'dms' : 'channels';
  const q = query(
    collection(db, coll, channelId, 'messages'),
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

// ===================== ATTENDANCE =====================

export async function markAttendance({ studentId, studentName, subject, markedBy }) {
  return await addDoc(collection(db, 'attendance'), {
    studentId, studentName, subject, status: 'Present',
    markedBy: markedBy || 'self', date: serverTimestamp()
  });
}

export function onAttendanceChange(studentId, callback) {
  const q = query(collection(db, 'attendance'), where('studentId', '==', studentId), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      dateStr: d.data().date?.toDate()?.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: d.data().date?.toDate()?.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })
    })));
  });
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

export async function updateGrievanceStatus(id, status) {
  const updates = { status };
  if (status === 'Resolved') updates.resolvedAt = serverTimestamp();
  await updateDoc(doc(db, 'grievances', id), updates);
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

export async function incrementDownload(id) {
  await updateDoc(doc(db, 'resources', id), { downloadCount: increment(1) });
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

export async function voteQuestion(questionId, userId) {
  const qRef = doc(db, 'questions', questionId);
  const snap = await getDoc(qRef);
  if (snap.exists()) {
    const upvotes = snap.data().upvotes || [];
    const newUpvotes = upvotes.includes(userId) ? upvotes.filter(u => u !== userId) : [...upvotes, userId];
    await updateDoc(qRef, { upvotes: newUpvotes });
  }
}

export async function postAnswer(questionId, { text, authorId, authorName }) {
  await addDoc(collection(db, 'questions', questionId, 'answers'), {
    text, authorId, authorName, upvotes: [],
    isAccepted: false, createdAt: serverTimestamp()
  });
  await updateDoc(doc(db, 'questions', questionId), { answerCount: increment(1) });
}

export async function resolveQuestion(questionId) {
  await updateDoc(doc(db, 'questions', questionId), { isResolved: true });
}

export function onQuestionsChange(callback) {
  const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      time: formatTimeAgo(d.data().createdAt?.toDate())
    })));
  });
}

export function onAnswersChange(questionId, callback) {
  if (!questionId) return () => {};
  const q = query(collection(db, 'questions', questionId, 'answers'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      time: formatTimeAgo(d.data().createdAt?.toDate())
    })));
  });
}

// ===================== AUDIT LOG =====================

export async function logAuditEvent({ action, actorId, actorName, targetId, targetType, metadata }) {
  return await addDoc(collection(db, 'auditLog'), {
    action, actorId, actorName,
    targetId: targetId || '', targetType: targetType || '',
    metadata: metadata || {}, timestamp: serverTimestamp()
  });
}

export function onAuditLogChange(callback) {
  const q = query(collection(db, 'auditLog'), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({
      id: d.id, ...d.data(),
      time: formatTimeAgo(d.data().timestamp?.toDate())
    })));
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

// ===================== FILE UPLOAD =====================

export async function uploadFile(file, contextPath) {
  const storageRef = ref(storage, `${contextPath}/${Date.now()}_${file.name}`);
  const uploadTask = await uploadBytesResumable(storageRef, file);
  return await getDownloadURL(uploadTask.ref);
}
