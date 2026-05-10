const Router = require('express');
const router = new Router();
const userRouter = require('./userRouter');
const resultsRouter = require('./resultsRouter');
const matchesRouter = require('./matchesRouter');


router.use('/user', userRouter);
router.use('/results', resultsRouter);
router.use('/matches', matchesRouter);

module.exports = router;