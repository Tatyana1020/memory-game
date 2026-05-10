const Router = require('express');
const router = new Router();
const resultsController = require('../controllers/resultsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, resultsController.create);
router.get('/', resultsController.getAll);
router.get('/:userId', authMiddleware, resultsController.getByUser);

module.exports = router;