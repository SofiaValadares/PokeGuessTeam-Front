import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pngPath = path.join(root, 'public', 'favicon-32.png');
const icoPath = path.join(root, 'public', 'favicon.ico');

const buf = await pngToIco([pngPath]);
await fs.writeFile(icoPath, buf);
console.log('Escrito', icoPath, `(${buf.length} bytes)`);
