const express = require('express');
const musicController = require('../controllers/musicController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authMiddleware);

router.post('/upload', upload.single('music'), musicController.uploadMusic);
router.get('/', musicController.getMusicList);
router.get('/statistics', musicController.getStatistics);
router.get('/:id', musicController.getMusicDetail);
router.get('/:id/play', musicController.playMusic);
router.delete('/:id', musicController.deleteMusic);
router.post('/batch-delete', musicController.batchDeleteMusic);

module.exports = router;
