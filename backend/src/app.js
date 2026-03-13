const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const guestRoutes = require('./routes/guests');
const reservationRoutes = require('./routes/reservations');
const billingRoutes = require('./routes/billing');
const { hkRouter, staffRouter, reportRouter } = require('./routes/other');

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/housekeeping', hkRouter);
app.use('/api/staff', staffRouter);
app.use('/api/reports', reportRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 HMS Server running on port ${PORT}`));

module.exports = app;
