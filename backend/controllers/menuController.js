const dbService = require('../services/dbService');

const menuController = {
  async getMenu(req, res) {
    try {
      const foods = await dbService.getAllFoods();
      
      // Categorize for easy frontend filtering
      const categories = [...new Set(foods.map(f => f.category))];
      
      res.json({
        success: true,
        categories,
        menu: foods
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve menu items.',
        error: err.message
      });
    }
  },

  async getFood(req, res) {
    try {
      const { id } = req.params;
      const food = await dbService.getFoodById(id);
      if (!food) {
        return res.status(404).json({ success: false, message: 'Food item not found.' });
      }
      res.json({ success: true, food });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve food item.',
        error: err.message
      });
    }
  },

  async addMenuItem(req, res) {
    try {
      const { name, description, category, price, image } = req.body;
      if (!name || !category || !price) {
        return res.status(400).json({ success: false, message: 'Name, category, and price are required.' });
      }
      const item = await dbService.addFood({ name, description, category, price: parseFloat(price), image });
      res.status(201).json({ success: true, message: 'Menu item added successfully!', item });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to add menu item.', error: err.message });
    }
  },

  async updateMenuItem(req, res) {
    try {
      const { id } = req.params;
      const { name, description, category, price, image } = req.body;
      if (!name || !category || !price) {
        return res.status(400).json({ success: false, message: 'Name, category, and price are required.' });
      }
      const item = await dbService.updateFood(id, { name, description, category, price: parseFloat(price), image });
      res.json({ success: true, message: 'Menu item updated successfully!', item });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update menu item.', error: err.message });
    }
  },

  async deleteMenuItem(req, res) {
    try {
      const { id } = req.params;
      await dbService.deleteFood(id);
      res.json({ success: true, message: 'Menu item deleted successfully!' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to delete menu item.', error: err.message });
    }
  },

  async uploadImage(req, res) {
    try {
      const { name, data } = req.body;
      if (!name || !data) {
        return res.status(400).json({ success: false, message: 'File name and data are required.' });
      }

      const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, message: 'Invalid base64 image data.' });
      }

      const fs = require('fs');
      const path = require('path');
      const buffer = Buffer.from(matches[2], 'base64');
      const uploadDir = path.join(__dirname, '../../public/assets/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const sanitizedName = name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filename = `${Date.now()}_${sanitizedName}`;
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, buffer);
      
      const url = `/assets/uploads/${filename}`;
      res.json({ success: true, url });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to upload image.', error: err.message });
    }
  }
};

module.exports = menuController;
