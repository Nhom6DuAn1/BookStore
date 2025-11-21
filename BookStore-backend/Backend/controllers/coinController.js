const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');

const coinController = {
    // Hiển thị trang wallet của user
    showWallet: async (req, res) => {
        try {
            const user = await User.findById(req.user._id || req.user.id);
            if (!user) {
                req.flash('error', 'Không tìm thấy thông tin người dùng');
                return res.redirect('/login');
            }

            // Get recent transactions
            const recentTransactions = await CoinTransaction.getUserTransactions(user._id, {
                limit: 10
            });

            res.render('coins/wallet', {
                title: 'Ví Coin của tôi',
                user,
                recentTransactions,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Error showing wallet:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải thông tin ví');
            res.redirect('/');
        }
    },

    // Hiển thị trang nạp coin
    showTopUp: async (req, res) => {
        try {
            const user = await User.findById(req.user._id || req.user.id);
            
            // Predefined top-up packages
            const topUpPackages = [
                { coins: 100, vnd: 100000, bonus: 0 },
                { coins: 200, vnd: 200000, bonus: 10 },
                { coins: 500, vnd: 500000, bonus: 50 },
                { coins: 1000, vnd: 1000000, bonus: 150 },
                { coins: 2000, vnd: 2000000, bonus: 400 }
            ];

            res.render('coins/topup', {
                title: 'Nạp Coin',
                user,
                topUpPackages,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Error showing top-up page:', error);
            req.flash('error', 'Có lỗi xảy ra');
            res.redirect('/coins/wallet');
        }
    },

    // Xử lý nạp coin (simulation)
    processTopUp: async (req, res) => {
        try {
            const { amount, paymentMethod } = req.body;
            const userId = req.user._id || req.user.id;

            // Validate input
            if (!amount || amount <= 0) {
                req.flash('error', 'Số tiền nạp không hợp lệ');
                return res.redirect('/coins/topup');
            }

            if (!paymentMethod || !['momo', 'vnpay', 'bank_transfer'].includes(paymentMethod)) {
                req.flash('error', 'Phương thức thanh toán không hợp lệ');
                return res.redirect('/coins/topup');
            }

            // Calculate coins (1000 VND = 1 Coin)
            const exchangeRate = 1000;
            const coinAmount = Math.floor(amount / exchangeRate);
            
            // Calculate bonus coins for large purchases
            let bonusCoins = 0;
            if (amount >= 2000000) bonusCoins = 400;
            else if (amount >= 1000000) bonusCoins = 150;
            else if (amount >= 500000) bonusCoins = 50;
            else if (amount >= 200000) bonusCoins = 10;

            const totalCoins = coinAmount + bonusCoins;

            // Simulate payment processing
            const paymentTransactionId = 'SIM_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            // Create deposit transaction
            const transaction = await CoinTransaction.createTransaction({
                user: userId,
                type: 'deposit',
                amount: totalCoins,
                realMoneyAmount: amount,
                exchangeRate: exchangeRate,
                description: `Nạp ${totalCoins} coins (${coinAmount} + ${bonusCoins} bonus) từ ${paymentMethod}`,
                paymentMethod: paymentMethod,
                paymentTransactionId: paymentTransactionId,
                status: 'completed'
            });

            req.flash('success', `Nạp coin thành công! Bạn đã nhận được ${totalCoins} coins (bao gồm ${bonusCoins} coins bonus)`);
            res.redirect('/coins/wallet');

        } catch (error) {
            console.error('Error processing top-up:', error);
            req.flash('error', 'Có lỗi xảy ra trong quá trình nạp coin');
            res.redirect('/coins/topup');
        }
    },

    // Lịch sử giao dịch
    showTransactionHistory: async (req, res) => {
        try {
            const userId = req.user._id || req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const type = req.query.type || null;

            const transactions = await CoinTransaction.getUserTransactions(userId, {
                page,
                limit,
                type
            });

            const totalTransactions = await CoinTransaction.countDocuments({
                user: userId,
                ...(type && { type })
            });

            const totalPages = Math.ceil(totalTransactions / limit);

            res.render('coins/history', {
                title: 'Lịch sử giao dịch',
                transactions,
                currentPage: page,
                totalPages,
                totalTransactions,
                selectedType: type,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Error showing transaction history:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải lịch sử giao dịch');
            res.redirect('/coins/wallet');
        }
    },

    // API: Lấy số dư coin
    getBalance: async (req, res) => {
        try {
            const userId = req.user._id || req.user.id;
            const user = await User.findById(userId).select('coinBalance');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                balance: user.coinBalance
            });
        } catch (error) {
            console.error('Error getting balance:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    },

    // Admin: Tặng coin bonus
    adminGiveBonus: async (req, res) => {
        try {
            const { userId, amount, description } = req.body;

            // Validate admin permission
            const admin = await User.findById(req.user._id || req.user.id);
            if (!admin || admin.role !== 'admin') {
                req.flash('error', 'Bạn không có quyền thực hiện chức năng này');
                return res.redirect('/');
            }

            if (!userId || !amount || amount <= 0) {
                req.flash('error', 'Thông tin không hợp lệ');
                return res.redirect('/admin/users');
            }

            // Create bonus transaction
            const transaction = await CoinTransaction.createTransaction({
                user: userId,
                type: 'bonus',
                amount: parseInt(amount),
                description: description || `Bonus coins từ admin`,
                paymentMethod: 'admin_bonus',
                status: 'completed'
            });

            req.flash('success', `Đã tặng ${amount} coins cho người dùng`);
            res.redirect('/admin/users');

        } catch (error) {
            console.error('Error giving bonus:', error);
            req.flash('error', 'Có lỗi xảy ra khi tặng bonus');
            res.redirect('/admin/users');
        }
    },

    // Simulate payment callback (for demo purposes)
    paymentCallback: async (req, res) => {
        try {
            const { transactionId, status, amount, paymentMethod } = req.body;

            // In real implementation, verify payment with payment gateway
            // For demo, we'll just update the transaction status

            const transaction = await CoinTransaction.findOne({
                paymentTransactionId: transactionId
            });

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            transaction.status = status;
            await transaction.save();

            // If payment failed, refund the coins
            if (status === 'failed') {
                const user = await User.findById(transaction.user);
                user.coinBalance = transaction.balanceBefore;
                await user.save();
            }

            res.json({
                success: true,
                message: 'Payment callback processed'
            });

        } catch (error) {
            console.error('Error processing payment callback:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
};

module.exports = coinController;