import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';

// Safe chars: no 0/O, 1/I/l confusion
const CHARS = '23456789ABCDEFGHJKLMNPRSTUVWXYZ';

export function generateShortCode(length = 5) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function saveShortCode(code, quizKey) {
  await set(ref(db, `quizShortCodes/${code}`), quizKey);
}

export async function lookupShortCode(code) {
  const snap = await get(ref(db, `quizShortCodes/${code}`));
  return snap.val();
}

/** Generate a short code and save both on the quiz and in the lookup table */
export async function assignShortCode(quizKey) {
  const code = generateShortCode();
  await saveShortCode(code, quizKey);
  // Also patch the quiz document
  await set(ref(db, `einzelquizzes/${quizKey}/shortCode`), code);
  return code;
}
