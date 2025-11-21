const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed'], // percentage: %, fixed: số tiền cố định
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minimumPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  maxUsage: {
    type: Number,
    default: null, // null = unlimited
    min: 1
  },
  currentUsage: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Áp dụng cho loại sản phẩm cụ thể
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  // Áp dụng cho sách cụ thể
  applicableBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }]
}, { 
  timestamps: true 
});

// Index for better query performance
PromotionSchema.index({ code: 1 });
PromotionSchema.index({ isActive: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });

// Virtual to check if promotion is currently valid
PromotionSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         now <= this.endDate &&
         (this.maxUsage === null || this.currentUsage < this.maxUsage);
});

// Virtual to check if promotion has expired
PromotionSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Virtual to get usage percentage
PromotionSchema.virtual('usagePercentage').get(function() {
  if (this.maxUsage === null) return 0;
  return Math.round((this.currentUsage / this.maxUsage) * 100);
});

// Method to check if promotion can be applied to a specific order
PromotionSchema.methods.canApplyToOrder = function(orderTotal, books = [], categoryIds = []) {
  // Check if promotion is valid
  if (!this.isValid) return false;
  
  // Check minimum purchase
  if (orderTotal < this.minimumPurchase) return false;
  
  // If no specific categories or books are set, apply to all
  if (this.applicableCategories.length === 0 && this.applicableBooks.length === 0) {
    return true;
  }
  
  // Check if any book in order matches applicable books
  if (this.applicableBooks.length > 0) {
    for (let book of books) {
      if (this.applicableBooks.includes(book._id)) {
        return true;
      }
    }
  }
  
  // Check if any category matches
  if (this.applicableCategories.length > 0) {
    for (let categoryId of categoryIds) {
      if (this.applicableCategories.includes(categoryId)) {
        return true;
      }
    }
  }
  
  return false;
};

// Method to calculate discount amount
PromotionSchema.methods.calculateDiscount = function(orderTotal) {
  if (this.discountType === 'percentage') {
    return Math.round(orderTotal * (this.discountValue / 100));
  } else {
    return Math.min(this.discountValue, orderTotal);
  }
};

// Method to use promotion (increment usage counter)
PromotionSchema.methods.use = async function() {
  this.currentUsage += 1;
  await this.save();
};

module.exports = mongoose.model('Promotion', PromotionSchema);