const SENTENCE_END = /(?<=[.!?])\s+(?=[A-Z*"'])/;

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function trimToSentenceTeaser(text: string, maxSentences = 3): string {
  const plain = stripMarkdown(text);
  if (!plain) return '';

  const sentences = plain.split(SENTENCE_END).filter(Boolean);
  if (sentences.length <= maxSentences) {
    return plain;
  }

  return sentences.slice(0, maxSentences).join(' ').trim();
}

export function summarizeFaqAnswerForSchema(
  answer: string,
  pageUrl: string,
  sectionLabel = 'full answer',
): string {
  const teaser = trimToSentenceTeaser(answer, 1);
  return `${teaser} See the ${sectionLabel} on AnalyticsVS: ${pageUrl}`;
}
