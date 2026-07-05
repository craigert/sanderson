const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../db');

const COVER_CACHE_DIR = path.join(__dirname, '..', '.cover-cache');
if (!fs.existsSync(COVER_CACHE_DIR)) fs.mkdirSync(COVER_CACHE_DIR, { recursive: true });

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
    }).on('error', reject);
  });
}

// GET /cover/:id - proxy and cache book cover images
router.get('/cover/:id', async (req, res) => {
  try {
    const book = await dbGet('SELECT cover_url FROM books WHERE id = ?', [req.params.id]);
    if (!book || !book.cover_url) return res.status(404).end();

    // Use URL hash in filename so changed URLs get re-fetched
    const urlHash = crypto.createHash('md5').update(book.cover_url).digest('hex').slice(0, 8);
    const cacheFile = path.join(COVER_CACHE_DIR, `${req.params.id}_${urlHash}.jpg`);

    if (fs.existsSync(cacheFile)) {
      res.set('Content-Type', 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(cacheFile).pipe(res);
    }

    // Clean old cache files for this book ID
    const oldFiles = fs.readdirSync(COVER_CACHE_DIR).filter(f => f.startsWith(`${req.params.id}_`));
    oldFiles.forEach(f => fs.unlinkSync(path.join(COVER_CACHE_DIR, f)));

    const data = await fetchFollowRedirects(book.cover_url);
    fs.writeFileSync(cacheFile, data);
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'no-cache');
    res.send(data);
  } catch (err) {
    res.status(502).end();
  }
});

router.get('/', async (req, res) => {
  try {
    const books = await dbAll('SELECT * FROM books ORDER BY published_year ASC');
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/details - returns a book with its characters and places
router.get('/:id/details', async (req, res) => {
  try {
    const book = await dbGet('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const characters = await dbAll(
      'SELECT id, name, description FROM characters WHERE book_id = ? ORDER BY id ASC',
      [req.params.id]
    );

    const places = await dbAll(
      'SELECT id, name, description, type FROM places WHERE book_id = ? ORDER BY id ASC',
      [req.params.id]
    );

    res.json({ ...book, characters, places });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await dbGet('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, series_id, series_order, published_year, synopsis, cover_url, cosmere } = req.body;
    const result = await dbRun(
      'INSERT INTO books (title, series_id, series_order, published_year, synopsis, cover_url, cosmere) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, series_id, series_order, published_year, synopsis, cover_url, cosmere]
    );
    res.status(201).json({ id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, series_id, series_order, published_year, synopsis, cover_url, cosmere } = req.body;
    await dbRun(
      'UPDATE books SET title=?, series_id=?, series_order=?, published_year=?, synopsis=?, cover_url=?, cosmere=? WHERE id=?',
      [title, series_id, series_order, published_year, synopsis, cover_url, cosmere, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
