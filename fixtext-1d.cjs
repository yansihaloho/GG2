const fs = require('fs');
let content = fs.readFileSync('src/pages/prediksi-1d.tsx', 'utf8');

content = content.replaceAll('10 Kombinasi dengan', '1 Kombinasi dengan');
content = content.replaceAll('1 Kombinasi total', '1 Kombinasi total'); // Wait, is there any?

fs.writeFileSync('src/pages/prediksi-1d.tsx', content);
console.log('done text1d');
