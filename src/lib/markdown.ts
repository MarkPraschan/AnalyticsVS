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

function isMarkdownTable(lines: string[]): boolean {
  return lines.length >= 2 && lines.every((line) => line.trim().startsWith('|'));
}

function isTableSeparator(line: string): boolean {
  return /^\|?\s*:?-{3,}/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function renderMarkdownTable(lines: string[]): string {
  const rows = lines.filter((line) => !isTableSeparator(line)).map(parseTableRow);
  const [header, ...body] = rows;
  if (!header) return '';

  const head = `<thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead>`;
  const tableBody = `<tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody>`;

  return `<div class="overflow-x-auto"><table>${head}${tableBody}</table></div>`;
}

export function renderReviewMarkdown(source: string | undefined | null): string {
  if (!source?.trim()) return '';

  return source
    .trim()
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.split('\n').filter(Boolean);
      if (lines.length > 0 && lines[0].startsWith('### ')) {
        const heading = `<h3>${inlineMarkdown(lines[0].replace(/^###\s+/, ''))}</h3>`;
        const rest = lines.slice(1).join(' ');
        return rest ? `${heading}<p>${inlineMarkdown(rest)}</p>` : heading;
      }
      if (isMarkdownTable(lines)) return renderMarkdownTable(lines);
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
