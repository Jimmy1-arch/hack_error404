const fs = require('fs');
let c = fs.readFileSync('app/solve/page.tsx', 'utf8');
const lines = c.split(/\r?\n/);

const newLines = lines.filter((line, index) => {
  // Line 137 is index 136, Line 140 is index 139 (but these might shift)
  if (line.includes('className="ticket-created"') && !line.includes('AnimatePresence')) {
    return false; // remove old ticket-created
  }
  if (line.includes('className="ticket-analysis-block"')) {
    return false; // remove old analysis block
  }
  return true;
});

fs.writeFileSync('app/solve/page.tsx', newLines.join('\n'));
console.log('Cleaned up duplicates');
