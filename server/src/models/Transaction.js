import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ticket', 'subscription', 'donation', 'payout', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  platformFee: Number,
  creatorEarnings: Number,
  
  // Payment details
  paymentMethod: String,
  stripePaymentIntentId: String,
  stripeSubscriptionId: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // For refunds
  refundReason: String,
  refundedAt: Date
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;