const j = require('jimp');
console.log('type:', typeof j);
const keys = Object.keys(j);
console.log('keys:', keys.slice(0, 15));
// Check if Jimp class is nested
if (j.Jimp) console.log('has .Jimp:', typeof j.Jimp);
if (j.default) console.log('has .default:', typeof j.default);
