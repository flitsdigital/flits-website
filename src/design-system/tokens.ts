export interface Token {
  name: string;
  value: string;
}

export interface TokenGroup {
  group: string;
  tokens: Token[];
}

/** Reads `/* @group X *\/` sections and `--name: value;` lines from tokens.css. */
export function parseTokens(css: string): TokenGroup[] {
  const groups: TokenGroup[] = [];
  for (const line of css.split('\n')) {
    const group = line.match(/\/\*\s*@group\s+(.+?)\s*\*\//);
    if (group) {
      groups.push({ group: group[1], tokens: [] });
      continue;
    }
    const decl = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?);/);
    if (decl && groups.length) groups.at(-1)!.tokens.push({ name: decl[1], value: decl[2] });
  }
  return groups;
}
