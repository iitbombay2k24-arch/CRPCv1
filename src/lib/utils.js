// ============================================
// DYPIU Collab — Utility Functions
// ============================================

export function formatTimeAgo(date) {
  if (!date) return 'just now';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0, size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// PRD Phase 1: DLP scanner with 9 patterns
export const DLP_PATTERNS = [
  { regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, name: 'Credit Card Number', severity: 'block' },
  { regex: /\b\d{12}\b/, name: 'Aadhaar Number', severity: 'block' },
  { regex: /\b[A-Z]{5}\d{4}[A-Z]\b/, name: 'PAN Card Number', severity: 'block' },
  { regex: /[a-zA-Z0-9._-]+@[a-z]+/, name: 'UPI ID', severity: 'block' },
  { regex: /(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}\b/, name: 'Mobile Number', severity: 'warn' },
  { regex: /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.(com|in|org|net|edu)\b/, name: 'Email Address', severity: 'warn' },
  { regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/, name: 'IFSC Code', severity: 'warn' },
  { regex: /\b[A-Z]\d{7}\b/, name: 'Passport Number', severity: 'warn' },
  { regex: /\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d\b/, name: 'GSTIN', severity: 'warn' },
];

export function scanDLP(text) {
  return DLP_PATTERNS.filter(p => p.regex.test(text)).map(p => ({ name: p.name, severity: p.severity }));
}

export const EMOJI_LIST = ['😀','😂','😍','🔥','👍','👎','❤️','🎉','💯','🤔','👀','✅','🚀','⭐','💡','📌','🙌','😎','🤝','💪'];
