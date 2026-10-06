export type OutlineItem = { name: string; depth: number };

/** Simple outline reader: numbered lines (1., 1.1), bullets, or indentation. */
export function parseOutline(text: string, max = 200): OutlineItem[] {
  const items: OutlineItem[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const indent = (raw.match(/^[\t ]*/)?.[0] ?? "").replace(/\t/g, "  ").length;
    let line = raw.trim();
    if (/^(course|title)\s*:/i.test(line)) continue;
    let depth = Math.floor(indent / 2);
    const num = line.match(/^(\d+(?:\.\d+)*)[.)]?\s+/);
    if (num) {
      depth = num[1].split(".").length - 1;
      line = line.slice(num[0].length);
    } else {
      line = line.replace(/^[-*•]\s+/, "");
    }
    line = line.trim().slice(0, 120);
    if (line) items.push({ name: line, depth });
    if (items.length >= max) break;
  }
  return items;
}
