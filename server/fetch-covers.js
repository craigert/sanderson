// Fills in any missing book covers (client/public/covers/<id>.jpg) by searching
// Google Books by title. Run any time covers are missing:  node server/fetch-covers.js
const https = require('https');
const fs = require('fs');
const path = require('path');
const { dbAll } = require('./db');

const COVERS = path.join(__dirname, '..', 'client', 'public', 'covers');

// Collected short works fall back to the anthology cover if they have no
// standalone edition on Google Books.
// Collected short works fall back to the anthology cover if they have no
// standalone edition on Open Library.
const ARCANUM = 'Arcanum Unbounded';
const FALLBACKS = {
  'Edgedancer': ARCANUM,
  'Mistborn: Secret History': ARCANUM,
  'Sixth of the Dusk': ARCANUM,
  'Shadows for Silence in the Forests of Hell': ARCANUM,
  'The Hope of Elantris': ARCANUM,
  'The Eleventh Metal': ARCANUM,
  'Allomancer Jak and the Pits of Eltania': ARCANUM,
};

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 12000, headers: { 'User-Agent': 'sanderson-catalog' } }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(e); }
      });
    }).on('error', reject).on('timeout', function () { this.destroy(new Error('timeout')); });
  });
}

function getBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 12000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(getBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject).on('timeout', function () { this.destroy(new Error('timeout')); });
  });
}

async function coverFor(title) {
  const url = 'https://openlibrary.org/search.json?limit=5&fields=title,cover_i&author=Brandon+Sanderson&title='
    + encodeURIComponent(title);
  const data = await getJson(url);
  for (const doc of (data.docs || [])) {
    if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
  }
  return null;
}

async function main() {
  fs.mkdirSync(COVERS, { recursive: true });
  const books = await dbAll('SELECT id, title FROM books ORDER BY id ASC');
  let filled = 0;
  for (const b of books) {
    const dest = path.join(COVERS, `${b.id}.jpg`);
    if (fs.existsSync(dest)) continue; // keep existing covers
    const queries = [b.title];
    if (FALLBACKS[b.title]) queries.push(FALLBACKS[b.title]);
    let saved = false;
    for (const q of queries) {
      try {
        const src = await coverFor(q);
        if (!src) continue;
        const img = await getBuffer(src);
        if (img && img.length > 2000) {
          fs.writeFileSync(dest, img);
          console.log(`#${b.id} "${b.title}" ← ${q} (${Math.round(img.length / 1024)} KB)`);
          filled += 1;
          saved = true;
          break;
        }
      } catch (e) { /* try next query */ }
    }
    if (!saved) console.log(`#${b.id} "${b.title}" — no cover found`);
  }
  console.log(`Filled ${filled} missing covers.`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
