const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');

// Function tính phí vận chuyển
const calculateShippingFee = (totalAmount) => {
  if (totalAmount >= 500000) { // Đơn hàng từ 500k trở lên
    return 0; // Miễn phí vận chuyển
  } else if (totalAmount >= 200000) { // Đơn hàng từ 200k - 499k
    return 30000; // Phí ship 30k
  } else { // Đơn hàng dưới 200k
    return 50000; // Phí ship 50k
  }
};

// Hiển thị trang checkout
const showCheckout = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const cart = await Cart.findOne({ user: userId }).populate('items.book');

    if (!cart || cart.items.length === 0) {
      req.flash('error', 'Giỏ hàng trống');
      return res.redirect('/cart');
    }

    const user = await User.findById(userId);

    res.render('orders/checkout', {
      title: 'Thanh toán',
      cart,
      user,
      shippingFee: calculateShippingFee(cart.totalAmount)
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/cart');
  }
};

// Tạo đơn hàng
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      fullName,
      address,
      city,
      postalCode,
      phone,
      paymentMethod,
      notes
    } = req.body;

    // Kiểm tra giỏ hàng
    const cart = await Cart.findOne({ user: userId }).populate('items.book');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // Tạo order items
    const orderItems = cart.items.map(item => ({
      book: item.book._id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    }));

    // Tính tổng tiền
    const totalAmount = cart.totalAmount;
    const shippingFee = calculateShippingFee(totalAmount);
    const finalAmount = totalAmount + shippingFee;

    // Tạo đơn hàng mới
    console.log('Creating order with data:', {
      userId,
      orderItemsCount: orderItems.length,
      totalAmount,
      shippingFee,
      finalAmount,
      paymentMethod,
      shippingAddress: { fullName, address, city, phone }
    });

    const order = new Order({
      user: userId,
      items: orderItems,
      shippingAddress: {
        fullName,
        address,
        city,
        postalCode: postalCode || '',
        phone
      },
      paymentMethod,
      totalAmount,
      shippingFee,
      finalAmount,
      notes: notes || ''
    });

    console.log('Order object created, attempting to save...');

    console.log('Order object created, attempting to save...');
    await order.save();
    console.log('Order saved successfully:', order.orderNumber);

    // Xóa giỏ hàng sau khi đặt hàng
    await Cart.findOneAndDelete({ user: userId });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.json({
        message: 'Đặt hàng thành công',
        order: await order.populate('items.book')
      });
    } else {
      let paymentMethodText = '';
      switch(paymentMethod) {
        case 'cash_on_delivery':
          paymentMethodText = 'COD (Thanh toán khi nhận hàng)';
          break;
        case 'bank_transfer':
          paymentMethodText = 'Chuyển khoản ngân hàng';
          break;
        case 'credit_card':
          paymentMethodText = 'Thẻ tín dụng';
          break;
        default:
          paymentMethodText = paymentMethod;
      }
      
      req.flash('success', `Đặt hàng thành công! Phương thức thanh toán: ${paymentMethodText}. Mã đơn hàng: ${order.orderNumber}`);
      res.redirect(`/orders/${order._id}`);
    }
  } catch (error) {
    console.error('Create order error:', error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ 
        message: 'Lỗi server', 
        error: error.message,
        details: error.errors ? Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        })) : undefined
      });
    } else {
      req.flash('error', 'Có lỗi xảy ra khi đặt hàng: ' + error.message);
      res.redirect('/orders/checkout');
    }
  }
};

// Xem chi tiết đơn hàng
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id || req.user.id;

    const order = await Order.findOne({ 
      _id: orderId, 
      user: userId 
    }).populate('items.book').populate('user');

    if (!order) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
      } else {
        req.flash('error', 'Đơn hàng không tồn tại');
        return res.redirect('/orders');
      }
    }

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.json(order);
    } else {
      res.render('orders/details', {
        title: `Đơn hàng #${order.orderNumber}`,
        order,
        user: req.user
      });
    }
  } catch (error) {
    console.error(error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ message: 'Lỗi server' });
    } else {
      req.flash('error', 'Có lỗi xảy ra');
      res.redirect('/orders');
    }
  }
};

// Xem lịch sử đơn hàng
const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.book');

    const totalOrders = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.json({
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } else {
      res.render('orders/history', {
        title: 'Lịch sử đơn hàng',
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        user: req.user
      });
    }
  } catch (error) {
    console.error(error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ message: 'Lỗi server' });
    } else {
      req.flash('error', 'Có lỗi xảy ra');
      res.redirect('/');
    }
  }
};

// Hủy đơn hàng (chỉ khi đơn hàng đang pending)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id || req.user.id;

    const order = await Order.findOne({ 
      _id: orderId, 
      user: userId 
    });

    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ 
        message: 'Chỉ có thể hủy đơn hàng đang chờ xử lý' 
      });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.json({ message: 'Đã hủy đơn hàng', order });
    } else {
      req.flash('success', 'Đã hủy đơn hàng');
      res.redirect('/orders');
    }
  } catch (error) {
    console.error(error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ message: 'Lỗi server' });
    } else {
      req.flash('error', 'Có lỗi xảy ra');
      res.redirect('/orders');
    }
  }
};

// Admin: Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus, trackingNumber } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await order.save();

    res.json({ message: 'Đã cập nhật trạng thái đơn hàng', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  showCheckout,
  createOrder,
  getOrderDetails,
  getOrderHistory,
  cancelOrder,
  updateOrderStatus
};