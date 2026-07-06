// Adds the remaining Cosmere short works & newer standalones to the catalog DB
// (idempotent — safe to re-run). Run once, then `npm run data` to re-bake.
//   node server/add-extras.js
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { getDb } = require('./db');

const db = getDb();
const COVERS = path.join(__dirname, '..', 'client', 'public', 'covers');

// series_id: 2 Mistborn Era 1 · 3 Mistborn Era 2 · 4 Elantris · 10 Standalone Cosmere
const EXTRAS = [
  {
    title: 'The Isles of the Emberdark',
    series_id: 10, series_order: 4, published_year: 2025, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/9781638920649-L.jpg?default=false',
    synopsis: 'A full Cosmere novel expanding the world of First of the Sun. As worldhoppers reach ever deeper into the archipelago and the dark beyond it, the fate of the Aviar — and secrets that touch the whole cosmere — hang in the balance.',
    characters: [
      ['Sixth of the Dusk', 'A solitary, superstitious trapper of the isles who bonds with rare Aviar and ventures where others fear to go.'],
      ['Vathi', 'A sharp, ambitious scholar and inventor working to modernise her people and understand the Aviar.'],
    ],
    places: [
      ['Patji', 'The deadliest island of First of the Sun — the father-island, an avatar of the Shard Autonomy.'],
      ['The Emberdark', 'The vast dark beyond the isles, where older and stranger things wait.'],
    ],
  },
  {
    title: 'Sixth of the Dusk',
    series_id: 10, series_order: 0.5, published_year: 2014, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/9781938570100-L.jpg?default=false',
    synopsis: 'On a chain of islands where the wildlife hunts by sensing thought, the trapper Sixth of the Dusk survives with the aid of two Aviar — until visions of his own death, and off-worlders bearing impossible technology, warn that his world is about to change forever.',
    characters: [
      ['Sixth of the Dusk', 'A superstitious, solitary trapper who works the deadly island of Patji with his Aviar, Sak and Kokerlii.'],
      ['Vathi', 'A scholar from the mainland whose company and machines Dusk deeply distrusts.'],
    ],
    places: [
      ['Patji', 'The most lethal island of the chain, where thought itself draws predators.'],
    ],
  },
  {
    title: 'Shadows for Silence in the Forests of Hell',
    series_id: 10, series_order: 0.6, published_year: 2013, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/nope-L.jpg?default=false',
    synopsis: 'Silence Montane runs a waystop in a haunted forest where the dead walk as Shades. To protect her family and pay her debts she breaks the Simple Rules for coin — a gamble that could doom them all when a notorious outlaw arrives at her door.',
    characters: [
      ['Silence Montane', 'A hard, secretive innkeeper and bounty hunter surviving on the edge of the Forests of Hell.'],
      ['William Ann', 'Silence\'s daughter, learning the grim trade of hunting men among the dead.'],
    ],
    places: [
      ['The Forests of Hell', 'A frontier woodland ruled by the Shades, where breaking the Simple Rules invites a cold death.'],
    ],
  },
  {
    title: 'White Sand',
    series_id: 10, series_order: 0.7, published_year: 2016, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/9781606909959-L.jpg?default=false',
    synopsis: 'On the blazing Dayside of Taldain, Kenton is a weak Sand Master in a proud order. When his kind are massacred, he must claim leadership of the survivors and master the living sand to save them — while an off-world duchess pursues her own agenda.',
    characters: [
      ['Kenton', 'A stubborn, underpowered Sand Master determined to prove himself and save his order.'],
      ['Khriss', 'A Darkside duchess and scholar who has crossed the world seeking knowledge — and Autonomy\'s secrets.'],
    ],
    places: [
      ['The Dayside', 'The sun-scorched half of Taldain, where the white sands answer a Sand Master\'s will.'],
    ],
  },
  {
    title: 'The Hope of Elantris',
    series_id: 4, series_order: 1.5, published_year: 2006, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/nope2-L.jpg?default=false',
    synopsis: 'A short coda to Elantris: while the city burns and its people flee, a schoolteacher and the children in her care find an unexpected role in Elantris\'s salvation.',
    characters: [
      ['Matisse', 'A young Elantrian who shelters the city\'s children through its darkest night.'],
      ['Idotris', 'One of the children of fallen Elantris, caught up in the city\'s desperate hour.'],
    ],
    places: [
      ['Elantris', 'The fallen city of the gods, on the night of its restoration.'],
    ],
  },
  {
    title: 'The Eleventh Metal',
    series_id: 2, series_order: 0.5, published_year: 2011, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/nope3-L.jpg?default=false',
    synopsis: 'A prequel to Mistborn: The Final Empire. A younger Kelsier, newly come into his powers, is trained by the mysterious Gemmel and learns the hard lessons of Allomancy — and of a mysterious eleventh metal.',
    characters: [
      ['Kelsier', 'The future Survivor, raw and grieving, learning to burn metals under a harsh teacher.'],
      ['Gemmel', 'A half-mad Mistborn who trains Kelsier without mercy.'],
    ],
    places: [
      ['The Final Empire', 'The ash-strewn dominion of the Lord Ruler, in the years before the Survivor\'s rise.'],
    ],
  },
  {
    title: 'Allomancer Jak and the Pits of Eltania',
    series_id: 3, series_order: 1.5, published_year: 2016, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/nope4-L.jpg?default=false',
    synopsis: 'The wildly embellished broadsheet adventures of Allomancer Jak, gentleman and adventurer of the Elendel Basin, as (barely) survived and (heavily) footnoted by his long-suffering Terris steward.',
    characters: [
      ['Allomancer Jak', 'A self-styled hero and serial exaggerator whose exploits fill the Basin\'s broadsheets.'],
      ['Handerwym', 'Jak\'s dry, sceptical Terris steward, forever correcting the record in the footnotes.'],
    ],
    places: [
      ['The Roughs', 'The lawless frontier beyond the Basin, backdrop to Jak\'s dubious heroics.'],
    ],
  },
];

function fetchFollowRedirects(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchFollowRedirects(res.headers.location, maxRedirects - 1));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject).on('timeout', function () { this.destroy(new Error('timeout')); });
  });
}

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
  fs.mkdirSync(COVERS, { recursive: true });
  for (const e of EXTRAS) {
    const existing = await get('SELECT id FROM books WHERE title = ?', [e.title]);
    let id;
    if (existing) {
      id = existing.id;
      await run('UPDATE books SET series_id=?, series_order=?, published_year=?, synopsis=?, cover_url=?, cosmere=? WHERE id=?',
        [e.series_id, e.series_order, e.published_year, e.synopsis, e.cover_url, e.cosmere, id]);
      console.log(`Updated "${e.title}" (id ${id})`);
    } else {
      const res = await run('INSERT INTO books (title, series_id, series_order, published_year, synopsis, cover_url, cosmere) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [e.title, e.series_id, e.series_order, e.published_year, e.synopsis, e.cover_url, e.cosmere]);
      id = res.lastID;
      for (const [name, desc] of e.characters) {
        await run('INSERT INTO characters (book_id, name, description) VALUES (?, ?, ?)', [id, name, desc]);
      }
      for (const [name, desc] of e.places) {
        await run('INSERT INTO places (book_id, name, description, type) VALUES (?, ?, ?, ?)', [id, name, desc, 'landmark']);
      }
      console.log(`Inserted "${e.title}" (id ${id})`);
    }
    try {
      const data = await fetchFollowRedirects(e.cover_url);
      if (data && data.length > 2000) {
        fs.writeFileSync(path.join(COVERS, `${id}.jpg`), data);
        console.log(`  cover ok (${Math.round(data.length / 1024)} KB)`);
      } else {
        console.log('  cover missing — placeholder will show');
      }
    } catch (err) {
      console.log(`  cover failed (${err.message}) — placeholder will show`);
    }
  }
  console.log('Done.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
