const fs = require('fs');

const code = fs.readFileSync('app/components/DashboardAdmin.tsx', 'utf8');

// Find all JSX tags in code lines
const lines = code.split('\n');
const tagMatches = [];
for (let l = 0; l < lines.length; l++) {
  const lineContent = lines[l];
  // Simple check for tag pattern in line
  let m;
  const lineRegex = /<\/?[a-zA-Z0-9\-]+/g;
  while ((m = lineRegex.exec(lineContent)) !== null) {
    tagMatches.push({ name: m[0], line: l + 1, content: lineContent.trim() });
  }
}

// Let's filter out HTML tags in standard comments and print
tagMatches.forEach(tag => {
  // Let's trace divs, asides, headers
  if (tag.name === '<div' || tag.name === '</div' || tag.name === '<aside' || tag.name === '</aside' || tag.name === '<header' || tag.name === '</header') {
    // Basic filter to ignore tags inside comment lines starting with // or /*
    if (!tag.content.startsWith('//') && !tag.content.startsWith('/*')) {
      console.log(`Line ${tag.line}: ${tag.name}`);
    }
  }
});
