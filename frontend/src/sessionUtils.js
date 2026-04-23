export const extractTopicLabel = (value) => {
  if (!value) return 'No recent topic';
  const cleaned = value
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ');
  return cleaned || 'No recent topic';
};

export const previewText = (text, max = 140) => {
  const s = String(text || '').trim();
  if (!s) return '';
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
};

export const sessionId = (s) => String(s?._id ?? s?.id ?? '');
