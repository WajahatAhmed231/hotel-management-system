const { query } = require('../config/db');

// POST /api/billing/invoices  - create invoice for a reservation
const createInvoice = async (req, res) => {
  try {
    const { reservation_id, additional_items, discount_amount, tax_rate } = req.body;
    if (!reservation_id) return res.status(400).json({ error: 'reservation_id required' });

    const resResult = await query(
      `SELECT res.*, r.price_per_night, g.id AS guest_id
       FROM reservations res
       JOIN rooms r ON res.room_id = r.id
       JOIN guests g ON res.guest_id = g.id
       WHERE res.id = $1`,
      [reservation_id]
    );
    if (!resResult.rows.length) return res.status(404).json({ error: 'Reservation not found' });
    const reservation = resResult.rows[0];

    const nights = Math.ceil(
      (new Date(reservation.check_out_date) - new Date(reservation.check_in_date)) / (1000 * 60 * 60 * 24)
    );
    const roomCharge = nights * parseFloat(reservation.price_per_night);

    const taxR = tax_rate !== undefined ? tax_rate : 0.10;
    const discount = discount_amount || 0;
    let subtotal = roomCharge;

    const items = [
      { description: `Room ${reservation.room_number || ''} - ${nights} night(s)`, quantity: nights, unit_price: reservation.price_per_night, total_price: roomCharge }
    ];

    if (additional_items) {
      for (const item of additional_items) {
        const total = item.quantity * item.unit_price;
        items.push({ ...item, total_price: total });
        subtotal += total;
      }
    }

    const tax_amount = (subtotal - discount) * taxR;
    const total_amount = subtotal - discount + tax_amount;

    const invoiceResult = await query(
      `INSERT INTO invoices (reservation_id, guest_id, subtotal, tax_rate, tax_amount, discount_amount, total_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [reservation_id, reservation.guest_id, subtotal, taxR, tax_amount, discount, total_amount]
    );
    const invoice = invoiceResult.rows[0];

    for (const item of items) {
      await query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES ($1,$2,$3,$4,$5)`,
        [invoice.id, item.description, item.quantity, item.unit_price, item.total_price]
      );
    }
    res.status(201).json({ ...invoice, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/billing/invoices/:id
const getInvoice = async (req, res) => {
  try {
    const invoice = await query(
      `SELECT inv.*, g.first_name, g.last_name, g.email, g.phone,
              res.check_in_date, res.check_out_date, r.room_number
       FROM invoices inv
       LEFT JOIN guests g ON inv.guest_id = g.id
       LEFT JOIN reservations res ON inv.reservation_id = res.id
       LEFT JOIN rooms r ON res.room_id = r.id
       WHERE inv.id = $1`,
      [req.params.id]
    );
    if (!invoice.rows.length) return res.status(404).json({ error: 'Invoice not found' });

    const items = await query('SELECT * FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    const payments = await query('SELECT * FROM payments WHERE invoice_id = $1', [req.params.id]);
    res.json({ ...invoice.rows[0], items: items.rows, payments: payments.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/billing/invoices
const getInvoices = async (req, res) => {
  try {
    const result = await query(
      `SELECT inv.*, g.first_name, g.last_name, r.room_number
       FROM invoices inv
       LEFT JOIN guests g ON inv.guest_id = g.id
       LEFT JOIN reservations res ON inv.reservation_id = res.id
       LEFT JOIN rooms r ON res.room_id = r.id
       ORDER BY inv.issued_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/billing/payments
const recordPayment = async (req, res) => {
  try {
    const { invoice_id, amount, method, reference_number, notes } = req.body;
    if (!invoice_id || !amount || !method)
      return res.status(400).json({ error: 'invoice_id, amount, method required' });

    const payment = await query(
      `INSERT INTO payments (invoice_id, amount, method, reference_number, notes, processed_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [invoice_id, amount, method, reference_number, notes, req.user.id]
    );

    // Check total paid vs invoice total
    const totals = await query(
      `SELECT inv.total_amount, COALESCE(SUM(p.amount),0) AS total_paid
       FROM invoices inv
       LEFT JOIN payments p ON p.invoice_id = inv.id
       WHERE inv.id = $1 GROUP BY inv.total_amount`,
      [invoice_id]
    );
    if (totals.rows.length) {
      const { total_amount, total_paid } = totals.rows[0];
      const newStatus = parseFloat(total_paid) >= parseFloat(total_amount) ? 'paid' : 'partial';
      await query('UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, invoice_id]);
    }
    res.status(201).json(payment.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createInvoice, getInvoice, getInvoices, recordPayment };
