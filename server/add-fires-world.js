// Adds the "Hoid's Travails" series and attaches The Fires of December to it
// (idempotent). Run:  node server/add-fires-world.js
const { getDb } = require('./db');
const db = getDb();

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
  let series = await get('SELECT id FROM series WHERE name = ?', ["Hoid's Travails"]);
  if (!series) {
    const res = await run('INSERT INTO series (name, cosmere) VALUES (?, 1)', ["Hoid's Travails"]);
    series = { id: res.lastID };
    console.log(`Inserted series "Hoid's Travails" (id ${series.id})`);
  } else {
    console.log(`Series "Hoid's Travails" already exists (id ${series.id})`);
  }
  await run('UPDATE books SET series_id = ?, series_order = 1 WHERE title = ?', [series.id, 'The Fires of December']);
  console.log(`Attached "The Fires of December" to series ${series.id}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
