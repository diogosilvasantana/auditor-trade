const fs = require('fs');
const { parse } = require('csv-parse/sync');

const buffer = fs.readFileSync('../../ZERO7 - RESULTADO.csv');
let content = buffer.toString('utf-8');

if (content.startsWith('Conta:') || content.startsWith('Titular:')) {
    const lines = content.split('\n');
    console.log("FIRST FEW LINES:", lines.slice(0, 7));
    const headerIndex = lines.findIndex(line => line.includes('Subconta;') || line.includes('Subconta,'));
    console.log("HEADER INDEX DETECTED AT:", headerIndex);
    if (headerIndex !== -1) {
        content = lines.slice(headerIndex).join('\n');
    }
}

console.log("CLEANED CONTENT START:", content.slice(0, 100));

const firstLine = content.split('\n')[0];
const detectedDelimiter = firstLine.includes(';') ? ';' : ',';
console.log("DELIMITER DETECTED:", detectedDelimiter);

try {
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: detectedDelimiter,
    });
    console.log(`PARSE SUCCESS! Found ${records.length} records.`);
    console.log("FIRST RECORD:", records[0]);
} catch (err) {
    console.error("PARSE FAILED:", err);
}
