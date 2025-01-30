const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Admin authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization === 'Bearer admin-token') {
        return next();
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

// Admin login route
router.post('/admin-login', async (req, res) => {
    const { username, password } = req.body;

    // Matching credentials
    if (username !== '@dmin' || password !== 'anassaleem@86') {
        return res.status(401).json({ error: 'Invalid credentials!' });
    }

    // Issue a token (for simplicity, using a hardcoded one here)
    const token = 'admin-token';  // This should ideally be a JWT token in production

    res.status(200).json({ message: 'Admin login successful!', token });
});

// Route to create multiple vouchers
router.post('/create-voucher', isAuthenticated, async (req, res) => {
    const { minOrderAmount, discountPercentage, voucherCount } = req.body;

    // Check if all required fields are present
    if (!minOrderAmount || !discountPercentage || !voucherCount) {
        return res.status(400).json({ error: 'All fields (minOrderAmount, discountPercentage, voucherCount) are required!' });
    }

    try {
        // Loop through and create the specified number of vouchers
        for (let i = 0; i < voucherCount; i++) {
            // Generate a unique voucher code
            const voucherCode = `VOUCHER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            
            // Insert the voucher into the database
            await pool.query(
                `INSERT INTO vouchers (voucher_code, min_order_amount, discount_percentage) 
                VALUES ($1, $2, $3)`,
                [voucherCode, minOrderAmount, discountPercentage]
            );
        }

        // Respond with success message
        res.status(201).json({ message: `${voucherCount} vouchers created successfully.` });
    } catch (err) {
        console.error('Error creating vouchers:', err);
        res.status(500).json({ error: 'Failed to create vouchers' });
    }
});

// Order History (View Only for Admin with User Info)
router.get('/order-history', async (req, res) => {
    try {
        // Fetch orders with associated user details
        const result = await pool.query(`
            SELECT 
                o.order_id, 
                o.total_price, 
                o.user_id, 
                o.created_at, 
                o.address, 
                o.status, 
                u.username
            FROM order_ o
            JOIN user_ u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
        `);

        // Check if orders exist
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No orders found!' });
        }

        // Return the fetched orders with user information
        res.status(200).json({ orders: result.rows });
    } catch (err) {
        console.error('Error fetching order history:', err);
        res.status(500).json({ error: 'Failed to fetch order history. Please try again later.' });
    }
});


  

// User Profiles
router.get('/user-profiles', async (req, res) => {
    try {
        // Fetch user profiles from the database
        const result = await pool.query('SELECT user_id, username, gender, profile_picture, created_at FROM user_');
        
        // Check if users exist
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No user profiles found!' });
        }

        // Convert binary profile_picture to base64
        const users = result.rows.map(user => {
            if (user.profile_picture) {
                user.profile_picture = `data:image/jpeg;base64,${user.profile_picture.toString('base64')}`;
            }
            return user;
        });

        // Return the fetched users
        res.status(200).json({ users });
    } catch (err) {
        console.error('Error fetching user profiles:', err);
        res.status(500).json({ error: 'Failed to fetch user profiles. Please try again later.' });
    }
});


// Delete User Profile
router.delete('/delete-user/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Delete the user from the database
      const result = await pool.query('DELETE FROM user_ WHERE user_id = $1', [userId]);
  
      // Check if user was deleted
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ error: 'Failed to delete user. Please try again later.' });
    }
  });

// Backend Route for Sales Analytics
router.get('/sales-analytics', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                r.category AS category_name, 
                COUNT(o.order_id) AS num_orders, 
                SUM(o.total_price) AS total_revenue
            FROM 
                order_ o
            JOIN 
                product_ordered po ON o.order_id = po.order_id  -- Join order_ with product_ordered
            JOIN 
                product p ON po.product_id = p.product_id  -- Join product_ordered with product using product_id
            JOIN 
                recipe r ON p.recipe_id = r.recipe_id  -- Join product with recipe using recipe_id
            GROUP BY 
                r.category
            ORDER BY 
                total_revenue DESC;
        `);

        // Log result for debugging
        console.log("Fetched Sales Data:", result.rows);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No sales data found!' });
        }

        res.status(200).json({ salesData: result.rows });
    } catch (err) {
        console.error('Error fetching sales analytics:', err);
        res.status(500).json({ error: 'Failed to fetch sales analytics. Please try again later.' });
    }
});







// View Comments
router.get('/comments', async (req, res) => {
    try {
        // Fetch comments from the database
        const result = await pool.query('SELECT * FROM comment_ ORDER BY created_at DESC');
        
        // Check if comments exist
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No comments found!' });
        }

        // Return the fetched comments
        res.status(200).json({ comments: result.rows });
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Failed to fetch comments. Please try again later.' });
    }
});

// Delete Comment
router.delete('/delete-comment/:commentId', async (req, res) => {
    const { commentId } = req.params;

    try {
        // Delete comment from the database
        const result = await pool.query('DELETE FROM comment_ WHERE comment_id = $1 RETURNING *', [commentId]);
        
        // Check if the comment was deleted
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found!' });
        }

        // Return success response
        res.status(200).json({ message: 'Comment deleted successfully!' });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Failed to delete comment. Please try again later.' });
    }
});

//get all vouchers with their details
router.get('/vouchers', async (req, res) => {
    try {
        // Query to get all voucher details
        const result = await pool.query('SELECT * FROM vouchers ORDER BY created_at DESC');

        // Check if there are any vouchers
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No vouchers found!' });
        }

        // Return the list of vouchers
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching vouchers:', err);
        res.status(500).json({ error: 'Failed to fetch vouchers. Please try again later.' });
    }
});


module.exports = router;
