const db = require('../config/db');

// Utility helpers to wrap sqlite3 in promises
const query = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

const dbService = {
  // Food Menu Operations
  async getAllFoods() {
    return query.all('SELECT * FROM foods');
  },

  async getFoodById(id) {
    return query.get('SELECT * FROM foods WHERE id = ?', [id]);
  },

  // Order Operations
  async createOrder({ customerName, phoneNumber, customerAddress, specialInstructions, items }) {
    // 1. Calculate totals and prep time
    let totalPrice = 0;
    let totalItemsQuantity = 0;

    for (const item of items) {
      const food = await this.getFoodById(item.food_id);
      if (!food) {
        throw new Error(`Food item with ID ${item.food_id} not found.`);
      }
      totalPrice += food.price * item.quantity;
      totalItemsQuantity += item.quantity;
      item.price = food.price; // Attach price for storage
    }

    // Est preparation time:
    // 1-3 items = 15 mins
    // 4-6 items = 25 mins
    // 7+ items = 35 mins
    let estimatedTime = 15;
    if (totalItemsQuantity >= 4 && totalItemsQuantity <= 6) {
      estimatedTime = 25;
    } else if (totalItemsQuantity >= 7) {
      estimatedTime = 35;
    }

    // 2. Perform database transaction inserts
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION', async (err) => {
          if (err) return reject(err);

          try {
            // Insert order details
            const orderResult = await query.run(`
              INSERT INTO orders (customer_name, phone_number, customer_address, special_instructions, total_price, status, estimated_time)
              VALUES (?, ?, ?, ?, ?, 'Pending Owner Approval', ?)
            `, [customerName, phoneNumber, customerAddress || null, specialInstructions || null, totalPrice, estimatedTime]);

            const orderId = orderResult.id;

            // Insert order items
            for (const item of items) {
              await query.run(`
                INSERT INTO order_items (order_id, food_id, quantity, item_price)
                VALUES (?, ?, ?, ?)
              `, [orderId, item.food_id, item.quantity, item.price]);
            }

            db.run('COMMIT', (err) => {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }
              resolve({
                order_id: orderId,
                customer_name: customerName,
                phone_number: phoneNumber,
                customer_address: customerAddress,
                special_instructions: specialInstructions,
                total_price: totalPrice,
                status: 'Pending',
                estimated_time: estimatedTime,
                created_at: new Date().toISOString()
              });
            });
          } catch (error) {
            db.run('ROLLBACK');
            reject(error);
          }
        });
      });
    });
  },

  async getOrderById(orderId) {
    const order = await query.get('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (!order) return null;

    const items = await query.all(`
      SELECT oi.*, f.name, f.category, f.image
      FROM order_items oi
      JOIN foods f ON oi.food_id = f.id
      WHERE oi.order_id = ?
    `, [orderId]);

    order.items = items;
    return order;
  },

  async updateOrderStatus(orderId, status, reason) {
    const validStatuses = ['Pending Owner Approval', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid order status: ${status}`);
    }

    let completedAt = null;
    if (status === 'Completed' || status === 'Cancelled') {
      completedAt = new Date().toISOString();
    }

    let result;
    if (status === 'Cancelled' && reason) {
      const sql = `
        UPDATE orders
        SET status = ?, completed_at = ?, special_instructions = COALESCE(special_instructions || '\n', '') || '[Rejection Reason: ' || ? || ']'
        WHERE order_id = ?
      `;
      result = await query.run(sql, [status, completedAt, reason, orderId]);
    } else {
      const sql = `
        UPDATE orders
        SET status = ?, completed_at = ?
        WHERE order_id = ?
      `;
      result = await query.run(sql, [status, completedAt, orderId]);
    }

    if (result.changes === 0) {
      throw new Error(`Order #${orderId} not found.`);
    }

    return this.getOrderById(orderId);
  },

  async getOrders({ search, status }) {
    let sql = `
      SELECT o.*, 
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as total_items
      FROM orders o
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }

    if (search) {
      // Check if search is a potential order number
      const searchNum = parseInt(search);
      if (!isNaN(searchNum) && search.startsWith('#') || search.length >= 4 && !isNaN(search)) {
        const orderNum = !isNaN(searchNum) ? searchNum : parseInt(search.replace('#', ''));
        conditions.push('(o.order_id = ? OR o.phone_number LIKE ? OR o.customer_name LIKE ?)');
        params.push(orderNum, `%${search}%`, `%${search}%`);
      } else {
        conditions.push('(o.customer_name LIKE ? OR o.phone_number LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY o.order_id DESC';

    const orders = await query.all(sql, params);

    // Fetch items for each order in parallel
    const fullOrders = await Promise.all(orders.map(async (o) => {
      o.items = await query.all(`
        SELECT oi.*, f.name, f.category
        FROM order_items oi
        JOIN foods f ON oi.food_id = f.id
        WHERE oi.order_id = ?
      `, [o.order_id]);
      return o;
    }));

    return fullOrders;
  },

  // Dashboard Operations
  async getTodayStats() {
    const todayStr = "date('now', 'localtime')";
    
    const totalOrders = await query.get(`
      SELECT COUNT(*) as count FROM orders WHERE date(created_at, 'localtime') = ${todayStr}
    `);
    const revenue = await query.get(`
      SELECT SUM(total_price) as sum FROM orders 
      WHERE date(created_at, 'localtime') = ${todayStr} AND status != 'Cancelled'
    `);
    const pendingOrders = await query.get(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'Pending Owner Approval' OR status = 'Pending'
    `);
    const preparingOrders = await query.get(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'Preparing'
    `);
    const readyOrders = await query.get(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'Ready'
    `);
    const completedOrders = await query.get(`
      SELECT COUNT(*) as count FROM orders 
      WHERE date(created_at, 'localtime') = ${todayStr} AND status = 'Completed'
    `);
    const cancelledOrders = await query.get(`
      SELECT COUNT(*) as count FROM orders 
      WHERE date(created_at, 'localtime') = ${todayStr} AND status = 'Cancelled'
    `);

    // Top Selling Item Today
    const topItem = await query.get(`
      SELECT f.name, SUM(oi.quantity) as qty
      FROM order_items oi
      JOIN foods f ON oi.food_id = f.id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE date(o.created_at, 'localtime') = ${todayStr} AND o.status != 'Cancelled'
      GROUP BY oi.food_id
      ORDER BY qty DESC
      LIMIT 1
    `);

    // Weekly Revenue (last 7 days completed/non-cancelled orders)
    const weeklyRev = await query.get(`
      SELECT SUM(total_price) as sum FROM orders
      WHERE created_at >= date('now', '-6 days', 'localtime') AND status != 'Cancelled'
    `);

    // Monthly Revenue (last 30 days completed/non-cancelled orders)
    const monthlyRev = await query.get(`
      SELECT SUM(total_price) as sum FROM orders
      WHERE created_at >= date('now', '-29 days', 'localtime') AND status != 'Cancelled'
    `);

    // Average Order Value Today
    const avgOrderVal = await query.get(`
      SELECT AVG(total_price) as avg FROM orders
      WHERE date(created_at, 'localtime') = ${todayStr} AND status != 'Cancelled'
    `);

    // Most Ordered Category Overall
    const topCategory = await query.get(`
      SELECT f.category, SUM(oi.quantity) as qty
      FROM order_items oi
      JOIN foods f ON oi.food_id = f.id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status != 'Cancelled'
      GROUP BY f.category
      ORDER BY qty DESC
      LIMIT 1
    `);

    return {
      totalOrdersToday: totalOrders.count || 0,
      revenueToday: revenue.sum || 0,
      revenueWeekly: weeklyRev.sum || 0,
      revenueMonthly: monthlyRev.sum || 0,
      avgOrderValueToday: avgOrderVal.avg || 0,
      pendingOrdersCount: pendingOrders.count || 0,
      preparingOrdersCount: preparingOrders.count || 0,
      readyOrdersCount: readyOrders.count || 0,
      completedOrdersToday: completedOrders.count || 0,
      cancelledOrdersToday: cancelledOrders.count || 0,
      topSellingItemToday: topItem ? `${topItem.name} (${topItem.qty} sold)` : 'N/A',
      mostOrderedCategory: topCategory ? topCategory.category : 'N/A'
    };
  },

  // Reporting Operations
  async getDailyReport() {
    const stats = await this.getTodayStats();
    
    // Group completed/non-cancelled orders today by hour
    const hourlyBreakdown = await query.all(`
      SELECT strftime('%H:00', created_at, 'localtime') as date_label, 
             SUM(total_price) as revenue, 
             COUNT(*) as order_count 
      FROM orders 
      WHERE date(created_at, 'localtime') = date('now', 'localtime') AND status != 'Cancelled'
      GROUP BY date_label
      ORDER BY date_label ASC
    `);

    // Detailed list of today's orders
    const todayOrders = await this.getOrders({ search: null, status: null });
    const filteredToday = todayOrders.filter(o => {
      const orderDate = new Date(o.created_at).toLocaleDateString();
      const todayDate = new Date().toLocaleDateString();
      return orderDate === todayDate;
    });

    return {
      summary: {
        totalOrders: stats.totalOrdersToday,
        revenue: stats.revenueToday,
        pending: stats.pendingOrdersCount,
        completed: stats.completedOrdersToday,
        cancelled: stats.cancelledOrdersToday,
        bestSellingFood: stats.topSellingItemToday
      },
      orders: filteredToday,
      dailyBreakdown: hourlyBreakdown
    };
  },

  async getWeeklyReport() {
    // Past 7 days daily revenue & order count
    const dailyStats = await query.all(`
      SELECT date(created_at, 'localtime') as date_label, 
             SUM(total_price) as revenue, 
             COUNT(*) as order_count 
      FROM orders 
      WHERE created_at >= date('now', '-6 days', 'localtime') AND status != 'Cancelled'
      GROUP BY date_label
      ORDER BY date_label ASC
    `);

    // Top Selling Foods this week
    const topFoods = await query.all(`
      SELECT f.name, SUM(oi.quantity) as total_quantity, SUM(oi.quantity * oi.item_price) as total_revenue, f.category
      FROM order_items oi
      JOIN foods f ON oi.food_id = f.id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.created_at >= date('now', '-6 days', 'localtime') AND o.status != 'Cancelled'
      GROUP BY oi.food_id
      ORDER BY total_quantity DESC
      LIMIT 5
    `);

    // Calculate totals
    let totalRevenue = 0;
    let totalOrders = 0;
    dailyStats.forEach(d => {
      totalRevenue += d.revenue || 0;
      totalOrders += d.order_count || 0;
    });

    return {
      summary: {
        weeklyRevenue: totalRevenue,
        weeklyOrders: totalOrders,
        bestSellingFoods: topFoods
      },
      dailyBreakdown: dailyStats
    };
  },

  async getMonthlyReport() {
    // Past 30 days daily stats
    const dailyStats = await query.all(`
      SELECT date(created_at, 'localtime') as date_label, 
             SUM(total_price) as revenue, 
             COUNT(*) as order_count 
      FROM orders 
      WHERE created_at >= date('now', '-29 days', 'localtime') AND status != 'Cancelled'
      GROUP BY date_label
      ORDER BY date_label ASC
    `);

    // Top Selling Foods this month
    const topFoods = await query.all(`
      SELECT f.name, SUM(oi.quantity) as total_quantity, SUM(oi.quantity * oi.item_price) as total_revenue, f.category
      FROM order_items oi
      JOIN foods f ON oi.food_id = f.id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.created_at >= date('now', '-29 days', 'localtime') AND o.status != 'Cancelled'
      GROUP BY oi.food_id
      ORDER BY total_quantity DESC
      LIMIT 5
    `);

    // Calculate Growth Trends compared to prior 30 days (days -60 to -30)
    const current30Stats = await query.get(`
      SELECT SUM(total_price) as revenue, COUNT(*) as orders
      FROM orders
      WHERE created_at >= date('now', '-29 days', 'localtime') AND status != 'Cancelled'
    `);

    const prior30Stats = await query.get(`
      SELECT SUM(total_price) as revenue, COUNT(*) as orders
      FROM orders
      WHERE created_at >= date('now', '-59 days', 'localtime') 
        AND created_at < date('now', '-29 days', 'localtime')
        AND status != 'Cancelled'
    `);

    const currentRev = current30Stats.revenue || 0;
    const priorRev = prior30Stats.revenue || 0;
    const currentOrd = current30Stats.orders || 0;
    const priorOrd = prior30Stats.orders || 0;

    let revenueGrowthPercent = 0;
    if (priorRev > 0) {
      revenueGrowthPercent = ((currentRev - priorRev) / priorRev) * 100;
    } else if (currentRev > 0) {
      revenueGrowthPercent = 100; // 100% growth if starting from zero
    }

    let ordersGrowthPercent = 0;
    if (priorOrd > 0) {
      ordersGrowthPercent = ((currentOrd - priorOrd) / priorOrd) * 100;
    } else if (currentOrd > 0) {
      ordersGrowthPercent = 100;
    }

    return {
      summary: {
        monthlyRevenue: currentRev,
        monthlyOrders: currentOrd,
        revenueGrowth: parseFloat(revenueGrowthPercent.toFixed(1)),
        ordersGrowth: parseFloat(ordersGrowthPercent.toFixed(1)),
        bestSellingFoods: topFoods
      },
      dailyBreakdown: dailyStats
    };
  },

  async addFood({ name, description, category, price, image }) {
    const sql = `
      INSERT INTO foods (name, description, category, price, image)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await query.run(sql, [name, description || null, category, price, image || null]);
    return this.getFoodById(result.id);
  },

  async updateFood(id, { name, description, category, price, image }) {
    const sql = `
      UPDATE foods
      SET name = ?, description = ?, category = ?, price = ?, image = ?
      WHERE id = ?
    `;
    const result = await query.run(sql, [name, description || null, category, price, image || null, id]);
    if (result.changes === 0) {
      throw new Error(`Food item with ID ${id} not found.`);
    }
    return this.getFoodById(id);
  },

  async deleteFood(id) {
    const result = await query.run('DELETE FROM foods WHERE id = ?', [id]);
    if (result.changes === 0) {
      throw new Error(`Food item with ID ${id} not found.`);
    }
    return true;
  },

  async submitFeedback(orderId, { rating, taste, service, quality, comment }) {
    // 1. Verify the order actually exists
    const order = await query.get('SELECT order_id, status FROM orders WHERE order_id = ?', [orderId]);
    if (!order) {
      throw new Error(`Order #${orderId} not found.`);
    }

    // 2. Prevent duplicate feedback submissions for the same order
    const existing = await query.get('SELECT id FROM feedback WHERE order_id = ?', [orderId]);
    if (existing) {
      throw new Error(`Feedback for order #${orderId} has already been submitted.`);
    }

    // 3. Insert feedback
    const sql = `
      INSERT INTO feedback (order_id, rating, taste, service, quality, comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await query.run(sql, [
      orderId,
      rating,
      taste ? 1 : 0,
      service ? 1 : 0,
      quality ? 1 : 0,
      comment || null
    ]);
    return result.id;
  },

  async getFeedbackStats() {
    const avgRating = await query.get('SELECT AVG(rating) as avg FROM feedback');
    const totalReviews = await query.get('SELECT COUNT(*) as count FROM feedback');
    
    // Latest 10 reviews
    const latest = await query.all(`
      SELECT f.*, o.customer_name, o.phone_number
      FROM feedback f
      LEFT JOIN orders o ON f.order_id = o.order_id
      ORDER BY f.created_at DESC
      LIMIT 10
    `);

    // Most common complaints (rating <= 3)
    const complaints = await query.get(`
      SELECT SUM(taste == 1) as taste_bad,
             SUM(service == 1) as service_bad,
             SUM(quality == 1) as quality_bad
      FROM feedback
      WHERE rating <= 3
    `);

    // Most loved items (items in orders with rating >= 4)
    const lovedItems = await query.all(`
      SELECT fi.name, SUM(oi.quantity) as qty
      FROM feedback f
      JOIN order_items oi ON f.order_id = oi.order_id
      JOIN foods fi ON oi.food_id = fi.id
      WHERE f.rating >= 4
      GROUP BY fi.id
      ORDER BY qty DESC
      LIMIT 5
    `);

    return {
      averageRating: avgRating.avg ? parseFloat(avgRating.avg.toFixed(1)) : 0,
      totalReviews: totalReviews.count || 0,
      latestReviews: latest,
      complaints: {
        taste: complaints ? complaints.taste_bad || 0 : 0,
        service: complaints ? complaints.service_bad || 0 : 0,
        quality: complaints ? complaints.quality_bad || 0 : 0
      },
      mostLovedItems: lovedItems
    };
  }
};

module.exports = dbService;