import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'server', 'openapi.yaml');

console.log('__dirname:', __dirname);
console.log('Target file path:', filePath);

if (fs.existsSync(filePath)) {
    console.log('File exists!');
    const stats = fs.statSync(filePath);
    console.log('Size:', stats.size);
} else {
    console.log('File does NOT exist at this path.');
    // Check if it's in the current dir
    const localPath = path.join(__dirname, 'openapi.yaml');
    console.log('Checking local path:', localPath);
    if (fs.existsSync(localPath)) {
        console.log('Found it in current dir!');
    }
}
