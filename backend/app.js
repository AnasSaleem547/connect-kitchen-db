const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes'); // Adjust the path if necessary
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Enable CORS for frontend-backend communication
app.use(cors());

// Parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files for uploads (e.g., profile pictures)
app.use('/uploads', express.static('uploads'));

// Mount userRoutes at the `/api` prefix
app.use('/api', userRoutes);

// Mount admin routes at /admin path
app.use('/admin', adminRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
