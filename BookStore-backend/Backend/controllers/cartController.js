const Cart = require('../models/Cart');
const Book = require('../models/Book');

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

// Thêm sách vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    console.log('addToCart - Request body:', req.body);
    console.log('addToCart - User ID:', req.user?._id || req.user?.id);
    console.log('addToCart - Accept header:', req.headers.accept);
    
    const { bookId, quantity = 1 } = req.body;
    const userId = req.user._id || req.user.id;

    // Kiểm tra sách có tồn tại
    const book = await Book.findById(bookId);
    if (!book) {
      console.log('addToCart - Book not found:', bookId);
      return res.status(404).json({ message: 'Sách không tồn tại' });
    }

    console.log('addToCart - Book found:', book.title);

    // Tìm giỏ hàng của user
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // Tạo giỏ hàng mới nếu chưa có
      cart = new Cart({
        user: userId,
        items: [{
          book: bookId,
          quantity: parseInt(quantity),
          price: book.price
        }]
      });
    } else {
      // Kiểm tra xem sách đã có trong giỏ hàng chưa
      const existingItem = cart.items.find(item => item.book.toString() === bookId);
      
      if (existingItem) {
        existingItem.quantity += parseInt(quantity);
      } else {
        cart.items.push({
          book: bookId,
          quantity: parseInt(quantity),
          price: book.price
        });
      }
    }

    await cart.save();
    
    console.log('addToCart - Cart saved successfully');

    // Luôn trả về JSON response cho AJAX requests
    const populatedCart = await cart.populate('items.book');
    console.log('addToCart - Returning JSON response');
    res.json({ 
      message: 'Đã thêm sách vào giỏ hàng', 
      cart: populatedCart 
    });
  } catch (error) {
    console.error('addToCart - Error:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Xem giỏ hàng
const viewCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let cart = await Cart.findOne({ user: userId }).populate('items.book');

    if (!cart) {
      cart = { items: [], totalAmount: 0 };
    }

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.json(cart);
    } else {
      const shippingFee = calculateShippingFee(cart.totalAmount);
      res.render('cart/index', { 
        title: 'Giỏ hàng',
        cart,
        user: req.user,
        shippingFee,
        finalAmount: cart.totalAmount + shippingFee
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

// Cập nhật số lượng sách trong giỏ hàng
const updateCartItem = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const userId = req.user._id || req.user.id;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Số lượng phải lớn hơn 0' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
    }

    const item = cart.items.find(item => item.book.toString() === bookId);
    if (!item) {
      return res.status(404).json({ message: 'Sách không có trong giỏ hàng' });
    }

    item.quantity = parseInt(quantity);
    await cart.save();

    // Luôn trả về JSON cho update request
    const populatedCart = await cart.populate('items.book');
    res.json({ 
      message: 'Đã cập nhật giỏ hàng', 
      cart: populatedCart 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Xóa sách khỏi giỏ hàng
const removeFromCart = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user._id || req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
    }

    cart.items = cart.items.filter(item => item.book.toString() !== bookId);
    await cart.save();

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      const populatedCart = await cart.populate('items.book');
      res.json({ 
        message: 'Đã xóa sách khỏi giỏ hàng', 
        cart: populatedCart 
      });
    } else {
      req.flash('success', 'Đã xóa sách khỏi giỏ hàng');
      res.redirect('/cart');
    }
  } catch (error) {
    console.error(error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ message: 'Lỗi server' });
    } else {
      req.flash('error', 'Có lỗi xảy ra');
      res.redirect('/cart');
    }
  }
};

// Xóa tất cả sách trong giỏ hàng
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    await Cart.findOneAndDelete({ user: userId });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.json({ message: 'Đã xóa tất cả sách trong giỏ hàng' });
    } else {
      req.flash('success', 'Đã xóa tất cả sách trong giỏ hàng');
      res.redirect('/cart');
    }
  } catch (error) {
    console.error(error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ message: 'Lỗi server' });
    } else {
      req.flash('error', 'Có lỗi xảy ra');
      res.redirect('/cart');
    }
  }
};

module.exports = {
  addToCart,
  viewCart,
  updateCartItem,
  removeFromCart,
  clearCart
};