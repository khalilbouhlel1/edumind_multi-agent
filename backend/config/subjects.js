/** Subject keys stored on User and in JWT — must match frontend. */
export const SUBJECT_IDS = [
  "mathematics",
  "computer_science",
  "physics",
  "biology",
  "chemistry",
  "history",
  "literature",
  "economics",
];

export const SUBJECT_SET = new Set(SUBJECT_IDS);

/** Nice label for prompts (not enum key). */
export function subjectPromptLabel(subject) {
  const map = {
    mathematics: "Mathematics",
    computer_science: "Computer Science",
    physics: "Physics",
    biology: "Biology",
    chemistry: "Chemistry",
    history: "History",
    literature: "Literature",
    economics: "Economics",
  };
  return map[subject] || String(subject || "your field").replace(/_/g, " ");
}
