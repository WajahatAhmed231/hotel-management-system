const { query } = require('../config/db');

// GET /api/reservations
const getReservations = async (req, res) => {
  try {
    const { status, date, guest_id } = req.query;
    let sql = `
      SELECT res.*, 
        g.first_name, g.last_name, g.phone, g.email,
        r.room_number, r.floor,
        rt.name AS room_type
      FROM reservations res
      LEFT JOIN guests g ON res.guest_id = g.id
      LEFT JOIN rooms r ON res.room_id = r.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE 1=1
    `;
    const params = [];
    if (status)   { params.push(status);   sql += ` AND res.status = $${params.length}`; }
    if (guest_id) { params.push(guest_id); sql += ` AND res.guest_id = $${params.length}`; }
    if (date)     { params.push(date);     sql += ` AND res.check_in_date = $${params.length}`; }
    sql += ' ORDER BY res.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/reservations/:id
const getReservation = async (req, res) => {
  try {
    const result = await query(
      `SELECT res.*, 
         g.first_name, g.last_name, g.phone, g.email, g.id_number,
         r.room_number, r.floor, r.price_per_night,
         rt.name AS room_type
       FROM reservations res
       LEFT JOIN guests g ON res.guest_id = g.id
       LEFT JOIN rooms r ON res.room_id = r.id
       LEFT JOIN room_types rt ON r.room_type_id = rt.id
       WHERE res.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Reservation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/reservations
const createReservation = async (req, res) => {
  try {
    const { guest_id, room_id, check_in_date, check_out_date, num_guests, special_requests } = req.body;
    if (!guest_id || !room_id || !check_in_date || !check_out_date)
      return res.status(400).json({ error: 'guest_id, room_id, check_in_date, check_out_date required' });

    // Check room availability
    const conflict = await query(
      `SELECT id FROM reservations
       WHERE room_id = $1 AND status NOT IN ('cancelled','completed')
       AND check_in_date < $3 AND check_out_date > $2`,
      [room_id, check_in_date, check_out_date]
    );
    if (conflict.rows.length)
      return res.status(409).json({ error: 'Room is not available for the selected dates' });

    const result = await query(
      `INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, num_guests, special_requests, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed') RETURNING *`,
      [guest_id, room_id, check_in_date, check_out_date, num_guests || 1, special_requests, req.user.id]
    );
    // Update room status to reserved
    await query(`UPDATE rooms SET status = 'reserved', updated_at = NOW() WHERE id = $1`, [room_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/reservations/:id
const updateReservation = async (req, res) => {
  try {
    const { check_in_date, check_out_date, num_guests, status, special_requests } = req.body;
    const result = await query(
      `UPDATE reservations SET
         check_in_date = COALESCE($1, check_in_date),
         check_out_date = COALESCE($2, check_out_date),
         num_guests = COALESCE($3, num_guests),
         status = COALESCE($4, status),
         special_requests = COALESCE($5, special_requests),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [check_in_date, check_out_date, num_guests, status, special_requests, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Reservation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/reservations/:id/checkin
const checkIn = async (req, res) => {
  try {
    const res_result = await query('SELECT * FROM reservations WHERE id = $1', [req.params.id]);
    const reservation = res_result.rows[0];
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    if (reservation.status !== 'confirmed')
      return res.status(400).json({ error: 'Reservation must be confirmed to check in' });

    await query(
      `UPDATE reservations SET status = 'checked_in', actual_check_in = NOW(), updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    await query(`UPDATE rooms SET status = 'occupied', updated_at = NOW() WHERE id = $1`, [reservation.room_id]);
    res.json({ message: 'Check-in successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/reservations/:id/checkout
const checkOut = async (req, res) => {
  try {
    const res_result = await query('SELECT * FROM reservations WHERE id = $1', [req.params.id]);
    const reservation = res_result.rows[0];
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    if (reservation.status !== 'checked_in')
      return res.status(400).json({ error: 'Guest must be checked in to check out' });

    await query(
      `UPDATE reservations SET status = 'completed', actual_check_out = NOW(), updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    await query(`UPDATE rooms SET status = 'cleaning', updated_at = NOW() WHERE id = $1`, [reservation.room_id]);

    // Create housekeeping task
    await query(
      `INSERT INTO housekeeping_tasks (room_id, cleaning_state, notes) VALUES ($1, 'dirty', 'Room vacated, requires cleaning')`,
      [reservation.room_id]
    );
    res.json({ message: 'Check-out successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/reservations/today
const getTodayActivity = async (req, res) => {
  try {
    const checkins = await query(
      `SELECT res.*, g.first_name, g.last_name, r.room_number
       FROM reservations res
       JOIN guests g ON res.guest_id = g.id
       JOIN rooms r ON res.room_id = r.id
       WHERE res.check_in_date = CURRENT_DATE AND res.status = 'confirmed'`
    );
    const checkouts = await query(
      `SELECT res.*, g.first_name, g.last_name, r.room_number
       FROM reservations res
       JOIN guests g ON res.guest_id = g.id
       JOIN rooms r ON res.room_id = r.id
       WHERE res.check_out_date = CURRENT_DATE AND res.status = 'checked_in'`
    );
    res.json({ check_ins: checkins.rows, check_outs: checkouts.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getReservations, getReservation, createReservation, updateReservation, checkIn, checkOut, getTodayActivity };
