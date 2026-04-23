/** Must match backend SUBJECT_IDS / User enum. */
export const STUDY_SUBJECTS = [
  { id: 'mathematics', emoji: '📐', label: 'Mathematics' },
  { id: 'computer_science', emoji: '💻', label: 'Computer Science' },
  { id: 'physics', emoji: '⚛️', label: 'Physics' },
  { id: 'biology', emoji: '🧬', label: 'Biology' },
  { id: 'chemistry', emoji: '🧪', label: 'Chemistry' },
  { id: 'history', emoji: '📜', label: 'History' },
  { id: 'literature', emoji: '📚', label: 'Literature' },
  { id: 'economics', emoji: '📊', label: 'Economics' },
];

const SUBJECT_ID_SET = new Set(STUDY_SUBJECTS.map((s) => s.id));

export const subjectLabel = (subjectId) => {
  const found = STUDY_SUBJECTS.find((s) => s.id === subjectId);
  return found ? found.label : null;
};

export const subjectBadgeText = (subjectId) => {
  const found = STUDY_SUBJECTS.find((s) => s.id === subjectId);
  if (!found) return null;
  return `${found.emoji} ${found.label}`;
};

export const isValidSubjectId = (id) => SUBJECT_ID_SET.has(String(id || ''));
