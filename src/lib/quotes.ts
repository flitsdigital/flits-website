/** The first sentence of a review, cut at a word with "…" when longer than `max` characters. */
export function shortQuote(paragraphs: string[], max = 90): string {
  const text = (paragraphs[0] ?? '').trim();
  const sentence = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:]+$/, '')}…`;
}

/** "Rik, Kaasloods28" → "Rik"; an author line without a comma is a company name and stays whole. */
export const firstName = (author: string) => author.split(',')[0].trim();
