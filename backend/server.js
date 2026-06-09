require('dotenv').config();
const express = require('express');
const path = require('path');
const EventEmitter = require('events');
const apiRoutes = require('./routes/api');
const seedDatabase = require('./database/seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Create SSE emitter
const sseEmitter = new EventEmitter();
app.set('sseEmitter', sseEmitter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// SSE Event Stream for real-time status updates & owner alerts
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Send headers to establish stream

  // Event handlers
  const onNewOrder = (order) => {
    res.write(`data: ${JSON.stringify({ type: 'new-order', order })}\n\n`);
  };

  const onOrderUpdated = (order) => {
    res.write(`data: ${JSON.stringify({ type: 'order-updated', order })}\n\n`);
  };

  // Listen to events
  sseEmitter.on('new-order', onNewOrder);
  sseEmitter.on('order-updated', onOrderUpdated);

  // Clean up when connection closes
  req.on('close', () => {
    sseEmitter.off('new-order', onNewOrder);
    sseEmitter.off('order-updated', onOrderUpdated);
    res.end();
  });
});

// API Routes
app.use('/api', apiRoutes);

// Fallback to customer home for frontend routing or 404
app.use((req, res, next) => {
  if (req.accepts('html') && !req.url.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ success: false, message: 'Resource not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize database & seed menu items, then start server
try {
  // Run seed database to ensure tables are initialized
  seedDatabase();
  
  app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(`  Smart Fast Food Ordering System Running Successfully  `);
    console.log(`  - Customer App: http://localhost:${PORT}             `);
    console.log(`  - Owner Dashboard: http://localhost:${PORT}/admin/    `);
    console.log(`========================================================`);
  });
} catch (error) {
  console.error('Failed to start server:', error.message);
}
