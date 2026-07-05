const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../db');

// GET / - returns all series
router.get('/', async (req, res) => {
  try {
    const series = await dbAll('SELECT * FROM series ORDER BY id ASC');
    res.json(series);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id - returns a series with its books
router.get('/:id', async (req, res) => {
  try {
    const series = await dbGet('SELECT * FROM series WHERE id = ?', [req.params.id]);
    if (!series) return res.status(404).json({ error: 'Series not found' });

    const books = await dbAll(
      'SELECT * FROM books WHERE series_id = ? ORDER BY series_order ASC',
      [req.params.id]
    );

    res.json({ ...series, books });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
