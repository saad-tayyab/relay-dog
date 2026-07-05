/**
 * Lightweight JSON syntax highlighter.
 * Returns an HTML string — use with Svelte's `{@html}` directive.
 *
 * Token classes:
 *   .json-key      — object keys
 *   .json-string   — string values
 *   .json-number   — numeric values
 *   .json-keyword  — true / false / null
 *   .json-punct    — brackets, braces, colons, commas
 */

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function jsonHighlight(json: string): string {
  const escaped = escapeHtml(json);

  return escaped.replace(
    /"([^"\\]|\\.)*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[{}[\],:]/g,
    (match) => {
      // Object key (string followed by colon)
      if (/^".*":\s*$/.test(match)) {
        const key = match.slice(0, -1); // remove trailing colon
        return `<span class="json-key">${key}</span><span class="json-punct">:</span>`;
      }
      // String value
      if (match.startsWith('"')) {
        return `<span class="json-string">${match}</span>`;
      }
      // Boolean or null
      if (match === 'true' || match === 'false' || match === 'null') {
        return `<span class="json-keyword">${match}</span>`;
      }
      // Number
      if (/^-?\d/.test(match)) {
        return `<span class="json-number">${match}</span>`;
      }
      // Punctuation
      return `<span class="json-punct">${match}</span>`;
    },
  );
}
