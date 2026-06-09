const dbService = require('../services/dbService');
const seedDatabase = require('../database/seed');
const db = require('../config/db');

async function runTests() {
  console.log('========================================================');
  console.log('         Running Backend Integration Tests...           ');
  console.log('========================================================');

  try {
    // 1. Ensure DB is seeded
    console.log('Step 1: Initializing & Seeding DB...');
    await new Promise((resolve) => {
      seedDatabase();
      setTimeout(resolve, 1000); // Wait for async seeding to finish
    });
    console.log('✓ Seeding complete.');

    // 2. Fetch Menu
    console.log('\nStep 2: Fetching All Food Items...');
    const foods = await dbService.getAllFoods();
    console.log(`✓ Fetched ${foods.length} foods from database.`);
    if (foods.length === 0) {
      throw new Error('No foods found in the database. Seeding might have failed.');
    }

    // 3. Create a Test Order
    console.log('\nStep 3: Creating a test order...');
    const testItems = [
      { food_id: foods[0].id, quantity: 2 }, // 2x Fried Rice
      { food_id: foods[3].id, quantity: 1 }  // 1x Noodles
    ];
    
    const order = await dbService.createOrder({
      customerName: 'Test Customer',
      phoneNumber: '9999999999',
      customerAddress: '123 Test Street, Apartment 4B',
      specialInstructions: 'Extra spicy, no onions',
      items: testItems
    });

    console.log('✓ Order created successfully!');
    console.log(`- Order ID: #${order.order_id}`);
    console.log(`- Customer Name: ${order.customer_name}`);
    console.log(`- Total Price: ₹${order.total_price}`);
    console.log(`- Estimated Time: ${order.estimated_time} minutes`);

    if (order.estimated_time !== 15) {
      throw new Error(`Estimated prep time calculation error. Got ${order.estimated_time}, expected 15.`);
    }

    // 4. Retrieve Order
    console.log('\nStep 4: Retrieving order by ID...');
    const retrieved = await dbService.getOrderById(order.order_id);
    console.log(`✓ Retrieved Order #${retrieved.order_id} with ${retrieved.items.length} items.`);
    if (retrieved.items.length !== 2) {
      throw new Error(`Expected 2 items in retrieved order, got ${retrieved.items.length}.`);
    }

    // 5. Update Status
    console.log('\nStep 5: Updating order status...');
    const updated = await dbService.updateOrderStatus(order.order_id, 'Preparing');
    console.log(`✓ Status updated successfully. New status: ${updated.status}`);
    if (updated.status !== 'Preparing') {
      throw new Error(`Expected status to be 'Preparing', got ${updated.status}`);
    }

    // 6. Test Stats Aggregation
    console.log('\nStep 6: Fetching dashboard KPI stats...');
    const stats = await dbService.getTodayStats();
    console.log('✓ Stats loaded successfully:');
    console.log(`- Today's Orders: ${stats.totalOrdersToday}`);
    console.log(`- Today's Revenue: ₹${stats.revenueToday}`);
    console.log(`- Pending: ${stats.pendingOrdersCount}`);
    console.log(`- Preparing: ${stats.preparingOrdersCount}`);

    if (stats.preparingOrdersCount !== 1) {
      throw new Error(`Expected preparing orders count to be 1, got ${stats.preparingOrdersCount}`);
    }

    // 7. Test Reports Generation
    console.log('\nStep 7: Testing reports generation...');
    const daily = await dbService.getDailyReport();
    const weekly = await dbService.getWeeklyReport();
    const monthly = await dbService.getMonthlyReport();
    
    console.log('✓ Daily report generated.');
    console.log(`✓ Weekly report generated (Weekly Revenue: ₹${weekly.summary.weeklyRevenue}).`);
    console.log(`✓ Monthly report generated (Growth rate: ${monthly.summary.revenueGrowth}%).`);

    console.log('\n========================================================');
    console.log('      ALL INTEGRATION TESTS PASSED SUCCESSFULLY!       ');
    console.log('========================================================');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:');
    console.error(error);
    process.exit(1);
  } finally {
    // Close DB Connection
    db.close((err) => {
      if (err) console.error(err.message);
      else console.log('Database connection closed.');
    });
  }
}

runTests();
