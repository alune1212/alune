export function createLineNumberLookup(source) {
  let lineCount = 1;
  for (let index = 0; index < source.length; index += 1) {
    if (source.charCodeAt(index) === 10) lineCount += 1;
  }

  const lineStarts = new Uint32Array(lineCount);
  let line = 1;
  lineStarts[0] = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source.charCodeAt(index) === 10) {
      lineStarts[line] = index + 1;
      line += 1;
    }
  }

  return (index) => {
    let lower = 0;
    let upper = lineStarts.length;

    while (lower + 1 < upper) {
      const middle = (lower + upper) >>> 1;
      if (lineStarts[middle] <= index) lower = middle;
      else upper = middle;
    }

    return lower + 1;
  };
}

export function markdownLinks(source) {
  const links = [];
  const lineNumberAt = createLineNumberLookup(source);
  const pattern = /!?\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of source.matchAll(pattern)) {
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    } else {
      target = target.split(/\s+["']/u, 1)[0];
    }

    links.push({
      target,
      line: lineNumberAt(match.index ?? 0),
    });
  }

  const referencePattern = /^\s{0,3}\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/gmu;
  for (const match of source.matchAll(referencePattern)) {
    links.push({
      target: match[1] ?? match[2],
      line: lineNumberAt(match.index ?? 0),
    });
  }

  return links;
}
