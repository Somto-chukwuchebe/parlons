/** Fill {{placeholders}} in a pack template. Unknown placeholders are left visible so they get noticed. */
export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key: string) => (key in vars ? String(vars[key]) : m))
}

/** Placeholders a template uses (for tests and the editor). */
export const placeholders = (template: string) => [...new Set([...template.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]))]
