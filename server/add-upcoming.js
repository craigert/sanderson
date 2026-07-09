// Adds newly announced / upcoming books (idempotent). Covers are filled
// afterward by fetch-covers.js. Run:  node server/add-upcoming.js
const { getDb } = require('./db');
const db = getDb();

// series_id: 10 Standalone Cosmere · 11 Other (non-Cosmere)
const BOOKS = [
  {
    title: 'The Fires of December',
    series_id: 10, series_order: 5, published_year: 2026, cosmere: 1,
    synopsis: 'A forthcoming Cosmere novel, due late 2026.',
  },
  {
    title: 'Tailored Realities',
    series_id: 11, series_order: 1, published_year: 2026, cosmere: 0,
    synopsis: 'A collection of Brandon Sanderson\'s science-fiction and fantasy short works, including the thriller "Moment Zero".',
  },
];

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}

async function main() {
  for (const b of BOOKS) {
    const existing = await get('SELECT id FROM books WHERE title = ?', [b.title]);
    if (existing) {
      await run('UPDATE books SET series_id=?, series_order=?, published_year=?, synopsis=?, cosmere=? WHERE id=?',
        [b.series_id, b.series_order, b.published_year, b.synopsis, b.cosmere, existing.id]);
      console.log(`Updated "${b.title}" (id ${existing.id})`);
    } else {
      const res = await run('INSERT INTO books (title, series_id, series_order, published_year, synopsis, cover_url, cosmere) VALUES (?, ?, ?, ?, ?, NULL, ?)',
        [b.title, b.series_id, b.series_order, b.published_year, b.synopsis, b.cosmere]);
      console.log(`Inserted "${b.title}" (id ${res.lastID})`);
    }
  }
  console.log('Done.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
