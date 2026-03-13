const { query } = require('../config/db');

// GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const [rooms, occupancy, todayCheckIns, todayCheckOuts, revenue] = await Promise.all([
      query('SELECT COUNT(*) AS total, status FROM rooms GROUP BY status'),
      query(`SELECT COUNT(*) AS occupied FROM rooms WHERE status = 'occupied'`),
      query(`SELECT COUNT(*) FROM reservations WHERE check_in_date = CURRENT_DATE AND status = 'confirmed'`),
      query(`SELECT COUNT(*) FROM reservations WHERE check_out_date = CURRENT_DATE AND status = 'checked_in'`),
      query(`SELECT COALESCE(SUM(amount),0) AS today FROM payments WHERE DATE(paid_at) = CURRENT_DATE`),
    ]);

    const roomStats = {};
    rooms.rows.forEach(r => { roomStats[r.status] = parseInt(r.total); });
    const total_rooms = Object.values(roomStats).reduce((a, b) => a + b, 0);

    res.json({
      rooms: { ...roomStats, total: total_rooms },
      today_check_ins: parseInt(todayCheckIns.rows[0].count),
      today_check_outs: parseInt(todayCheckOuts.rows[0].count),
      revenue_today: parseFloat(revenue.rows[0].today),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/reports/occupancy?start=&end=
const occupancyReport = async (req, res) => {
  try {
    const { start, end } = req.query;
    const result = await query(
      `SELECT 
         DATE(check_in_date) AS date,
         COUNT(*) AS reservations,
         COUNT(DISTINCT room_id) AS rooms_occupied
       FROM reservations
       WHERE status IN ('checked_in','completed')
       AND check_in_date >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
       AND check_in_date <= COALESCE($2::date, CURRENT_DATE)
       GROUP BY DATE(check_in_date)
       ORDER BY date`,
      [start, end]
    );
    const totalRooms = await query('SELECT COUNT(*) FROM rooms');
    res.json({ data: result.rows, total_rooms: parseInt(totalRooms.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/reports/revenue?start=&end=
const revenueReport = async (req, res) => {
  try {
    const { start, end } = req.query;
    const result = await query(
      `SELECT 
         DATE(paid_at) AS date,
         SUM(amount) AS total,
         COUNT(*) AS transactions,
         method
       FROM payments
       WHERE paid_at >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
       AND paid_at <= COALESCE($2::date, CURRENT_DATE + INTERVAL '1 day')
       GROUP BY DATE(paid_at), method
       ORDER BY date`,
      [start, end]
    );
    const totals = await query(
      `SELECT COALESCE(SUM(amount),0) AS total, method FROM payments
       WHERE paid_at >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
       AND paid_at <= COALESCE($2::date, CURRENT_DATE + INTERVAL '1 day')
       GROUP BY method`,
      [start, end]
    );
    res.json({ data: result.rows, summary: totals.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/reports/bookings?start=&end=
const bookingReport = async (req, res) => {
  try {
    const { start, end } = req.query;
    const result = await query(
      `SELECT res.*, g.first_name, g.last_name, r.room_number
       FROM reservations res
       JOIN guests g ON res.guest_id = g.id
       JOIN rooms r ON res.room_id = r.id
       WHERE res.created_at >= COALESCE($1::date, CURRENT_DATE - INTERVAL '30 days')
       AND res.created_at <= COALESCE($2::date, CURRENT_DATE + INTERVAL '1 day')
       ORDER BY res.created_at DESC`,
      [start, end]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getDashboard, occupancyReport, revenueReport, bookingReport };
