import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 100% compliant 192x192 and 512x512 PNG solid buffers for Chrome/Lighthouse audits
const pwa192Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlST6FAAAAA1BMVEUPEyquEnorAAAASElEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADuDcXgAAEs7UscAAAAAElFTkSuQmCC';
const pwa512Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIABAMAAAAtvjA0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAMFBMVEUPEyquEnorAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD9YkOnAAAAAnRSTlMAAHaTzTgAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfnCBwcMBe9wXpTAAAAl0lEQVR42u3BMQEAAADCoPVPbQo/oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgX0v0AAHscC7uAAAAAElFTkSuQmCC';

const pwa192Buffer = Buffer.from(pwa192Base64, 'base64');
const pwa512Buffer = Buffer.from(pwa512Base64, 'base64');

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192Buffer);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512Buffer);

console.log('✅ Standalone PWA 192x192 and 512x512 compliant PNG icon assets written to /public!');
