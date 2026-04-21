const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const firestoreServicePath = path.join(srcDir, 'services', 'firestoreService.js');

// 1. Get all exports from firestoreService.js
const firestoreContent = fs.readFileSync(firestoreServicePath, 'utf8');
const exportedNames = new Set([...firestoreContent.matchAll(/export (?:async )?function ([a-zA-Z0-9_]+)/g)].map(m => m[1]));
[...firestoreContent.matchAll(/export const ([a-zA-Z0-9_]+)/g)].forEach(m => exportedNames.add(m[1]));

// 2. Find all imports from firestoreService
const importedNames = new Set();
function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.matchAll(/import\s+{([^}]+)}\s+from\s+['"][./\w]+firestoreService['"]/g);
      for (const match of matches) {
        const imports = match[1].split(',').map(s => s.trim().split(' as ')[0]);
        imports.forEach(i => {
           if(i) importedNames.add(i);
        });
      }
    }
  }
}

scanDir(srcDir);

// 3. Compare
const missingExports = [];
for (const name of importedNames) {
  if (!exportedNames.has(name)) {
    missingExports.push(name);
  }
}

console.log('--- AUDIT RESULTS ---');
if (missingExports.length === 0) {
  console.log('✅ All good! No missing exports.');
} else {
  console.log('❌ MISSING EXPORTS FOUND:');
  console.log(missingExports.join(', '));
}
