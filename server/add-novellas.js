// Adds the Cosmere novellas from the canonical reading order to the catalog DB
// (idempotent — safe to re-run). Fractional series_order slots each novella
// into its series' reading sequence. Run once, then `npm run data` to re-bake.
//   node server/add-novellas.js
const https = require('https');
const http = require('http');
const { getDb } = require('./db');

const db = getDb();

// series_id: 1 Stormlight · 2 Mistborn Era 1 · 4 Elantris
const NOVELLAS = [
  {
    title: 'The Emperor\'s Soul',
    series_id: 4, series_order: 2, published_year: 2012, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/9781616960926-L.jpg?default=false',
    synopsis: 'Condemned to death after being caught forging a priceless masterpiece, the Forger Shai is offered one impossible reprieve: to reforge the soul of the Emperor, whose mind was destroyed in an assassination attempt. Locked in a room with a hundred days to master a stamp that could rewrite a man, she must outwit the arbiters who mean to execute her the moment her work is done.',
    characters: [
      ['Shai', 'A master Forger who rewrites the history of objects — and souls — with carved soulstamps, playing for her life.'],
      ['Gaotona', 'An elderly, honourable arbiter who oversees Shai\'s work and slowly comes to respect her artistry.'],
      ['Emperor Ashravan', 'The incapacitated Emperor of the Rose Empire, whose soul Shai must reconstruct from history and guesswork.'],
    ],
    places: [
      ['The Rose Palace', 'The seat of the Rose Empire on Sel, where Shai labours under guard in a sealed room.'],
    ],
  },
  {
    title: 'Edgedancer',
    series_id: 1, series_order: 2.5, published_year: 2016, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/9781473224612-L.jpg?default=false',
    synopsis: 'The irrepressible young Radiant Lift arrives in the great city of Yeddaw chasing free food and a mystery, only to find someone is hunting people with budding powers like her own. With the Herald Nale on her trail, Lift must decide what kind of person — and what kind of hero — she wants to become.',
    characters: [
      ['Lift', 'A ten-year-old (forever) street thief and Edgedancer who slides on Stormlight and refuses to grow up.'],
      ['Wyndle', 'Lift\'s fretful Cultivationspren, a vine of translucent crystal who would really rather she stopped causing trouble.'],
      ['Nale', 'A Herald and cold, lawful Skybreaker hunting fledgling Surgebinders across Roshar.'],
    ],
    places: [
      ['Yeddaw', 'A trench-city in Tashikk, carved below ground level, where Lift hides among the crowds.'],
    ],
  },
  {
    title: 'Dawnshard',
    series_id: 1, series_order: 3.5, published_year: 2020, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/9781938570223-L.jpg?default=false',
    synopsis: 'When a ghost ship is found adrift, the Thaylen ship-owner Rysn and the crew of the Wandersail sail for the forbidden, deadly island of Aimia to uncover what befell it — and stumble onto a secret, the Dawnshard, powerful enough to reshape the war for Roshar.',
    characters: [
      ['Rysn Ftori', 'A young, wheelchair-using Thaylen merchant and ship-owner with a rare pet larkin named Chiri-Chiri.'],
      ['Lopen', 'The irrepressible, one-armed (then two-armed) Herdazian Windrunner whose jokes never miss.'],
      ['Cord', 'A Horneater archer and daughter of Rock of Bridge Four, seeking her own path.'],
    ],
    places: [
      ['Aimia', 'A shattered, forbidden island shrouded in deadly protections and older secrets.'],
    ],
  },
  {
    title: 'Mistborn: Secret History',
    series_id: 2, series_order: 3.5, published_year: 2016, cosmere: 1,
    cover_url: 'https://covers.openlibrary.org/b/isbn/9781944173234-L.jpg?default=false',
    synopsis: 'A hidden tale threaded through the original Mistborn trilogy, following Kelsier after the fall of the Final Empire as he refuses to let death be the end. It pulls back the curtain on the deepest mechanics of the cosmere — and should only be read once you know the Survivor\'s story, and Roshar\'s, well.',
    characters: [
      ['Kelsier', 'The Survivor of Hathsin, who meets his end and then simply declines to accept it.'],
      ['Leras (Preservation)', 'The dying Shard of Preservation, whose fading mind shapes Scadrial\'s fate.'],
      ['Ati (Ruin)', 'The Shard of Ruin, patient and inexorable, working toward the world\'s unmaking.'],
    ],
    places: [
      ['The Cognitive Realm', 'The realm of thought and Shadesmar, where the dead may yet linger and the Shards contend.'],
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
  const fs = require('fs');
  const path = require('path');
  const COVERS = path.join(__dirname, '..', 'client', 'public', 'covers');
  fs.mkdirSync(COVERS, { recursive: true });

  for (const n of NOVELLAS) {
    const existing = await get('SELECT id FROM books WHERE title = ?', [n.title]);
    let id;
    if (existing) {
      id = existing.id;
      await run('UPDATE books SET series_id=?, series_order=?, published_year=?, synopsis=?, cover_url=?, cosmere=? WHERE id=?',
        [n.series_id, n.series_order, n.published_year, n.synopsis, n.cover_url, n.cosmere, id]);
      console.log(`Updated "${n.title}" (id ${id})`);
    } else {
      const res = await run('INSERT INTO books (title, series_id, series_order, published_year, synopsis, cover_url, cosmere) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [n.title, n.series_id, n.series_order, n.published_year, n.synopsis, n.cover_url, n.cosmere]);
      id = res.lastID;
      for (const [name, desc] of n.characters) {
        await run('INSERT INTO characters (book_id, name, description) VALUES (?, ?, ?)', [id, name, desc]);
      }
      for (const [name, desc] of n.places) {
        await run('INSERT INTO places (book_id, name, description, type) VALUES (?, ?, ?, ?)', [id, name, desc, 'landmark']);
      }
      console.log(`Inserted "${n.title}" (id ${id})`);
    }

    // Fetch cover to covers/<id>.jpg; a placeholder shows if this fails
    try {
      const data = await fetchFollowRedirects(n.cover_url);
      if (data && data.length > 2000) {
        fs.writeFileSync(path.join(COVERS, `${id}.jpg`), data);
        console.log(`  cover ok (${Math.round(data.length / 1024)} KB)`);
      } else {
        console.log('  cover missing — placeholder will show');
      }
    } catch (e) {
      console.log(`  cover failed (${e.message}) — placeholder will show`);
    }
  }
  console.log('Done.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
