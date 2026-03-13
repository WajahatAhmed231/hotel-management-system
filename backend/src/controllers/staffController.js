const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

// GET /api/staff
const getStaff = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/staff/:id
const getStaffMember = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Staff member not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/staff/:id
const updateStaff = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const result = await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         role = COALESCE($4, role),
         updated_at = NOW()
       WHERE id = $5 RETURNING id, name, email, role, phone, is_active`,
      [name, email, phone, role, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Staff member not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/staff/:id/deactivate
const deactivateStaff = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    await query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ message: 'Account deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/staff/:id/activate
const activateStaff = async (req, res) => {
  try {
    await query('UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ message: 'Account activated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getStaff, getStaffMember, updateStaff, deactivateStaff, activateStaff };
