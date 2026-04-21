import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '../lib/firebase';

const storage = getStorage(app);

/**
 * Uploads a file to Firebase Storage
 * @param {File} file - The file object to upload
 * @param {string} path - The storage path (e.g., 'chat/general' or 'resources/pdfs')
 * @returns {Promise<string>} - The public download URL
 */
export async function uploadMedia(file, path) {
  if (!file) return null;
  
  const fileExtension = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const storageRef = ref(storage, `${path}/${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

/**
 * Validates file type and size before upload
 * @param {File} file 
 * @returns {boolean}
 */
export function validateInstitutionalMedia(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB limit for university portal
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('UNSUPPORTED_TYPE: Only images and documents (PDF/DOC) are allowed.');
  }
  
  if (file.size > maxSize) {
    throw new Error('FILE_TOO_LARGE: Maximum file size is 10MB.');
  }
  
  return true;
}
