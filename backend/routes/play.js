const express = require('express');
const playController = require('../controllers/playController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/history', playController.savePlayHistory);
router.get('/history', playController.getPlayHistory);
router.delete('/history', playController.clearPlayHistory);

router.post('/state', playController.savePlayState);
router.get('/state', playController.getPlayState);

module.exports = router;
