const fs = require('fs');
const path = require('path');

const p1 = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', 'classification', 'ClassificationPromptBuilder.java');
let c1 = fs.readFileSync(p1, 'utf8');
c1 = c1.replace(/return input\.replace\([\s\S]*?\)\.trim\(\);/, 'return input.replaceAll("\\r", " ").replaceAll("\\n", " ").trim();');
fs.writeFileSync(p1, c1, 'utf8');

const p2 = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'edu', 'campus', 'maintenance', 'classification', 'ClassificationService.java');
let c2 = fs.readFileSync(p2, 'utf8');
c2 = c2.replace(/\.metadata\("\{[\s\S]*?"\}\"\)/, '.metadata("{\\"confidence\\":" + result.getConfidence() + ",\\"source\\":\\"" + source.name() + "\\"}")');
fs.writeFileSync(p2, c2, 'utf8');

console.log('Fixed phase 4 files.');