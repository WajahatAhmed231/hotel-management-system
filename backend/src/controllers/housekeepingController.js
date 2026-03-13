const { query } = require('../config/db');

// GET /api/housekeeping
const getTasks = async (req, res) => {
  try {
    const { state, date } = req.query;
    let sql = `
      SELECT ht.*, r.room_number, r.floor, r.status AS room_status,
             u.name AS assigned_to_name
      FROM housekeeping_tasks ht
      LEFT JOIN rooms r ON ht.room_id = r.id
      LEFT JOIN users u ON ht.assigned_to = u.id
      WHERE 1=1
    `;
    const params = [];
    if (state) { params.push(state); sql += ` AND ht.cleaning_state = $${params.length}`; }
    if (date)  { params.push(date);  sql += ` AND ht.scheduled_date = $${params.length}`; }
    sql += ' ORDER BY ht.priority DESC, ht.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/housekeeping
const createTask = async (req, res) => {
  try {
    const { room_id, assigned_to, priority, notes, scheduled_date } = req.body;
    if (!room_id) return res.status(400).json({ error: 'room_id required' });
    const result = await query(
      `INSERT INTO housekeeping_tasks (room_id, assigned_to, priority, notes, scheduled_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [room_id, assigned_to, priority || 1, notes, scheduled_date || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/housekeeping/:id
const updateTask = async (req, res) => {
  try {
    const { cleaning_state, assigned_to, notes, reported_issue } = req.body;
    const completed_at = cleaning_state === 'clean' ? 'NOW()' : null;

    const result = await query(
      `UPDATE housekeeping_tasks SET
         cleaning_state = COALESCE($1, cleaning_state),
         assigned_to = COALESCE($2, assigned_to),
         notes = COALESCE($3, notes),
         reported_issue = COALESCE($4, reported_issue),
         completed_at = CASE WHEN $1 = 'clean' THEN NOW() ELSE completed_at END,
         updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [cleaning_state, assigned_to, notes, reported_issue, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });

    // Update room status when cleaning is done
    if (cleaning_state === 'clean') {
      await query(
        `UPDATE rooms SET status = 'available', updated_at = NOW() WHERE id = $1`,
        [result.rows[0].room_id]
      );
    } else if (cleaning_state === 'in_progress') {
      await query(
        `UPDATE rooms SET status = 'cleaning', updated_at = NOW() WHERE id = $1`,
        [result.rows[0].room_id]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/housekeeping/staff  - housekeeping staff list
const getHousekeepingStaff = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, phone FROM users WHERE role = 'housekeeping' AND is_active = true ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getTasks, createTask, updateTask, getHousekeepingStaff };
