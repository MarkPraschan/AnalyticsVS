export function slugifyHeading(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="review-inline-code">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

export function renderReviewMarkdown(source: string | undefined | null): string {
  if (!source?.trim()) return '';

  return source
    .trim()
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.split('\n').filter(Boolean);
      if (lines.length > 0 && lines.every((line) => /^-\s/.test(line))) {
        const items = lines
          .map((line) => `<li>${inlineMarkdown(line.replace(/^-\s/, ''))}</li>`)
          .join('');
        return `<ul class="review-list">${items}</ul>`;
      }
      if (lines.length > 0 && lines.every((line) => /^\d+\.\s/.test(line))) {
        const items = lines
          .map((line) => `<li>${inlineMarkdown(line.replace(/^\d+\.\s/, ''))}</li>`)
          .join('');
        return `<ol class="review-list">${items}</ol>`;
      }
      return `<p>${inlineMarkdown(block.replace(/\n/g, ' '))}</p>`;
    })
    .join('\n');
}

export function renderSimpleMarkdown(source: string | undefined | null): string {
  if (!source?.trim()) return '';

  return source
    .trim()
    .split(/\n\n+/)
    .map((paragraph) => {
      const html = paragraph.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return `<p>${html}</p>`;
    })
    .join('\n');
}
