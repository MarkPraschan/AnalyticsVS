import { statSync } from 'node:fs';

type ContentEntry = { filePath?: string };

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getContentUpdatedDate(filePath?: string): string {
  if (!filePath) {
    return toDateString(new Date());
  }

  return toDateString(statSync(filePath).mtime);
}

export function getEntryUpdatedDate(entry: ContentEntry): string {
  return getContentUpdatedDate(entry.filePath);
}

export function getLatestContentUpdatedDate(filePaths: (string | undefined)[]): string {
  const mtimes = filePaths
    .filter((filePath): filePath is string => Boolean(filePath))
    .map((filePath) => statSync(filePath).mtime.getTime());

  if (mtimes.length === 0) {
    return toDateString(new Date());
  }

  return toDateString(new Date(Math.max(...mtimes)));
}

export function getToolPageUpdatedDate(
  tool: ContentEntry,
  reviewEntry?: ContentEntry,
): string {
  return getLatestContentUpdatedDate([tool.filePath, reviewEntry?.filePath]);
}

export function getComparisonPageUpdatedDate(
  comparison: ContentEntry,
  toolEntries: ContentEntry[],
  reviewEntries: ContentEntry[],
): string {
  return getLatestContentUpdatedDate([
    comparison.filePath,
    ...toolEntries.map((entry) => entry.filePath),
    ...reviewEntries.map((entry) => entry.filePath),
  ]);
}
