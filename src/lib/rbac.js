// ============================================
// DYPIU Collab — Role-Based Access Control (RBAC)
// PRD: 4-Layer Roles L1-L4
// ============================================

export const ROLES = {
  STUDENT: 'Student',     // L1
  FACULTY: 'Faculty',     // L2
  ADMIN: 'Admin',         // L3
  SUPERADMIN: 'SuperAdmin' // L4
};

export const ROLE_LEVEL = {
  [ROLES.STUDENT]: 1,
  [ROLES.FACULTY]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.SUPERADMIN]: 4
};

export const PERMISSIONS = {
  // L1 — Student
  VIEW_CHAT: { minLevel: 1 },
  SEND_MESSAGE: { minLevel: 1 },
  VIEW_ANNOUNCEMENTS: { minLevel: 1 },
  VIEW_ATTENDANCE: { minLevel: 1 },
  VIEW_TIMETABLE: { minLevel: 1 },
  VIEW_RESOURCES: { minLevel: 1 },
  VIEW_QA: { minLevel: 1 },
  VIEW_LEADERBOARD: { minLevel: 1 },
  VIEW_BOARD: { minLevel: 1 },
  VIEW_TASKS: { minLevel: 1 },
  VIEW_BOOKMARKS: { minLevel: 1 },
  VIEW_POMODORO: { minLevel: 1 },
  REACT_MESSAGE: { minLevel: 1 },
  BOOKMARK_MESSAGE: { minLevel: 1 },
  SUBMIT_GRIEVANCE: { minLevel: 1 },
  // L2 — Faculty
  PIN_MESSAGE: { minLevel: 2 },
  DELETE_ANY_MESSAGE: { minLevel: 2 },
  CREATE_CHANNEL: { minLevel: 2 },
  POST_ANNOUNCEMENT: { minLevel: 2 },
  VIEW_GRIEVANCES: { minLevel: 2 },
  UPLOAD_RESOURCES: { minLevel: 2 },
  GRADE_ASSIGNMENTS: { minLevel: 2 },
  AT_EVERYONE: { minLevel: 2 },
  MARK_ATTENDANCE: { minLevel: 2 },
  CREATE_TIMETABLE: { minLevel: 2 },
  // L3 — Admin / HOD
  MANAGE_MEMBERS: { minLevel: 3 },
  VIEW_AUDIT_LOG: { minLevel: 3 },
  VIEW_ADMIN: { minLevel: 3 },
  MANAGE_ROLES: { minLevel: 3 },
  MUTE_USER: { minLevel: 3 },
  WARN_USER: { minLevel: 3 },
  RESTRICT_DM: { minLevel: 3 },
  EXPORT_DATA: { minLevel: 3 },
  VIEW_MODERATION: { minLevel: 3 },
  CREATE_RECRUITER: { minLevel: 3 },
  // L4 — Super Admin
  BAN_USER: { minLevel: 4 },
  SUSPEND_USER: { minLevel: 4 },
  LOCK_CHANNEL: { minLevel: 4 },
  LOCK_DM: { minLevel: 4 },
  DELETE_CHANNEL: { minLevel: 4 },
  PURGE_MESSAGES: { minLevel: 4 },
  SYSTEM_SETTINGS: { minLevel: 4 },
  VIEW_SYSTEM_LOGS: { minLevel: 4 },
  OVERRIDE_ALL: { minLevel: 4 },
};

export function hasPermission(role, permission) {
  const level = ROLE_LEVEL[role] || 1;
  return level >= (PERMISSIONS[permission]?.minLevel || 99);
}

export function getRoleBadge(role) {
  switch (role) {
    case ROLES.SUPERADMIN:
      return { label: 'Super Admin', color: 'bg-purple-600', level: 4 };
    case ROLES.ADMIN:
      return { label: 'Admin / HOD', color: 'bg-rose-500', level: 3 };
    case ROLES.FACULTY:
      return { label: 'Faculty', color: 'bg-amber-500', level: 2 };
    default:
      return { label: 'Student', color: 'bg-indigo-500', level: 1 };
  }
}

export function isValidDomain(email) {
  return email?.endsWith('@dypiu.ac.in') || email?.endsWith('@dypiuinternational.ac.in');
}
