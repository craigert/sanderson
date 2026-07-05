const express = require('express');
const cors = require('cors');
const { initDb, dbAll } = require('./db');
const booksRouter = require('./routes/books');
const seriesRouter = require('./routes/series');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/books', booksRouter);
app.use('/api/series', seriesRouter);

// Lightweight search index: every character and place with its book id, so the
// command palette can search names without fetching each book's details.
app.get('/api/index', async (req, res) => {
  try {
    const [characters, places] = await Promise.all([
      dbAll('SELECT name, book_id FROM characters'),
      dbAll('SELECT name, book_id, type FROM places'),
    ]);
    res.json({ characters, places });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDb();

app.listen(PORT, () => {
  console.log(`Sanderson Catalog API running on port ${PORT}`);
});
