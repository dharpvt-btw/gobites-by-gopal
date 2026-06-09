const express = require('express');
const router = express.Router();

const menuController = require('../controllers/menuController');
const orderController = require('../controllers/orderController');
const reportController = require('../controllers/reportController');

// Menu routes
router.get('/menu', menuController.getMenu);
router.get('/menu/:id', menuController.getFood);
router.post('/admin/menu', menuController.addMenuItem);
router.put('/admin/menu/:id', menuController.updateMenuItem);
router.delete('/admin/menu/:id', menuController.deleteMenuItem);
router.post('/admin/menu/upload', menuController.uploadImage);

// Order routes
router.post('/orders', orderController.createOrder);
router.get('/orders/:id', orderController.getOrder);
router.post('/orders/:id/feedback', orderController.submitFeedback);

// Admin Order Operations routes
router.get('/admin/orders', orderController.getOrdersList);
router.put('/admin/orders/:id/status', orderController.updateStatus);

// Admin Reporting & Stats routes
router.get('/admin/stats', reportController.getDashboardStats);
router.get('/admin/reports/daily', reportController.getDaily);
router.get('/admin/reports/weekly', reportController.getWeekly);
router.get('/admin/reports/monthly', reportController.getMonthly);
router.get('/admin/notifications', reportController.getNotificationLogs);
router.get('/admin/feedback/stats', reportController.getFeedbackStats);

module.exports = router;
