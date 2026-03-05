import stripe from '../config/stripe.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// @desc    Create payment intent for ticket purchase
// @route   POST /api/payments/create-ticket-intent
export const createTicketIntent = async (req, res) => {
  try {
    const { roomId } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    if (!room.isMonetized || !room.ticketPrice) {
      return res.status(400).json({ success: false, message: 'Room is not ticketed' });
    }
    
    // Check if user already has ticket
    const user = await User.findById(req.user.id);
    const hasTicket = user.tickets.some(t => t.room.toString() === roomId);
    if (hasTicket) {
      return res.status(400).json({ success: false, message: 'You already have a ticket for this room' });
    }
    
    // Calculate platform fee
    const platformFeePercentage = parseInt(process.env.PLATFORM_FEE_PERCENTAGE) || 10;
    const platformFee = Math.round(room.ticketPrice * (platformFeePercentage / 100) * 100);
    const creatorAmount = room.ticketPrice * 100 - platformFee;
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(room.ticketPrice * 100), // Convert to cents
      currency: room.currency || 'usd',
      metadata: {
        roomId: room._id.toString(),
        userId: req.user.id,
        type: 'ticket',
        platformFee,
        creatorAmount
      },
      transfer_data: {
        destination: room.host.stripeAccountId,
        amount: creatorAmount
      }
    });
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Create ticket intent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create subscription for room
// @route   POST /api/payments/create-subscription
export const createSubscription = async (req, res) => {
  try {
    const { roomId, paymentMethodId } = req.body;
    
    const room = await Room.findById(roomId).populate('host');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    if (!room.isSubscription) {
      return res.status(400).json({ success: false, message: 'Room does not offer subscriptions' });
    }
    
    // Create Stripe customer if not exists
    let customer;
    const user = await User.findById(req.user.id);
    
    if (!user.stripeCustomerId) {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { userId: user._id.toString() }
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    } else {
      customer = { id: user.stripeCustomerId };
    }
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });
    
    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price_data: {
          currency: room.currency || 'usd',
          product_data: {
            name: room.name,
            description: `Subscription to ${room.name}`,
            metadata: { roomId: room._id.toString() }
          },
          unit_amount: Math.round(room.subscriptionPrice * 100),
          recurring: {
            interval: room.subscriptionInterval,
          },
        },
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        roomId: room._id.toString(),
        userId: req.user.id
      }
    });
    
    // Store subscription in database
    user.subscriptions.push({
      room: roomId,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + (room.subscriptionInterval === 'month' ? 30 : 365) * 24 * 60 * 60 * 1000),
      autoRenew: true,
      stripeSubscriptionId: subscription.id,
      status: 'active'
    });
    await user.save();
    
    room.subscribers.push({
      user: req.user.id,
      subscribedAt: new Date(),
      expiresAt: new Date(Date.now() + (room.subscriptionInterval === 'month' ? 30 : 365) * 24 * 60 * 60 * 1000),
      stripeSubscriptionId: subscription.id
    });
    await room.save();
    
    res.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process donation
// @route   POST /api/payments/donate
export const createDonation = async (req, res) => {
  try {
    const { roomId, amount, message } = req.body;
    
    const room = await Room.findById(roomId).populate('host');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    if (!room.allowDonations) {
      return res.status(400).json({ success: false, message: 'Room does not accept donations' });
    }
    
    // Calculate platform fee
    const platformFeePercentage = parseInt(process.env.PLATFORM_FEE_PERCENTAGE) || 10;
    const platformFee = Math.round(amount * (platformFeePercentage / 100) * 100);
    const creatorAmount = amount * 100 - platformFee;
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: {
        roomId: room._id.toString(),
        userId: req.user.id,
        type: 'donation',
        message: message || '',
        platformFee,
        creatorAmount
      },
      transfer_data: {
        destination: room.host.stripeAccountId,
        amount: creatorAmount
      }
    });
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Creator application
// @route   POST /api/payments/apply-creator
export const applyCreator = async (req, res) => {
  try {
    const { bio, whyCreator, socialLinks } = req.body;
    
    const user = await User.findById(req.user.id);
    
    user.creatorApplication = {
      status: 'pending',
      submittedAt: new Date(),
      bio,
      whyCreator,
      socialLinks
    };
    user.isCreator = false;
    
    await user.save();
    
    // Notify admins (implement notification system)
    
    res.json({
      success: true,
      message: 'Creator application submitted successfully'
    });
  } catch (error) {
    console.error('Apply creator error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create Stripe Connect account
// @route   POST /api/payments/create-connect-account
export const createConnectAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        email: user.email,
        first_name: user.fullName.split(' ')[0],
        last_name: user.fullName.split(' ').slice(1).join(' ') || '',
      },
      metadata: {
        userId: user._id.toString()
      }
    });
    
    // Save Stripe account ID
    user.stripeAccountId = account.id;
    user.stripeAccountStatus = 'pending';
    await user.save();
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.CLIENT_URL}/creator/dashboard?refresh=true`,
      return_url: `${process.env.CLIENT_URL}/creator/dashboard?success=true`,
      type: 'account_onboarding',
    });
    
    res.json({
      success: true,
      accountLinkUrl: accountLink.url
    });
  } catch (error) {
    console.error('Create connect account error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get creator dashboard data
// @route   GET /api/payments/creator-dashboard
export const getCreatorDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'rooms',
        match: { host: req.user.id },
        select: 'name ticketPrice ticketSold revenue totalDonations participants createdAt'
      });
    
    // Get balance from Stripe
    let stripeBalance = { available: [], pending: [] };
    if (user.stripeAccountId) {
      try {
        stripeBalance = await stripe.balance.retrieve({
          stripeAccount: user.stripeAccountId
        });
      } catch (error) {
        console.error('Stripe balance error:', error);
      }
    }
    
    // Get recent transactions
    const transactions = await Transaction.find({ 
      $or: [
        { from: req.user.id },
        { to: req.user.id }
      ]
    })
    .sort('-createdAt')
    .limit(20)
    .populate('room', 'name')
    .populate('from', 'username fullName')
    .populate('to', 'username fullName');
    
    res.json({
      success: true,
      dashboard: {
        earnings: user.totalEarnings,
        availableBalance: user.availableBalance,
        pendingBalance: user.pendingBalance,
        stripeBalance: stripeBalance.available.reduce((sum, b) => sum + b.amount, 0) / 100,
        rooms: user.rooms || [],
        transactions,
        stripeAccountStatus: user.stripeAccountStatus,
        isCreator: user.isCreator
      }
    });
  } catch (error) {
    console.error('Creator dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Request payout
// @route   POST /api/payments/request-payout
export const requestPayout = async (req, res) => {
  try {
    const { amount, method } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (user.availableBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
    
    if (amount < (process.env.MINIMUM_PAYOUT || 10)) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum payout is $${process.env.MINIMUM_PAYOUT || 10}` 
      });
    }
    
    // Create payout record
    const payout = {
      amount,
      method,
      status: 'pending',
      requestedAt: new Date()
    };
    
    user.payouts.push(payout);
    user.availableBalance -= amount;
    user.pendingBalance += amount;
    
    await user.save();
    
    // If Stripe Connect, create transfer
    if (method === 'stripe' && user.stripeAccountId) {
      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          destination: user.stripeAccountId,
          metadata: {
            userId: user._id.toString(),
            payoutId: user.payouts[user.payouts.length - 1]._id.toString()
          }
        });
        
        payout.transactionId = transfer.id;
        await user.save();
      } catch (error) {
        console.error('Stripe transfer error:', error);
      }
    }
    
    res.json({
      success: true,
      message: 'Payout requested successfully'
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailure(failedPayment);
      break;
      
    case 'account.updated':
      const account = event.data.object;
      await handleAccountUpdate(account);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Helper functions for webhook handling
async function handlePaymentSuccess(paymentIntent) {
  const { roomId, userId, type } = paymentIntent.metadata;
  
  if (type === 'ticket') {
    // Update user's tickets
    await User.findByIdAndUpdate(userId, {
      $push: {
        tickets: {
          room: roomId,
          purchasedAt: new Date(),
          amount: paymentIntent.amount / 100,
          stripePaymentIntentId: paymentIntent.id
        }
      }
    });
    
    // Update room stats
    await Room.findByIdAndUpdate(roomId, {
      $inc: {
        ticketSold: 1,
        revenue: paymentIntent.amount / 100,
        platformFee: paymentIntent.metadata.platformFee / 100,
        creatorEarnings: paymentIntent.metadata.creatorAmount / 100
      }
    });
  }
  
  // Create transaction record
  await Transaction.create({
    type,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    from: userId,
    to: paymentIntent.metadata.roomHost,
    room: roomId,
    stripePaymentIntentId: paymentIntent.id,
    status: 'completed'
  });
}

async function handlePaymentFailure(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
}

async function handleAccountUpdate(account) {
  await User.findOneAndUpdate(
    { stripeAccountId: account.id },
    { stripeAccountStatus: account.charges_enabled ? 'active' : 'incomplete' }
  );
}