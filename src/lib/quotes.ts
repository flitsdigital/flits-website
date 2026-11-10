/** The first sentence of a review, cut at a word with "…" when longer than `max` characters. */
export function shortQuote(paragraphs: string[], max = 90): string {
  const text = (paragraphs[0] ?? '').trim();
  // A sentence ends at . ! or ? followed by a space, but not at an ellipsis ("Ok... dit is top.")
  const sentence = text.match(/^.+?(?<!\.\.)[.!?](?=\s|$)/)?.[0] ?? text;
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/, '')}…`;
}

/** "Rik, Kaasloods28" → "Rik"; an author line without a comma is a company name and stays whole. */
export const firstName = (author: string) => author.split(',')[0].trim();
