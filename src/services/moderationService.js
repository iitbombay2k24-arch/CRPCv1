// ============================================
// DYPIU Collab — Moderation Service
// Handles: Profanity filtering & DLP (Data Loss Prevention)
// ============================================

const PROFANITY_LIST = [
  'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'dick', 'pussy',
  'motherfucker', 'whore', 'slut', 'bastard', 'faggot', 'nigger',
  // Add more localized or common cuss words as needed
];

const DLP_PATTERNS = [
  { 
    name: 'Credit Card / ATM Card', 
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, 
    severity: 'block',
    message: 'Sharing credit/debit card numbers is strictly prohibited for your security.'
  },
  { 
    name: 'Aadhaar Number', 
    regex: /\b\d{12}\b/, 
    severity: 'block',
    message: 'Sharing Aadhaar numbers is restricted for privacy reasons.'
  },
  { 
    name: 'PAN Card', 
    regex: /\b[A-Z]{5}\d{4}[A-Z]\b/, 
    severity: 'warn',
    message: 'Sharing PAN details is discouraged.'
  },
  { 
    name: 'Mobile Number', 
    regex: /(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}\b/, 
    severity: 'warn',
    message: 'Sharing personal mobile numbers in public channels is discouraged.'
  }
];

/**
 * Scans text for profanity and replaces it with asterisks
 */
export function filterProfanity(text) {
  let filteredText = text;
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  return filteredText;
}

/**
 * Scans text for sensitive data (DLP)
 * Returns { isBlocked: boolean, reason: string | null }
 */
export function scanForSensitiveData(text) {
  for (const pattern of DLP_PATTERNS) {
    if (pattern.regex.test(text)) {
      if (pattern.severity === 'block') {
        return { isBlocked: true, reason: pattern.message, name: pattern.name };
      }
    }
  }
  return { isBlocked: false, reason: null };
}

/**
 * Main moderation hook to be used before sending any message
 * Returns { cleanText: string, isBlocked: boolean, reason: string | null }
 */
export function moderateMessage(text) {
  // 1. Check for sensitive data first (blocking takes priority)
  const dlpResult = scanForSensitiveData(text);
  if (dlpResult.isBlocked) {
    return { cleanText: text, isBlocked: true, reason: dlpResult.reason };
  }

  // 2. Filter profanity
  const cleanText = filterProfanity(text);

  return { cleanText, isBlocked: false, reason: null };
}
