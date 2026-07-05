// Exports the SQLite catalog to static files the client can serve without a
// backend: client/public/data/catalog.json and client/public/covers/<id>.jpg.
// Re-run after changing seed data:  node server/export-static.js
const fs = require('fs');
const path = require('path');
const { dbAll } = require('./db');

const CLIENT_PUBLIC = path.join(__dirname, '..', 'client', 'public');
const DATA_DIR = path.join(CLIENT_PUBLIC, 'data');
const COVERS_DIR = path.join(CLIENT_PUBLIC, 'covers');
const COVER_CACHE = path.join(__dirname, '.cover-cache');

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(COVERS_DIR, { recursive: true });

  const series = await dbAll('SELECT id, name, cosmere FROM series ORDER BY id ASC');
  const books = await dbAll(
    'SELECT id, title, series_id, series_order, published_year, synopsis, cosmere FROM books ORDER BY published_year ASC'
  );
  const characters = await dbAll('SELECT id, book_id, name, description FROM characters ORDER BY id ASC');
  const places = await dbAll('SELECT id, book_id, name, description, type FROM places ORDER BY id ASC');

  // Per-book detail bundles
  const details = {};
  for (const b of books) {
    details[b.id] = {
      characters: characters.filter(c => c.book_id === b.id).map(({ id, name, description }) => ({ id, name, description })),
      places: places.filter(p => p.book_id === b.id).map(({ id, name, description, type }) => ({ id, name, description, type })),
    };
  }

  const catalog = {
    series,
    books,
    // Flat lists power the command-palette search index
    characters: characters.map(({ name, book_id }) => ({ name, book_id })),
    places: places.map(({ name, book_id, type }) => ({ name, book_id, type })),
    details,
  };

  fs.writeFileSync(path.join(DATA_DIR, 'catalog.json'), JSON.stringify(catalog));
  console.log(`Wrote data/catalog.json — ${books.length} books, ${series.length} series, ${characters.length} characters, ${places.length} places`);

  // Copy each book's cached cover to covers/<id>.jpg
  let copied = 0;
  if (fs.existsSync(COVER_CACHE)) {
    const cache = fs.readdirSync(COVER_CACHE);
    for (const b of books) {
      const file = cache.find(f => f.startsWith(`${b.id}_`) && f.endsWith('.jpg'));
      if (file) {
        fs.copyFileSync(path.join(COVER_CACHE, file), path.join(COVERS_DIR, `${b.id}.jpg`));
        copied += 1;
      }
    }
  }
  console.log(`Copied ${copied} covers to covers/`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
