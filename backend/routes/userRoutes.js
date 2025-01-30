const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const pool = require('../config/db');
const router = express.Router();

// Multer setup for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage });

// Register user
router.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { username, email, password, dob, gender } = req.body;
    let profilePicture = null;

    try {
        // Validate input fields
        if (!username || !email || !password || !dob || !gender) {
            return res.status(400).json({ error: 'All fields are required!' });
        }

        // Check if the username already exists
        const usernameCheck = await pool.query('SELECT * FROM user_ WHERE username = $1', [username]);
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists!' });
        }

        // Read file as binary data if a profile picture is uploaded
        if (req.file) {
            profilePicture = fs.readFileSync(req.file.path); // Read the file as binary data
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user data in the database
        const query = `
            INSERT INTO user_ (username, email, password, dob, gender, profile_picture)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const values = [username, email, hashedPassword, dob, gender, profilePicture];
        const result = await pool.query(query, values);

        console.log('User registered successfully:', result.rows[0]);

        // Delete the temporary uploaded file after reading
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error registering user:', err);

        // Cleanup: Delete the uploaded file if registration fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Registration failed. Please try again later.' });
    }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const user = await pool.query('SELECT * FROM user_ WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'User not found!' });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials!' });
        }

        res.status(200).json({ message: 'Login successful!', user: user.rows[0] });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'An error occurred during login. Please try again later.' });
    }
});


// Show user data
router.get('/showdata/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const result = await pool.query(
            'SELECT user_id, username, email, dob, gender, profile_picture FROM user_ WHERE user_id = $1',
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // If the profile_picture exists, convert it to Base64
        if (user.profile_picture) {
            user.profile_picture = Buffer.from(user.profile_picture).toString('base64');
        }

        console.log('User data fetched successfully:', user);
        res.status(200).json(user);
    } catch (err) {
        console.error('Error in /showdata/:user_id route:', err);
        res.status(500).json({ error: 'Failed to fetch user data.' });
    }
});



router.put('/update-password/:user_id', async (req, res) => {
    const { user_id } = req.params; // Extract user ID from URL
    const { password } = req.body; // Extract new password from request body

    try {
        if (!password) {
            return res.status(400).json({ error: 'Password is required!' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password in the database
        const result = await pool.query(
            'UPDATE user_ SET password = $1 WHERE user_id = $2 RETURNING user_id, username, email',
            [hashedPassword, user_id]
        );

        // Check if any rows were updated
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found!' });
        }

        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ error: 'Failed to update password. Please try again later.' });
    }
});

router.post('/add-recipe', upload.single('image'), async (req, res) => {
    const { recipe_name, created_date, instructions, user_id, category, ingredients, price } = req.body;
    const image = req.file ? fs.readFileSync(req.file.path) : null;

    console.log('Incoming Recipe Data:', {
        recipe_name,
        created_date,
        instructions,
        user_id,
        category,
        ingredients: JSON.parse(ingredients),
        price
    });

    try {
        // Insert recipe into the database
        const recipeQuery = `
            INSERT INTO recipe (recipe_name, image, created_date, instructions, user_id, category)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING recipe_id;
        `;
        const recipeValues = [recipe_name, image, created_date, instructions, user_id, category];
        const recipeResult = await pool.query(recipeQuery, recipeValues);

        console.log('Recipe Inserted:', recipeResult.rows[0]);

        const recipeId = recipeResult.rows[0].recipe_id;

        // Insert price into the products table
        const productQuery = `
            INSERT INTO product (recipe_id, price, quantity_available, user_id, name)
            VALUES ($1, $2, $3, $4, $5);
        `;
        const productValues = [recipeId, price, 10, user_id, recipe_name];  // You can set default quantity_available, such as 10
        await pool.query(productQuery, productValues);

        // Insert ingredients into recipe_ingredients table
        const ingredientQuery = `
            INSERT INTO recipe_ingredients (ingredient_name, quantity, recipe_id)
            VALUES ($1, $2, $3);
        `;

        const parsedIngredients = JSON.parse(ingredients);
        for (const ingredient of parsedIngredients) {
            const { ingredient_name, quantity } = ingredient;

            console.log('Inserting Ingredient:', { ingredient_name, quantity, recipeId });

            if (!ingredient_name || !quantity) {
                throw new Error('Each ingredient must have a name and quantity.');
            }

            await pool.query(ingredientQuery, [ingredient_name, quantity, recipeId]);
        }

        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(201).json({ message: 'Recipe, ingredients, and product added successfully!' });
    } catch (err) {
        console.error('Error Adding Recipe:', err);

        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Failed to add recipe and product.' });
    }
});



router.get('/recipes/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT r.recipe_id, r.recipe_name, r.created_date, r.instructions, 
                    r.category, encode(r.image, 'base64') AS image,
                    COUNT(rl.recipe_id) AS total_likes
             FROM recipe r
             LEFT JOIN recipe_liked rl ON r.recipe_id = rl.recipe_id
             WHERE r.user_id = $1
             GROUP BY r.recipe_id
             ORDER BY r.created_date DESC`,
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No recipes found for this user.' });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching recipes:', err);
        res.status(500).json({ error: 'Failed to fetch recipes.' });
    }
});

// Fetch all recipes with comment count
router.get('/all-recipes', async (req, res) => {
    try {
        const query = `
            SELECT r.recipe_id, 
                   r.recipe_name, 
                   r.created_date, 
                   r.instructions, 
                   r.category,
                   encode(r.image, 'base64') AS image,
                   COUNT(DISTINCT rl.recipe_id) AS total_likes,
                   COUNT(DISTINCT c.comment_id) AS total_comments
            FROM recipe r
            LEFT JOIN recipe_liked rl ON r.recipe_id = rl.recipe_id
            LEFT JOIN comment_ c ON r.recipe_id = c.recipe_id
            GROUP BY r.recipe_id
            ORDER BY r.created_date DESC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching recipes with comment count:', err);
        res.status(500).json({ error: 'Failed to fetch recipes.' });
    }
});



// Assuming you're using the same database connection and express setup
router.get('/like-count/:recipeId', async (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ error: 'Recipe ID is required.' });
    }

    try {
        // Query the number of likes for the recipe from the recipe_liked table
        const result = await pool.query(
            'SELECT COUNT(*) AS like_count FROM recipe_liked WHERE recipe_id = $1',
            [recipeId]
        );

        // Get the like count from the query result
        const likeCount = parseInt(result.rows[0].like_count, 10);

        return res.status(200).json({ count: likeCount });
    } catch (err) {
        console.error('Error in /like-count route:', err);
        res.status(500).json({ error: 'Failed to fetch like count.' });
    }
});




router.post('/like-recipe', async (req, res) => {
    const { user_id, recipe_id } = req.body;

    if (!user_id || !recipe_id) {
        return res.status(400).json({ error: 'User ID and Recipe ID are required.' });
    }

    try {
        // Check if the recipe is already liked by the user
        const checkLike = await pool.query(
            'SELECT * FROM recipe_liked WHERE user_id = $1 AND recipe_id = $2',
            [user_id, recipe_id]
        );

        if (checkLike.rows.length > 0) {
            // Unlike the recipe
            await pool.query(
                'DELETE FROM recipe_liked WHERE user_id = $1 AND recipe_id = $2',
                [user_id, recipe_id]
            );
            return res.status(200).json({ message: 'Recipe unliked.' });
        } else {
            // Like the recipe
            await pool.query(
                'INSERT INTO recipe_liked (user_id, recipe_id, liked_at) VALUES ($1, $2, NOW())',
                [user_id, recipe_id]
            );
            return res.status(200).json({ message: 'Recipe liked.' });
        }
    } catch (err) {
        console.error('Error in /like-recipe route:', err);
        res.status(500).json({ error: 'Failed to like/unlike the recipe.' });
    }
});

// Check Like Status route
router.post('/check-like-status/:recipeId', async (req, res) => {
    const { user_id } = req.body;
    const { recipeId } = req.params;

    if (!user_id || !recipeId) {
        return res.status(400).json({ error: 'User ID and Recipe ID are required.' });
    }

    try {
        // Check if the user has liked the recipe
        const checkLike = await pool.query(
            'SELECT * FROM recipe_liked WHERE user_id = $1 AND recipe_id = $2',
            [user_id, recipeId]
        );

        // If the recipe is found in the liked table, return true
        if (checkLike.rows.length > 0) {
            return res.status(200).json({ isLiked: true });
        } else {
            return res.status(200).json({ isLiked: false });
        }
    } catch (err) {
        console.error('Error checking like status:', err);
        res.status(500).json({ error: 'Failed to check like status.' });
    }
});


router.get('/recipes/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT recipe_id, recipe_name, created_date, instructions, category,
                    encode(image, 'base64') AS image,
                    COUNT(rl.recipe_id) AS total_likes
             FROM recipe r
             LEFT JOIN recipe_liked rl ON r.recipe_id = rl.recipe_id
             WHERE r.user_id = $1
             GROUP BY r.recipe_id
             ORDER BY r.created_date DESC`,
            [user_id]
        );

        // If no recipes found, return an empty array
        if (result.rows.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching recipes:', err);
        res.status(500).json({ error: 'Failed to fetch recipes.' });
    }
});






router.get('/user-liked-recipes/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT recipe_id
             FROM recipe_liked
             WHERE user_id = $1`,
            [user_id]
        );

        res.status(200).json(result.rows.map((row) => row.recipe_id)); // Return an array of recipe IDs
    } catch (err) {
        console.error('Error fetching liked recipes:', err);
        res.status(500).json({ error: 'Failed to fetch liked recipes.' });
    }
});

router.get('/creator-by-recipe/:recipe_id', async (req, res) => {
    const { recipe_id } = req.params;
    
    console.log('Fetching creator for recipe_id:', recipe_id);  // Log the recipe_id being received

    try {
        const result = await pool.query(
            `SELECT u.user_id, u.username, u.email, u.dob, u.gender, encode(u.profile_picture, 'base64') AS profile_picture
             FROM user_ u
             INNER JOIN recipe r ON u.user_id = r.user_id
             WHERE r.recipe_id = $1`,
            [recipe_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Creator not found for this recipe.' });
        }

        console.log('Creator data:', result.rows[0]); // Log the result data from DB
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching creator by recipe_id:', err);
        res.status(500).json({ error: 'Failed to fetch creator.' });
    }
});



router.post('/follow', async (req, res) => {
    const { follower_id, followed_id } = req.body;

    try {
        // Check if the follower already follows the followed user
        const checkFollow = await pool.query(
            `SELECT * FROM follow WHERE follower_id = $1 AND followed_id = $2`,
            [follower_id, followed_id]
        );

        if (checkFollow.rows.length > 0) {
            // Unfollow
            await pool.query(
                `DELETE FROM follow WHERE follower_id = $1 AND followed_id = $2`,
                [follower_id, followed_id]
            );
            return res.status(200).json({ message: 'Unfollowed successfully.' });
        } else {
            // Follow
            await pool.query(
                `INSERT INTO follow (follower_id, followed_id, followed_at) VALUES ($1, $2, NOW())`,
                [follower_id, followed_id]
            );
            return res.status(200).json({ message: 'Followed successfully.' });
        }
    } catch (err) {
        console.error('Error in follow/unfollow:', err);
        res.status(500).json({ error: 'Failed to follow/unfollow user.' });
    }
});

router.get('/is-following/:follower_id/:followed_id', async (req, res) => {
    const { follower_id, followed_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM follow WHERE follower_id = $1 AND followed_id = $2`,
            [follower_id, followed_id]
        );

        if (result.rows.length > 0) {
            res.status(200).json({ isFollowing: true });
        } else {
            res.status(200).json({ isFollowing: false });
        }
    } catch (err) {
        console.error('Error checking follow status:', err);
        res.status(500).json({ error: 'Failed to check follow status.' });
    }
});

// Get follower count for a user
router.get('/follower-count/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT COUNT(*) AS follower_count FROM follow WHERE followed_id = $1`,
            [user_id]
        );
        res.status(200).json({ follower_count: parseInt(result.rows[0].follower_count, 10) });
    } catch (err) {
        console.error('Error fetching follower count:', err);
        res.status(500).json({ error: 'Failed to fetch follower count.' });
    }
});

// Get following count for a user
router.get('/following-count/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT COUNT(*) AS following_count FROM follow WHERE follower_id = $1`,
            [user_id]
        );
        res.status(200).json({ following_count: parseInt(result.rows[0].following_count, 10) });
    } catch (err) {
        console.error('Error fetching following count:', err);
        res.status(500).json({ error: 'Failed to fetch following count.' });
    }
});

router.get('/ingredients/:recipe_id', async (req, res) => {
    const { recipe_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM recipe_ingredients WHERE recipe_id = $1`,
            [recipe_id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching ingredients:', err);
        res.status(500).json({ error: 'Failed to fetch ingredients.' });
    }
});

router.get('/recipe/:recipeId', async (req, res) => {
    const { recipeId } = req.params;
    try {
        // Query the database directly for the recipe using the provided recipeId
        const result = await pool.query(
            `SELECT * FROM recipe WHERE recipe_id = $1`, // Adjust table and column names as needed
            [recipeId]
        );

        // If no recipe is found, return a 404 response
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        // Send the recipe data as JSON response
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching recipe:', err);
        res.status(500).json({ error: 'Server error' });
    }
});



router.get('/comments/:recipe_id', async (req, res) => {
    const { recipe_id } = req.params;

    try {
        const query = `
            SELECT c.comment_id, c.content, c.created_at, u.username AS user_name
            FROM comment_ c
            INNER JOIN user_ u ON c.user_id = u.user_id
            WHERE c.recipe_id = $1
            ORDER BY c.created_at ASC;
        `;
        const result = await pool.query(query, [recipe_id]);

        res.status(200).json(result.rows); // Return the comments
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Failed to fetch comments.' });
    }
});

// Add a comment for a recipe
router.post('/add-comment', async (req, res) => {
    const { content, user_id, recipe_id } = req.body;

    // Validate the input
    if (!content || !user_id || !recipe_id) {
        return res.status(400).json({ error: 'All fields (content, user_id, recipe_id) are required.' });
    }

    try {
        const query = `
            INSERT INTO comment_ (content, user_id, recipe_id, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING comment_id, content, user_id, recipe_id, created_at;
        `;
        const values = [content, user_id, recipe_id];
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]); // Return the added comment
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Failed to add comment.' });
    }
});


// Endpoint to fetch all unique categories
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT category FROM recipe'); // Replace "recipes" with your table name
        const categories = result.rows.map(row => row.category); // Extract categories from the query result
        res.status(200).json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

// Add to Cart
router.post('/add-to-cart', async (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    if (!user_id || !product_id || !quantity) {
        return res.status(400).json({ error: 'User ID, Product ID, and Quantity are required.' });
    }

    try {
        // Check if the product is already in the cart
        const cartItem = await pool.query(
            'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
            [user_id, product_id]
        );

        if (cartItem.rows.length > 0) {
            // If the product is already in the cart, update the quantity
            await pool.query(
                'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
                [quantity, user_id, product_id]
            );
            return res.status(200).json({ message: 'Cart updated successfully.' });
        } else {
            // If the product is not in the cart, add it
            await pool.query(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                [user_id, product_id, quantity]
            );
            return res.status(200).json({ message: 'Product added to cart.' });
        }
    } catch (err) {
        console.error('Error adding product to cart:', err);
        res.status(500).json({ error: 'Failed to add product to cart.' });
    }
});

router.post('/checkout', async (req, res) => {
    const { user_id, address } = req.body;

    if (!user_id || !address) {
        return res.status(400).json({ error: 'User ID and Address are required.' });
    }

    try {
        // Get the cart items
        const cartItems = await pool.query(`
            SELECT c.product_id, c.quantity, p.price, p.user_id as creator_id, p.name 
            FROM cart c 
            INNER JOIN product p ON c.product_id = p.product_id
            WHERE c.user_id = $1`, [user_id]);

        if (cartItems.rows.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty.' });
        }

        // Calculate total price
        let totalPrice = 0;
        for (const item of cartItems.rows) {
            totalPrice += item.price * item.quantity;
        }

        // Insert order with total price and status 'pending'
        const orderResult = await pool.query(`
            INSERT INTO order_ (user_id, total_price, address, status) 
            VALUES ($1, $2, $3, 'pending') 
            RETURNING order_id`, 
            [user_id, totalPrice, address]);

        const orderId = orderResult.rows[0].order_id;

        // Create a set to store creator IDs (user_id from the product table)
        const creatorIds = new Set();
        for (const item of cartItems.rows) {
            creatorIds.add(item.creator_id);  // Use user_id from product table as creator
            // Insert notifications for each creator
            await pool.query(`
                INSERT INTO notifications (user_id, order_id, message, status) 
                VALUES ($1, $2, 'You have a new order to review.', 'pending')`, 
                [item.creator_id, orderId]);
        }

        

        // Insert into the product_ordered table when the order is accepted (on notification acceptance)
        res.status(200).json({ message: 'Checkout successful! Please wait for the creators to accept the order.', order_id: orderId });
    } catch (err) {
        console.error('Error during checkout:', err);
        res.status(500).json({ error: 'Failed to complete checkout. Please try again later.' });
    }
});

  
  
// Handle accept/reject actions for orders
router.post('/notification-action', async (req, res) => {
    const { orderId, action } = req.body;

    if (!orderId || !action) {
        return res.status(400).json({ error: 'Order ID and Action are required.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');  // Start a transaction

        const newStatus = action === 'accept' ? 'accepted' : 'rejected';

        // Update the order status
        await client.query('UPDATE order_ SET status = $1 WHERE order_id = $2', [newStatus, orderId]);

        if (newStatus === 'accepted') {
            // Fetch the cart items for the user who placed the order
            const orderItems = await client.query(
                `SELECT c.product_id, c.quantity 
                FROM cart c 
                INNER JOIN product p ON c.product_id = p.product_id
                WHERE c.user_id = (SELECT user_id FROM order_ WHERE order_id = $1)`,
                [orderId]
            );

            // Insert into product_ordered table for accepted orders
            for (const item of orderItems.rows) {
                await client.query(
                    `INSERT INTO product_ordered (order_id, product_id, quantity_ordered, order_date) 
                    VALUES ($1, $2, $3, NOW())`,
                    [orderId, item.product_id, item.quantity]
                );
            }
        }

        // Update notification status
        await client.query('UPDATE notifications SET status = $1 WHERE order_id = $2', [newStatus, orderId]);

        // Clear the cart after the order is processed
        await client.query('DELETE FROM cart WHERE user_id = (SELECT user_id FROM order_ WHERE order_id = $1)', [orderId]);

        await client.query('COMMIT');  // Commit the transaction

        res.status(200).json({ success: true });

    } catch (err) {
        await client.query('ROLLBACK');  // Rollback the transaction if there's an error
        console.error('Error during action:', err);
        res.status(500).json({ error: 'Failed to process action. Please try again later.' });
    } finally {
        client.release();
    }
});




// Get Notifications for Creator
// Get Notifications for Creator
router.get('/notifications/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        // Fetch notifications and associated order details
        const notificationsQuery = `
            SELECT n.notification_id, n.order_id, n.status AS notification_status, 
                   o.total_price, o.address, o.status AS order_status, o.created_at
            FROM notifications n
            INNER JOIN order_ o ON n.order_id = o.order_id
            WHERE n.user_id = $1 AND n.status = $2
        `;
        const notificationsResult = await pool.query(notificationsQuery, [user_id, 'pending']);
        
        res.status(200).json({ notifications: notificationsResult.rows });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications. Please try again later.' });
    }
});

// Accept/Reject Notification (Update Order Status)
router.post('/update-order-status', async (req, res) => {
    const { notification_id, order_id, status } = req.body;

    if (!notification_id || !order_id || !status) {
        return res.status(400).json({ error: 'Notification ID, Order ID, and Status are required.' });
    }

    try {
        // Update notification status
        await pool.query('UPDATE notifications SET status = $1 WHERE notification_id = $2', [status, notification_id]);

        // Update order status to 'accepted' or 'rejected'
        await pool.query('UPDATE order_ SET status = $1 WHERE order_id = $2', [status, order_id]);

        if (status === 'accepted') {
            // Move products to the product_ordered table if accepted
            const orderProducts = await pool.query('SELECT product_id, quantity_ordered FROM product_ordered WHERE order_id = $1', [order_id]);

            for (const item of orderProducts.rows) {
                const { product_id, quantity_ordered } = item;

                // Insert product into product_ordered
                await pool.query(
                    'INSERT INTO product_ordered (order_id, product_id, quantity_ordered, order_date) VALUES ($1, $2, $3, NOW())',
                    [order_id, product_id, quantity_ordered]
                );
            }
        }

        res.status(200).json({ message: `Order ${status} successfully!` });
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Failed to update order status. Please try again later.' });
    }
});


// Get Product by Recipe ID
router.get('/get-product-by-recipe/:recipeId', async (req, res) => {
    const { recipeId } = req.params;

    try {
        const result = await pool.query(
            'SELECT product_id FROM product WHERE recipe_id = $1',
            [recipeId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No product found for the given recipe.' });
        }

        res.status(200).json(result.rows[0]); // Return the product_id
    } catch (err) {
        console.error('Error fetching product by recipe ID:', err);
        res.status(500).json({ error: 'Failed to fetch product by recipe ID.' });
    }
});




// Get User's Cart Details
router.get('/get-cart/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query(
            'SELECT c.product_id, p.name, p.price, c.quantity ' +
            'FROM cart c ' +
            'INNER JOIN product p ON c.product_id = p.product_id ' +
            'WHERE c.user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No items in cart.' });
        }

        res.status(200).json(result.rows); // Return the cart items
    } catch (err) {
        console.error('Error fetching cart details:', err);
        res.status(500).json({ error: 'Failed to fetch cart details.' });
    }
});

// Update cart quantity
// Update cart quantity
router.put('/update-cart/:userId/:productId', async (req, res) => {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }

    try {
        const result = await pool.query(
            'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING product_id, quantity',
            [quantity, userId, productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in cart.' });
        }

        // Fetch the updated product price
        const priceResult = await pool.query(
            'SELECT price FROM product WHERE product_id = $1',
            [productId]
        );

        if (priceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const updatedItem = {
            product_id: result.rows[0].product_id,
            quantity: result.rows[0].quantity,
            price: priceResult.rows[0].price,
        };

        res.status(200).json({ message: 'Cart updated successfully', cartItem: updatedItem });
    } catch (err) {
        console.error('Error updating cart quantity:', err);
        res.status(500).json({ error: 'Failed to update cart quantity.' });
    }
});


// Remove item from cart
router.delete('/remove-from-cart/:userId/:productId', async (req, res) => {
    const { userId, productId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM cart WHERE user_id = $1 AND product_id = $2 RETURNING *',
            [userId, productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in cart.' });
        }

        res.status(200).json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error('Error removing item from cart:', err);
        res.status(500).json({ error: 'Failed to remove item from cart.' });
    }
});



// Checkout Route
router.post('/checkout', async (req, res) => {
    const { user_id, address, total_price, voucher_code } = req.body;
  
    if (!user_id || !address || total_price === undefined) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
  
    try {
      // Insert order details into the database
      const result = await pool.query(`
        INSERT INTO orders (user_id, address, total_price, voucher_code)
        VALUES ($1, $2, $3, $4) RETURNING order_id
      `, [user_id, address, total_price, voucher_code]);
  
      const order_id = result.rows[0].order_id;
  
      // Insert cart items into the order_items table
      for (const item of cartItems) {
        await pool.query(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
        `, [order_id, item.product_id, item.quantity, item.price]);
      }
  
      res.json({ message: 'Order placed successfully.' });
    } catch (err) {
      console.error('Error placing order:', err);
      res.status(500).json({ error: 'Failed to process the order.' });
    }
  });
  
  ///////////////////VOUCHER//////////////////////

  // In your backend (Express.js)
// Apply voucher logic
router.post('/apply-voucher', async (req, res) => {
    const { voucher_code, total_price } = req.body;
  
    if (!voucher_code || total_price <= 0) {
      return res.status(400).json({ error: 'Invalid voucher code or total price.' });
    }
  
    try {
      // Check if the voucher exists and is active
      const voucherResult = await pool.query(`
        SELECT * FROM vouchers WHERE voucher_code = $1 AND status = 'active' AND min_order_amount <= $2
      `, [voucher_code, total_price]);
  
      if (voucherResult.rows.length === 0) {
        return res.status(400).json({ error: 'Voucher code is invalid or does not meet the minimum order amount.' });
      }
  
      const voucher = voucherResult.rows[0];
  
      // Mark the voucher as inactive
      await pool.query(`
        UPDATE vouchers SET status = 'used' WHERE voucher_id = $1
      `, [voucher.voucher_id]);
  
      // Calculate the discount
      const discount = voucher.discount_percentage;
  
      res.status(200).json({ discount });
  
    } catch (err) {
      console.error('Error applying voucher:', err);
      res.status(500).json({ error: 'Failed to apply voucher. Please try again later.' });
    }
  });
  

  const { spawn } = require('child_process');  // Import the spawn function

router.post('/chat', (req, res) => {
    const userPrompt = req.body.prompt;
    const encodedPrompt = Buffer.from(userPrompt).toString('base64');
    const pythonPath = 'python';  // Adjust if needed for Windows compatibility
    const pythonScript = 'llm_script.py';  // Path to your Python script

    console.log('Running command:', `${pythonPath} ${pythonScript} "${encodedPrompt}"`);  // Debug log

    // Use spawn instead of exec
    const pythonProcess = spawn(pythonPath, [pythonScript, encodedPrompt]);

    // Collect output from the Python script
    let output = '';
    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    // Collect errors (stderr) from the Python script
    pythonProcess.stderr.on('data', (data) => {
        console.error('Chatbot Stderr:', data.toString());
    });

    // When the Python process finishes
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Chatbot process exited with code', code);
            return res.status(500).json({ message: 'Chatbot encountered an error' });
        }

        console.log('Chatbot Output:', output.trim());  // Debug log
        res.json({ response: output.trim() });
    });
});

  

module.exports = router;