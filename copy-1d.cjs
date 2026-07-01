const fs = require('fs');
const content = fs.readFileSync('src/pages/prediksi-2d.tsx', 'utf8');

let newContent = content
  .replaceAll('2D', '1D')
  .replaceAll('2d', '1d')
  .replace('prediksi-1d', 'prediksi-1d')
  .replaceAll('70', '7')
  .replaceAll('7000', '7') // just in case
  .replaceAll('10 LN', '1 LN')
  .replaceAll('30 LN', '3 LN')
  .replaceAll('slice(0, 10)', 'slice(0, 1)')
  .replaceAll('slice(10, 40)', 'slice(1, 4)')
  .replaceAll('slice(40, 70)', 'slice(4, 7)')
  .replaceAll('slice(70, 100)', 'slice(7, 10)')
  .replaceAll('substring(2)', 'substring(3)') // 1D uses full 1 char (last char of 4D string)
  .replaceAll('val1d', 'val1d')
  .replaceAll('decay1D', 'decay1D')
  .replaceAll('freq1D', 'freq1D')
  .replaceAll('last1dStr', 'last1dStr')
  .replaceAll('val1dStr', 'val1dStr')
  .replaceAll('prevVal1dStr', 'prevVal1dStr')
  .replaceAll('testDraw1D', 'testDraw1D')
  .replace('2 Angka Belakang (00–99)', '1 Angka Belakang (0–9)');

// Need to remove Kepala digit
newContent = newContent.replace('const freqKepala = new Array(10).fill(0);', '');
newContent = newContent.replace('const tempKepala = new Array(10).fill(0);', '');

newContent = newContent.replace('const kepDigit = parseInt(full4d[2]);\n', '');
newContent = newContent.replace('const kep = parseInt(full4d[2]);\n', '');

newContent = newContent.replace('freqKepala[kepDigit]++;', '');
newContent = newContent.replace('tempKepala[kep]++;', '');

newContent = newContent.replace('const val1d = kepDigit * 10 + ekorDigit;', 'const val1d = ekorDigit;');
newContent = newContent.replace('const val = kep * 10 + ek;', 'const val = ek;');

newContent = newContent.replace('const kep = Math.floor(i / 10);', '');
newContent = newContent.replace('const kep = Math.floor(code / 10);', '');

newContent = newContent.replace('const numStr = i.toString().padStart(2, "0");', 'const numStr = i.toString();');
newContent = newContent.replace('x.code.toString().padStart(2, "0")', 'x.code.toString()');

newContent = newContent.replace(/freqKepala\[kep\] \+ freqEkor\[ekor\]/g, 'freqEkor[ekor]');
newContent = newContent.replace(/Math\.max\(\.\.\.freqKepala\) \+ Math\.max\(\.\.\.freqEkor\)/g, 'Math.max(...freqEkor)');

newContent = newContent.replace(/tempKepala\[kep\] \+ tempEkor\[ek\]/g, 'tempEkor[ek]');
newContent = newContent.replace(/Math\.max\(\.\.\.tempKepala\) \+ Math\.max\(\.\.\.tempEkor\)/g, 'Math.max(...tempEkor)');

newContent = newContent.replace('Kepala dan Ekor', 'Ekor');

newContent = newContent.replace('100 Kombinasi', '10 Kombinasi');
newContent = newContent.replace('10 Kombinasi total', '10 Kombinasi total'); // fix? wait, 100 LN to 10 LN to 1 LN
newContent = newContent.replace('i < 100', 'i < 10');

fs.writeFileSync('src/pages/prediksi-1d.tsx', newContent);
console.log('done');
