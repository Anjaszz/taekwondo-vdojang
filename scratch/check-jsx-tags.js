const fs = require('fs');

const code = fs.readFileSync('app/components/DashboardAdmin.tsx', 'utf8');

// Simple JSX tag parser using a state machine
let inComment = false;
let inString = null;
let i = 0;
let line = 1;
let col = 1;
const stack = [];

while (i < code.length) {
  const char = code[i];
  const next = code[i + 1];

  if (char === '\n') {
    line++;
    col = 1;
  } else {
    col++;
  }

  // Comments in JS
  if (inComment === 'line') {
    if (char === '\n') inComment = false;
    i++;
    continue;
  }
  if (inComment === 'block') {
    if (char === '*' && next === '/') {
      inComment = false;
      i += 2;
      col += 2;
    } else {
      i++;
    }
    continue;
  }
  if (char === '/' && next === '/') {
    inComment = 'line';
    i += 2;
    col += 2;
    continue;
  }
  if (char === '/' && next === '*') {
    inComment = 'block';
    i += 2;
    col += 2;
    continue;
  }

  // Strings
  if (inString) {
    if (char === '\\') {
      i += 2;
      col += 2;
      continue;
    }
    if (char === inString) {
      inString = null;
    }
    i++;
    continue;
  }
  if (char === "'" || char === '"' || char === '`') {
    inString = char;
    i++;
    continue;
  }

  // JSX Comments {/* ... */}
  if (char === '{' && next === '/' && code[i + 2] === '*') {
    // Skip until */ }
    let found = false;
    let j = i + 3;
    while (j < code.length) {
      if (code[j] === '*' && code[j + 1] === '/' && code[j + 2] === '}') {
        i = j + 3;
        found = true;
        break;
      }
      j++;
    }
    if (found) continue;
  }

  // Tags
  if (char === '<') {
    // Check if it's a tag or just less-than operator
    const nextChar = code[i + 1];
    if (/[a-zA-Z\/!]/.test(nextChar)) {
      // Parse tag
      let tagStr = '';
      let j = i;
      let openBraces = 0;
      let inTagString = null;
      while (j < code.length) {
        const c = code[j];
        tagStr += c;
        if (inTagString) {
          if (c === '\\') { j += 2; continue; }
          if (c === inTagString) inTagString = null;
        } else {
          if (c === '"' || c === "'") inTagString = c;
          else if (c === '{') openBraces++;
          else if (c === '}') openBraces--;
          else if (c === '>' && openBraces === 0) {
            break;
          }
        }
        j++;
      }
      i = j + 1;
      col += tagStr.length;

      // Clean tag string
      const isClose = tagStr.startsWith('</');
      const isSelfClosing = tagStr.endsWith('/>');
      const tagNameMatch = tagStr.match(/<\/?([a-zA-Z0-9\-:]+)/);
      if (tagNameMatch) {
        const name = tagNameMatch[1];
        // Ignore html comments or fragments
        if (name && !tagStr.startsWith('<!--') && !tagStr.startsWith('<!')) {
          if (isSelfClosing) {
            // Self closing tag, do nothing
          } else if (isClose) {
            if (stack.length === 0) {
              console.log(`Unmatched close tag </${name}> at line ${line}`);
            } else {
              const top = stack.pop();
              if (top.name !== name) {
                console.log(`Mismatched tags: opened <${top.name}> at line ${top.line}, but closed </${name}> at line ${line}`);
              }
            }
          } else {
            stack.push({ name, line });
          }
        }
      }
      continue;
    }
  }

  i++;
}

console.log(`Remaining tags on stack at end:`, stack);
