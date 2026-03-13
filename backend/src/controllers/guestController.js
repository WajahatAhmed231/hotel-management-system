const { query } = require('../config/db');

// GET /api/guests
const getGuests = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM guests WHERE 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)`;
    }
    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/guests/:id
const getGuest = async (req, res) => {
  try {
    const guest = await query('SELECT * FROM guests WHERE id = $1', [req.params.id]);
    if (!guest.rows.length) return res.status(404).json({ error: 'Guest not found' });

    const reservations = await query(
      `SELECT r.*, rm.room_number FROM reservations r
       LEFT JOIN rooms rm ON r.room_id = rm.id
       WHERE r.guest_id = $1 ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json({ ...guest.rows[0], reservations: reservations.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/guests
const createGuest = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, id_type, id_number, nationality, notes } = req.body;
    if (!first_name || !last_name || !phone)
      return res.status(400).json({ error: 'first_name, last_name, phone required' });

    const result = await query(
      `INSERT INTO guests (first_name, last_name, email, phone, address, id_type, id_number, nationality, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [first_name, last_name, email, phone, address, id_type, id_number, nationality, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/guests/:id
const updateGuest = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, id_type, id_number, nationality, notes } = req.body;
    const result = await query(
      `UPDATE guests SET
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         email = COALESCE($3, email),
         phone = COALESCE($4, phone),
         address = COALESCE($5, address),
         id_type = COALESCE($6, id_type),
         id_number = COALESCE($7, id_number),
         nationality = COALESCE($8, nationality),
         notes = COALESCE($9, notes),
         updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [first_name, last_name, email, phone, address, id_type, id_number, nationality, notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Guest not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getGuests, getGuest, createGuest, updateGuest };
