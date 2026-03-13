const { query } = require('../config/db');

// GET /api/rooms
const getRooms = async (req, res) => {
  try {
    const { status, type, floor } = req.query;
    let sql = `
      SELECT r.*, rt.name AS type_name, rt.max_occupancy
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { params.push(status); sql += ` AND r.status = $${params.length}`; }
    if (floor)  { params.push(floor);  sql += ` AND r.floor = $${params.length}`; }
    if (type)   { params.push(type);   sql += ` AND rt.name = $${params.length}`; }
    sql += ' ORDER BY r.floor, r.room_number';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/rooms/:id
const getRoom = async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, rt.name AS type_name, rt.max_occupancy, rt.amenities AS type_amenities
       FROM rooms r LEFT JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/rooms
const createRoom = async (req, res) => {
  try {
    const { room_number, floor, room_type_id, price_per_night, amenities, notes } = req.body;
    if (!room_number || !floor || !room_type_id || !price_per_night)
      return res.status(400).json({ error: 'room_number, floor, room_type_id, price_per_night required' });

    const result = await query(
      `INSERT INTO rooms (room_number, floor, room_type_id, price_per_night, amenities, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [room_number, floor, room_type_id, price_per_night, JSON.stringify(amenities || []), notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Room number already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/rooms/:id
const updateRoom = async (req, res) => {
  try {
    const { room_number, floor, room_type_id, price_per_night, status, amenities, notes } = req.body;
    const result = await query(
      `UPDATE rooms SET
         room_number = COALESCE($1, room_number),
         floor = COALESCE($2, floor),
         room_type_id = COALESCE($3, room_type_id),
         price_per_night = COALESCE($4, price_per_night),
         status = COALESCE($5, status),
         amenities = COALESCE($6, amenities),
         notes = COALESCE($7, notes),
         updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [room_number, floor, room_type_id, price_per_night, status, amenities ? JSON.stringify(amenities) : null, notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/rooms/:id
const deleteRoom = async (req, res) => {
  try {
    const result = await query('DELETE FROM rooms WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/rooms/availability?check_in=&check_out=
const checkAvailability = async (req, res) => {
  try {
    const { check_in, check_out } = req.query;
    if (!check_in || !check_out)
      return res.status(400).json({ error: 'check_in and check_out dates required' });

    const result = await query(
      `SELECT r.*, rt.name AS type_name
       FROM rooms r
       LEFT JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.status NOT IN ('maintenance') AND r.id NOT IN (
         SELECT room_id FROM reservations
         WHERE status NOT IN ('cancelled', 'completed')
         AND check_in_date < $2 AND check_out_date > $1
       )
       ORDER BY r.floor, r.room_number`,
      [check_in, check_out]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/rooms/types
const getRoomTypes = async (req, res) => {
  try {
    const result = await query('SELECT * FROM room_types ORDER BY base_price');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getRooms, getRoom, createRoom, updateRoom, deleteRoom, checkAvailability, getRoomTypes };
