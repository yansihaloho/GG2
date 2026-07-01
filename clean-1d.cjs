const fs = require('fs');
let content = fs.readFileSync('src/pages/prediksi-1d.tsx', 'utf8');

// replace all Array(100) and length: 100 with Array(10) and length: 10
content = content.replaceAll('Array(100)', 'Array(10)');
content = content.replaceAll('length: 100', 'length: 10');

// correct slices
content = content.replaceAll('predictionList.slice(40, 7)', 'predictionList.slice(4, 7)');
content = content.replaceAll('predictionList.slice(7, 100)', 'predictionList.slice(7, 10)');

// prevVal1dStr should be just the last char
content = content.replaceAll('prevFull[2] + prevFull[3]', 'prevFull[3]');
content = content.replaceAll('lastDraw[2] + lastDraw[3]', 'lastDraw[3]');

// fix test draw for 1D
content = content.replaceAll('testDraw.result[2] + testDraw.result[3]', 'testDraw.result[3]');

content = content.replaceAll('300 Line yang Dieliminasi', '3 Line yang Dieliminasi');
content = content.replaceAll('Tampilkan 30 LN Lemah', 'Tampilkan 3 LN Lemah');
content = content.replaceAll('Tampilkan 3000 LN Lemah', 'Tampilkan 3 LN Lemah');
content = content.replaceAll('Ke-30 line di atas', 'Ke-3 line di atas');
content = content.replaceAll('Ke-3 line di atas', 'Ke-3 line di atas');
content = content.replaceAll('Ke-3000 line tersebut', 'Ke-3 line di atas');
content = content.replaceAll('Ke-300 line', 'Ke-3 line');
content = content.replaceAll('Ke-30 line', 'Ke-3 line');
content = content.replaceAll('Ke-70 line', 'Ke-7 line');
content = content.replaceAll('Ke-700 line', 'Ke-7 line');

fs.writeFileSync('src/pages/prediksi-1d.tsx', content);
console.log('done clean1d');
