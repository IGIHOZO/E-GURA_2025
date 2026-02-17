import express from 'express';

const router = express.Router();

// Example route: GET /
router.get('/', (req, res) => {
    res.send('Welcome to the API');
});

// Example route: GET /api/items
router.get('/api/items', (req, res) => {
    // Logic to fetch items from the database can be added here
    res.json({ message: 'List of items' });
});

// Example route: POST /api/items
router.post('/api/items', (req, res) => {
    // Logic to create a new item can be added here
    res.status(201).json({ message: 'Item created' });
});

// Export the router
export default router;