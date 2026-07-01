const fs = require('fs');
const content = fs.readFileSync('src/pages/prediksi-3d.tsx', 'utf8');

let newContent = content
  .replaceAll('3D', '4D')
  .replaceAll('3d', '4d')
  .replace('prediksi-3d', 'prediksi-4d')
  .replaceAll('700', '7000')
  .replaceAll('70000', '7000') // just in case
  .replaceAll('1000', '10000')
  .replaceAll('100 LN', '1000 LN')
  .replaceAll('300 LN', '3000 LN')
  .replaceAll('slice(0, 100)', 'slice(0, 1000)')
  .replaceAll('slice(100, 400)', 'slice(1000, 4000)')
  .replaceAll('slice(400, 700)', 'slice(4000, 7000)')
  .replaceAll('slice(700, 1000)', 'slice(7000, 10000)')
  .replaceAll('substring(1)', 'substring(0)') // 4D uses full 4 chars
  .replaceAll('val3d', 'val4d')
  .replaceAll('decay3D', 'decay4D')
  .replaceAll('freq3D', 'freq4D')
  .replaceAll('last3dStr', 'last4dStr')
  .replaceAll('val3dStr', 'val4dStr')
  .replaceAll('prevVal3dStr', 'prevVal4dStr')
  .replaceAll('testDraw3D', 'testDraw4D')
  .replace('3 Angka Belakang (000–999)', '4 Angka (0000–9999)');

// Need to add As digit
newContent = newContent.replace('const freqKop = new Array(10).fill(0);', 'const freqAs = new Array(10).fill(0);\n    const freqKop = new Array(10).fill(0);');
newContent = newContent.replace('tempKop = new Array(10).fill(0);', 'tempAs = new Array(10).fill(0);\n      const tempKop = new Array(10).fill(0);');

newContent = newContent.replace('const kopDigit = parseInt(full4d[1]);', 'const asDigit = parseInt(full4d[0]);\n      const kopDigit = parseInt(full4d[1]);');
newContent = newContent.replace('const kop = parseInt(full4d[1]);', 'const as = parseInt(full4d[0]);\n        const kop = parseInt(full4d[1]);');

newContent = newContent.replace('freqKop[kopDigit]++;', 'freqAs[asDigit]++;\n      freqKop[kopDigit]++;');
newContent = newContent.replace('tempKop[kop]++;', 'tempAs[as]++;\n        tempKop[kop]++;');

newContent = newContent.replace('const val4d = kopDigit * 100 + kepDigit * 10 + ekorDigit;', 'const val4d = asDigit * 1000 + kopDigit * 100 + kepDigit * 10 + ekorDigit;');
newContent = newContent.replace('const val = kop * 100 + kep * 10 + ek;', 'const val = as * 1000 + kop * 100 + kep * 10 + ek;');

newContent = newContent.replace('const kop = Math.floor(i / 100);', 'const as = Math.floor(i / 1000);\n      const kop = Math.floor((i % 1000) / 100);');
newContent = newContent.replace('const kop = Math.floor(code / 100);', 'const as = Math.floor(code / 1000);\n        const kop = Math.floor((code % 1000) / 100);');

newContent = newContent.replace('const numStr = i.toString().padStart(3, "0");', 'const numStr = i.toString().padStart(4, "0");');
newContent = newContent.replace('x.code.toString().padStart(3, "0")', 'x.code.toString().padStart(4, "0")');

newContent = newContent.replace(/freqKop\[kop\] \+ freqKepala\[kep\] \+ freqEkor\[ekor\]/g, 'freqAs[as] + freqKop[kop] + freqKepala[kep] + freqEkor[ekor]');
newContent = newContent.replace(/Math\.max\(\.\.\.freqKop\) \+ Math\.max\(\.\.\.freqKepala\) \+ Math\.max\(\.\.\.freqEkor\)/g, 'Math.max(...freqAs) + Math.max(...freqKop) + Math.max(...freqKepala) + Math.max(...freqEkor)');

newContent = newContent.replace(/tempKop\[kop\] \+ tempKepala\[kep\] \+ tempEkor\[ek\]/g, 'tempAs[as] + tempKop[kop] + tempKepala[kep] + tempEkor[ek]');
newContent = newContent.replace(/Math\.max\(\.\.\.tempKop\) \+ Math\.max\(\.\.\.tempKepala\) \+ Math\.max\(\.\.\.tempEkor\)/g, 'Math.max(...tempAs) + Math.max(...tempKop) + Math.max(...tempKepala) + Math.max(...tempEkor)');

newContent = newContent.replace('Kop, Kepala dan Ekor', 'As, Kop, Kepala dan Ekor');


fs.writeFileSync('src/pages/prediksi-4d.tsx', newContent);
console.log('done');
