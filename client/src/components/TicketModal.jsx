import React, { useState } from 'react';
import { X, CreditCard, Lock } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const TicketForm = ({ room, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setLoading(true);
    
    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?roomId=${room._id}`,
        },
        redirect: 'if_required'
      });
      
      if (submitError) {
        setError(submitError.message);
        toast.error(submitError.message);
      } else {
        toast.success('Payment successful! You can now join the room.');
        onSuccess();
      }
    } catch (error) {
      setError(error.message);
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Ticket Price:</span>
          <span className="text-xl font-bold text-indigo-600">
            ${room.ticketPrice}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <p>• One-time payment for this room</p>
          <p>• Access to all sessions</p>
          <p>• Supports the creator</p>
        </div>
      </div>
      
      <PaymentElement />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
        >
          <Lock className="h-4 w-4 mr-2" />
          {loading ? 'Processing...' : `Pay $${room.ticketPrice}`}
        </button>
      </div>
    </form>
  );
};

const TicketModal = ({ room, onClose, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await axios.post('/payments/create-ticket-intent', {
        roomId: room._id
      });
      setClientSecret(response.data.clientSecret);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#4f46e5',
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-indigo-600" />
            Purchase Ticket
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={options}>
              <TicketForm room={room} onSuccess={onSuccess} onClose={onClose} />
            </Elements>
          ) : (
            <p className="text-center text-red-600">Failed to initialize payment</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketModal;