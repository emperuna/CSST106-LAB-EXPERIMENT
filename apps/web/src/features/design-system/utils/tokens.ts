/** One custom property from tokens.css: its value and the comment written beside it, if any. */
export interface Token {
  name: string;
  value: string;
  note?: string;
}

/**
 * Reads every `--name: value; /* note *\/` line from a stylesheet's source, so the design system
 * page shows the tokens exactly as tokens.css defines them.
 */
export function parseTokens(css: string): Map<string, Token> {
  const tokens = new Map<string, Token>();
  const line = /--([\w-]+):\s*([^;]+);[ \t]*(?:\/\*\s*(.*?)\s*\*\/)?/g;
  for (const [, name, value, note] of css.matchAll(line)) {
    tokens.set(`--${name}`, { name: `--${name}`, value: value!.trim(), note });
  }
  return tokens;
}

/** Looks up a list of token names, keeping their order and failing loudly on a typo. */
export function pick(tokens: Map<string, Token>, names: string[]): Token[] {
  return names.map((name) => {
    const token = tokens.get(name);
    if (!token) throw new Error(`Missing design token ${name}`);
    return token;
  });
}
