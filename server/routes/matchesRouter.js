const Router = require('express');
const router = new Router();
const matchesController = require('../controllers/matchesController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, matchesController.create);
router.get('/', authMiddleware, matchesController.getAll);
router.get('/:id',authMiddleware, matchesController.getOne);
router.patch('/:id/finish', authMiddleware, matchesController.finish);

module.exports = router;