const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// 9 Patterns for DLP Scanner
const DLP_PATTERNS = {
  aadhaar: /[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}/,
  phone: /(\+91[\-\s]?)?[0]?(91)?[789]\d{9}/,
  email: /[a-zA-Z0-9._%+-]+@dypiu\.ac\.in/, 
  credit_card: /\b(?:\d[ -]*?){13,16}\b/,
  pan: /[A-Z]{5}[0-9]{4}[A-Z]{1}/,
  ip_address: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  password_keyword: /password|secret|creds|api_key|token/i,
  bank_account: /\b\d{9,18}\b/,
  dob: /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/
};

/**
 * Trigger: On Message Created (Channel)
 * Action: Scan for sensitive data and flag if found
 */
exports.scanChannelMessage = functions.firestore
  .document('channels/{channelId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const text = data.text || '';
    
    let flaggedPatterns = [];
    for (const [name, pattern] of Object.entries(DLP_PATTERNS)) {
      if (pattern.test(text)) {
        flaggedPatterns.push(name);
      }
    }

    if (flaggedPatterns.length > 0) {
      await snap.ref.update({
        dlpFlagged: true,
        flaggedPatterns
      });

      await db.collection('auditLog').add({
        action: 'DLP_FLAGGED',
        actorId: 'system',
        actorName: 'DLP Sentinel',
        targetId: context.params.messageId,
        targetType: 'message',
        metadata: {
          channelId: context.params.channelId,
          flaggedPatterns,
          senderId: data.senderId
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Trigger: On DM Created
 * Action: Scan for sensitive data
 */
exports.scanDirectMessage = functions.firestore
  .document('dms/{dmId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const text = data.text || '';
    
    let flaggedPatterns = [];
    for (const [name, pattern] of Object.entries(DLP_PATTERNS)) {
      if (pattern.test(text)) {
        flaggedPatterns.push(name);
      }
    }

    if (flaggedPatterns.length > 0) {
      await snap.ref.update({
        dlpFlagged: true,
        flaggedPatterns
      });
    }
  });

/**
 * Trigger: On User Document Created
 * Action: Set custom claims for RBAC (L1-L4)
 */
exports.processUserRole = functions.firestore
  .document('users/{uid}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const uid = context.params.uid;
    const role = data.role || 'Student';

    try {
      await admin.auth().setCustomUserClaims(uid, { role });
      await snap.ref.update({
        claimsSynced: true,
        claimsSyncedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting custom claims:', error);
    }
  });

/**
 * Trigger: On User Document Updated
 * Action: Sync role changes to custom claims
 */
exports.syncUserRoleUpdate = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const uid = context.params.uid;

    if (newData.role !== oldData.role) {
      try {
        await admin.auth().setCustomUserClaims(uid, { role: newData.role });
        await change.after.ref.update({
          claimsSyncedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating custom claims:', error);
      }
    }
  });

/**
 * Trigger: On Grievance Created
 * Action: Set SLA Deadline (72 Hours)
 */
exports.processGrievanceSLA = functions.firestore
  .document('grievances/{ticketId}')
  .onCreate(async (snap, context) => {
    const createdAt = snap.createTime.toDate();
    const slaDeadline = new Date(createdAt.getTime() + (72 * 60 * 60 * 1000)); // +72 Hours
    
    await snap.ref.update({
      slaDeadline: admin.firestore.Timestamp.fromDate(slaDeadline),
      status: 'Open',
      assignedTo: null // To be assigned by Admin
    });
  });

/**
 * Trigger: On Task Created/Updated
 * Action: Notify assigned user
 */
exports.processTaskAssignment = functions.firestore
  .document('boardTasks/{taskId}')
  .onWrite(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before ? change.before.data() : null;

    if (newData && newData.assignedTo && (!oldData || oldData.assignedTo !== newData.assignedTo)) {
      const userId = newData.assignedTo;
      
      await db.collection('users').doc(userId).collection('notifications').add({
        title: 'New Task Assigned',
        body: `You have been assigned to: ${newData.title}`,
        type: 'TASK_ASSIGNMENT',
        metadata: { taskId: context.params.taskId },
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Trigger: On Q&A Answer Created
 * Action: Scan for sensitive data (DLP)
 */
exports.scanQuestionAnswer = functions.firestore
  .document('questions/{questionId}/answers/{answerId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const text = data.text || '';
    
    let flaggedPatterns = [];
    for (const [name, pattern] of Object.entries(DLP_PATTERNS)) {
      if (pattern.test(text)) {
        flaggedPatterns.push(name);
      }
    }

    if (flaggedPatterns.length > 0) {
      await snap.ref.update({
        dlpFlagged: true,
        flaggedPatterns
      });
    }
  });

/**
 * Trigger: On Grievance Created
 * Action: Anonymize if requested
 */
exports.anonymizeGrievance = functions.firestore
  .document('grievances/{ticketId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    if (data.isAnonymous === true) {
      const authorId = data.authorId;
      
      // Move authorId to a hidden metadata dock
      await snap.ref.collection('private_metadata').doc('identity').set({
        originalAuthorId: authorId,
        anonymizedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Scrub the main doc
      await snap.ref.update({
        authorId: "ANONYMOUS_USER",
        authorName: "Anonymous Student"
      });
    }
  });

/**
 * Trigger: On Quiz Submission Created
 * Action: Auto-grade and update user score
 */
exports.processQuizSubmission = functions.firestore
  .document('quizzes/{quizId}/submissions/{subId}')
  .onCreate(async (snap, context) => {
    const submission = snap.data();
    const quizId = context.params.quizId;
    
    // 1. Get the Quiz Key (correct answers)
    const quizSnap = await db.collection('quizzes').doc(quizId).get();
    if (!quizSnap.exists()) return;
    const quizData = quizSnap.data();
    const correctAnswers = quizData.questions || []; // Array of { id, correctOption }

    // 2. Calculate Score
    let score = 0;
    const studentAnswers = submission.answers || {}; // { questionId: selectedOption }
    
    correctAnswers.forEach(q => {
      if (studentAnswers[q.id] === q.correctOption) {
        score += (q.points || 10);
      }
    });

    const totalPossible = correctAnswers.reduce((acc, q) => acc + (q.points || 10), 0);
    const percentage = ((score / totalPossible) * 100).toFixed(1);

    // 3. Update Submission with result
    await snap.ref.update({
      score,
      totalPossible,
      percentage,
      gradedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 4. Update User's Overall Standing
    const userRef = db.collection('users').doc(submission.userId);
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) return;
      
      const newTotalScore = (userDoc.data().engagementScore || 0) + score;
      transaction.update(userRef, { 
        engagementScore: newTotalScore,
        lastQuizAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 5. Update Leaderboard Entry
      const lbRef = db.collection('leaderboard').doc(submission.userId);
      transaction.set(lbRef, {
        name: userDoc.data().name,
        score: newTotalScore,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        avatar: userDoc.data().avatar || ''
      }, { merge: true });
    });
  });

/**
 * Trigger: Every Sunday at 8 PM (Task 10)
 * Action: Aggregate upcoming activity and notify students
 */
exports.weeklyDigestSchedule = functions.pubsub
  .schedule('0 20 * * 0') // Sunday 20:00 (8 PM)
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    // 1. Fetch upcoming Quizzes
    const quizSnap = await db.collection('quizzes')
      .where('active', '==', true)
      .limit(5)
      .get();
    
    // 2. Fetch upcoming Placement Drives
    const driveSnap = await db.collection('placementDrives')
      .where('status', '==', 'Open')
      .limit(5)
      .get();

    const quizTitles = quizSnap.docs.map(d => d.data().title).join(', ');
    const driveCompanies = driveSnap.docs.map(d => d.data().company).join(', ');

    const body = `Week Ahead: ${quizSnap.size} Quizzes (${quizTitles}) and ${driveSnap.size} Placement Drives (${driveCompanies}) are active!`;

    // 3. Notify all Active Users
    const usersSnap = await db.collection('users')
      .where('isGhost', '==', false)
      .get();

    const batch = db.batch();
    usersSnap.forEach(userDoc => {
      const notifRef = userDoc.ref.collection('notifications').doc();
      batch.set(notifRef, {
        title: 'Your Weekly Institutional Digest',
        body,
        type: 'WEEKLY_DIGEST',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`Weekly Digest sent to ${usersSnap.size} users.`);
    return null;
  });
