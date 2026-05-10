const Router = require('express');
const router = new Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/registration', userController.registration);
router.post('/login', userController.login);
router.post('/guest', userController.guestLogin);
router.get('/auth', authMiddleware, userController.check);
router.get('/:id', userController.info);
router.put('/update', authMiddleware, userController.update);
router.delete('/delete', authMiddleware, userController.delete);

module.exports = router;