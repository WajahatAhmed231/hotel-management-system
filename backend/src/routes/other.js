const express = require('express');

// Housekeeping
const hkRouter = express.Router();
const { getTasks, createTask, updateTask, getHousekeepingStaff } = require('../controllers/housekeepingController');
const { authenticate, authorize } = require('../middleware/auth');
hkRouter.use(authenticate);
hkRouter.get('/staff', getHousekeepingStaff);
hkRouter.get('/', getTasks);
hkRouter.post('/', authorize('admin','manager','receptionist'), createTask);
hkRouter.put('/:id', updateTask);

// Staff
const staffRouter = express.Router();
const { getStaff, getStaffMember, updateStaff, deactivateStaff, activateStaff } = require('../controllers/staffController');
staffRouter.use(authenticate);
staffRouter.get('/', authorize('admin','manager'), getStaff);
staffRouter.get('/:id', authorize('admin','manager'), getStaffMember);
staffRouter.put('/:id', authorize('admin'), updateStaff);
staffRouter.put('/:id/deactivate', authorize('admin'), deactivateStaff);
staffRouter.put('/:id/activate', authorize('admin'), activateStaff);

// Reports
const reportRouter = express.Router();
const { getDashboard, occupancyReport, revenueReport, bookingReport } = require('../controllers/reportController');
reportRouter.use(authenticate);
reportRouter.get('/dashboard', getDashboard);
reportRouter.get('/occupancy', authorize('admin','manager'), occupancyReport);
reportRouter.get('/revenue', authorize('admin','manager'), revenueReport);
reportRouter.get('/bookings', authorize('admin','manager'), bookingReport);

module.exports = { hkRouter, staffRouter, reportRouter };
