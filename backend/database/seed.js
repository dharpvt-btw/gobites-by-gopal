const db = require('../config/db');

function seedDatabase() {
  db.serialize(() => {
    // 1. Create Foods Table
    db.run(`
      CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT
      )
    `);

    // 2. Create Orders Table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        customer_address TEXT,
        special_instructions TEXT,
        total_price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        estimated_time INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      )
    `);

    // 3. Create Order Items Table
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_id INTEGER,
        food_id INTEGER,
        quantity INTEGER NOT NULL,
        item_price REAL NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY(food_id) REFERENCES foods(id) ON DELETE CASCADE
      )
    `);

    // 4. Create Feedback Table
    db.run(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        taste INTEGER DEFAULT 0,
        service INTEGER DEFAULT 0,
        quality INTEGER DEFAULT 0,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE
      )
    `);

    // Initialize the orders sequence starting at 1000 (so first order is 1001)
    // Only set sequence if orders table is empty (first run)
    db.get("SELECT COUNT(*) as count FROM orders", (err, row) => {
      if (!err && row && row.count === 0) {
        db.run("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('orders', 1000)");
        console.log('Order sequence initialized to 1000.');
      }
    });

    // Seed Menu Items only if foods table is empty (first run only)
    performSeed();
  });
}

function performSeed() {
  const sampleFoods = [
    // Noodles
    {
      name: 'Veg Noodles',
      description: 'Stir-fried noodles with fresh, crisp seasonal vegetables and savory Chinese sauces.',
      category: 'Noodles',
      price: 70,
      image: '/assets/veg_noodles.svg'
    },
    {
      name: 'Egg Noodles',
      description: 'Scrambled farm eggs tossed with stir-fried noodles, carrots, and spring onions.',
      category: 'Noodles',
      price: 80,
      image: '/assets/egg_noodles.svg'
    },
    {
      name: 'Chicken Noodles',
      description: 'Tender spiced chicken chunks tossed with wok-fried noodles and crisp vegetables.',
      category: 'Noodles',
      price: 100,
      image: '/assets/chicken_noodles.svg'
    },
    {
      name: 'Veg Manchurian Noodles',
      description: 'Delectable vegetable Manchurian balls served with delicious stir-fried noodles.',
      category: 'Noodles',
      price: 100,
      image: '/assets/veg_manchurian_noodles.svg'
    },
    {
      name: 'Double Egg Chicken Noodles',
      description: 'Noodles loaded with double scrambled eggs and generous chicken chunks.',
      category: 'Noodles',
      price: 110,
      image: '/assets/double_egg_chicken_noodles.svg'
    },
    {
      name: 'Egg Manchurian Noodles',
      description: 'Savory egg Manchurian dumplings tossed with seasoned Chinese noodles.',
      category: 'Noodles',
      price: 120,
      image: '/assets/egg_manchurian_noodles.svg'
    },
    {
      name: 'Panner Noodles',
      description: 'Soft paneer cubes tossed with wok-fried noodles and crunchy bell peppers.',
      category: 'Noodles',
      price: 120,
      image: '/assets/panner_noodles.svg'
    },

    // Fried Rice
    {
      name: 'Veg Fried Rice',
      description: 'Aromatic basmati rice stir-fried with finely chopped fresh vegetables and spices.',
      category: 'Fried Rice',
      price: 110,
      image: '/assets/veg_fried_rice.svg'
    },
    {
      name: 'Egg Fried Rice',
      description: 'Fluffy seasoned rice scrambled with fresh eggs and green spring onions.',
      category: 'Fried Rice',
      price: 120,
      image: '/assets/egg_fried_rice.svg'
    },
    {
      name: 'Chicken Fried Rice',
      description: 'Wok-tossed basmati rice with tender spiced chicken pieces and light soy sauce.',
      category: 'Fried Rice',
      price: 150,
      image: '/assets/chicken_fried_rice.svg'
    },
    {
      name: 'Veg Manchurian Fried Rice',
      description: 'Stir-fried basmati rice served with rich, flavorful vegetable Manchurian.',
      category: 'Fried Rice',
      price: 130,
      image: '/assets/veg_manchurian_fried_rice.svg'
    },
    {
      name: 'Egg Manchurian Fried Rice',
      description: 'Seasoned fried rice combined with mouth-watering egg Manchurian dumplings.',
      category: 'Fried Rice',
      price: 150,
      image: '/assets/egg_manchurian_fried_rice.svg'
    },
    {
      name: 'Panner Fried Rice',
      description: 'Premium basmati rice tossed with spiced paneer cubes and seasonal veggies.',
      category: 'Fried Rice',
      price: 160,
      image: '/assets/panner_fried_rice.svg'
    },
    {
      name: 'Double Egg Chicken Fried Rice',
      description: 'Loaded fried rice with double scrambled eggs and juicy chicken pieces.',
      category: 'Fried Rice',
      price: 160,
      image: '/assets/double_egg_chicken_fried_rice.svg'
    },

    // Chinese Starters
    {
      name: 'Veg Manchurian',
      description: 'Crispy deep-fried vegetable balls tossed in a tangy, spicy Manchurian sauce.',
      category: 'Chinese Starters',
      price: 100,
      image: '/assets/veg_manchurian.svg'
    },
    {
      name: 'Chicken Manchurian',
      description: 'Crispy chicken chunks coated in a sweet, spicy, and tangy Manchurian gravy.',
      category: 'Chinese Starters',
      price: 160,
      image: '/assets/chicken_manchurian.svg'
    },
    {
      name: 'Chicken 65',
      description: 'Spicy, deep-fried chicken cubes marinated in rich yogurt and fresh curry leaves.',
      category: 'Chinese Starters',
      price: 200,
      image: '/assets/chicken_65.svg'
    },
    {
      name: 'Chilli Chicken',
      description: 'Stir-fried crispy chicken chunks with bell peppers, onions, and hot chili sauce.',
      category: 'Chinese Starters',
      price: 180,
      image: '/assets/chilli_chicken.svg'
    }
  ];

  db.get("SELECT COUNT(*) as count FROM foods", (err, row) => {
    if (err) {
      console.error('Error checking foods table:', err.message);
      if (require.main === module) db.close();
      return;
    }

    if (row.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO foods (name, description, category, price, image)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const food of sampleFoods) {
        stmt.run(food.name, food.description, food.category, food.price, food.image);
      }
      stmt.finalize(() => {
        console.log('Gobites by Gopal menu seeded successfully.');
        if (require.main === module) {
          db.close((err) => {
            if (err) console.error(err.message);
            else console.log('Closed the database connection.');
          });
        }
      });
    } else {
      console.log('Menu already seeded. Skipping.');
      if (require.main === module) {
        db.close((err) => {
          if (err) console.error(err.message);
          else console.log('Closed the database connection.');
        });
      }
    }
  });
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;