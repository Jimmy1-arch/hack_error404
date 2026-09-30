const fs = require('fs');
let c = fs.readFileSync('app/solve/page.tsx', 'utf8');
c = c.replace("setLoading(true);", "setLoading(true);\n    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);");
fs.writeFileSync('app/solve/page.tsx', c);
console.log('Fixed');
