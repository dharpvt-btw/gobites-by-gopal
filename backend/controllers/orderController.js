const dbService = require('../services/dbService');
const notificationService = require('../services/notificationService');

const orderController = {
  // Place a new order
  async createOrder(req, res) {
    try {
      const { customerName, phoneNumber, customerAddress, specialInstructions, items } = req.body;

      // Form validation
      if (!customerName || customerName.trim() === '') {
        return res.status(400).json({ success: false, message: 'Customer name is required.' });
      }
      if (!phoneNumber || phoneNumber.trim() === '') {
        return res.status(400).json({ success: false, message: 'Phone number is required.' });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart cannot be empty.' });
      }

      // Check quantities
      for (const item of items) {
        if (!item.food_id || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({ success: false, message: 'Invalid item selection or quantity.' });
        }
      }

      // Create order in SQLite
      const createdOrderSummary = await dbService.createOrder({
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        customerAddress: customerAddress ? customerAddress.trim() : null,
        specialInstructions: specialInstructions ? specialInstructions.trim() : null,
        items
      });

      // Get complete order with item details
      const fullOrder = await dbService.getOrderById(createdOrderSummary.order_id);

      // Trigger asynchronous notifications
      // 1. WhatsApp / SMS Alert to Owner
      notificationService.notifyOwnerNewOrder(fullOrder).catch(console.error);

      // 2. Confirmation SMS to Customer
      notificationService.notifyCustomerOrderReceived(fullOrder).catch(console.error);

      // 3. Emit SSE Event for Live Dashboard Update
      const sseEmitter = req.app.get('sseEmitter');
      if (sseEmitter) {
        sseEmitter.emit('new-order', fullOrder);
      }

      res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        order: fullOrder
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to place order.',
        error: err.message
      });
    }
  },

  // Get single order for tracking
  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await dbService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: `Order #${id} not found.` });
      }
      res.json({ success: true, order });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve order.',
        error: err.message
      });
    }
  },

  // Update order status (Admin operation)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required.' });
      }

      const updatedOrder = await dbService.updateOrderStatus(id, status, reason);

      // Trigger notifications based on new status
      if (status === 'Ready') {
        notificationService.notifyCustomerOrderReady(updatedOrder).catch(console.error);
      }

      // Emit SSE Event for real-time customer timeline and admin updates
      const sseEmitter = req.app.get('sseEmitter');
      if (sseEmitter) {
        sseEmitter.emit('order-updated', updatedOrder);
      }

      res.json({
        success: true,
        message: `Order status updated to ${status}.`,
        order: updatedOrder
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to update order status.',
        error: err.message
      });
    }
  },

  // List orders (Admin queue)
  async getOrdersList(req, res) {
    try {
      const { search, status } = req.query;
      const orders = await dbService.getOrders({ search, status });
      res.json({ success: true, orders });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve orders list.',
        error: err.message
      });
    }
  },

  // Submit order feedback
  async submitFeedback(req, res) {
    try {
      const { id } = req.params;
      const { rating, taste, service, quality, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating between 1 and 5 is required.' });
      }

      const feedbackId = await dbService.submitFeedback(id, { rating, taste, service, quality, comment });
      res.json({ success: true, message: 'Feedback submitted successfully!', feedbackId });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback.',
        error: err.message
      });
    }
  }
};

module.exports = orderController;
