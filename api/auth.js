const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { action, passcode, new_passcode, token } = req.body;

    // Action: Login and generate JWT
    if (action === 'login') {
      const { rows } = await pool.query("SELECT key_value FROM settings WHERE key_name = 'admin_passcode'");
      if (rows[0].key_value === passcode) {
        const signedToken = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '2h' });
        return res.status(200).json({ token: signedToken });
      }
      return res.status(401).json({ error: 'Invalid passcode' });
    }

    // Action: Change CMS Key
    if (action === 'change_key') {
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        await pool.query("UPDATE settings SET key_value = $1 WHERE key_name = 'admin_passcode'", [new_passcode]);
        return res.status(200).json({ message: 'CMS Key updated successfully.' });
      } catch (err) {
        return res.status(403).json({ error: 'Unauthorized to change key.' });
      }
    }
  }
}
