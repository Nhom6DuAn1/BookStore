const express = require('express');
const router = express.Router();

const apiOrderController = require('../controllers/apiOrderController');
const { authenticateToken } = require('../middleware/apiAuth');

router.use(authenticateToken, (req, res, next) => {
  req.isApiRequest = true;
  next();
});

router.post('/', apiOrderController.createOrder);
router.get('/', apiOrderController.listOrders);
router.get('/:orderId', apiOrderController.getOrderById);
router.post('/:orderId/cancel', apiOrderController.cancelOrder);

module.exports = router;

