const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src').filter(f => f.endsWith('.jsx'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Replace backslash followed by backtick
  content = content.replace(/\\`/g, '`');
  // Replace backslash followed by dollar sign
  content = content.replace(/\\\$/g, '$');
  fs.writeFileSync(f, content);
  console.log('Fixed', f);
});
