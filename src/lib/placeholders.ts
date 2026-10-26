/** First `[placeholder]` left in any string inside a value, or null. Markdown links `[text](url)` don't count. */
export function findPlaceholder(value: unknown): string | null {
  if (typeof value === 'string') return value.match(/\[[^\]\n]*\](?!\()/)?.[0] ?? null;
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) {
      const found = findPlaceholder(v);
      if (found) return found;
    }
  }
  return null;
}
