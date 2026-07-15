const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'app', 'components', 'DashboardAdmin.tsx');
const content = fs.readFileSync(targetFile, 'utf8');

const query = process.argv[2] || '';
console.log('Searching for:', query);

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes(query.toLowerCase())) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
