const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const method = req.method;

  // GET: Fetch all news
  if (method === 'GET') {
    try {
      const { rows } = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Middleware verification for POST/DELETE/PUT
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized. CMS Key required.' });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: 'Invalid CMS Key (jtwtk).' });
  }

  // POST: Create new post
  if (method === 'POST') {
    const { title, content, image_data } = req.body;
    try {
      const query = 'INSERT INTO posts (title, content, image_data) VALUES ($1, $2, $3) RETURNING *';
      const { rows } = await pool.query(query, [title, content, image_data]);
      return res.status(201).json(rows[0]);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  // DELETE: Remove post
  if (method === 'DELETE') {
    const { id } = req.body;
    try {
      await pool.query('DELETE FROM posts WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Post deleted' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete post' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
