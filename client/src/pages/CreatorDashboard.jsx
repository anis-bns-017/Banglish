import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, Users, TrendingUp, Calendar,
  Wallet, Download, Clock, CheckCircle,
  XCircle, AlertCircle, PlusCircle
} from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

const CreatorDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/payments/creator-dashboard');
      setDashboard(response.data.dashboard);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/payments/request-payout', {
        amount: parseFloat(payoutAmount),
        method: 'stripe'
      });
      
      toast.success('Payout requested successfully');
      setShowPayoutModal(false);
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payout failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!dashboard?.isCreator) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Become a Creator</h2>
            <p className="mt-2 text-gray-600">
              Start monetizing your rooms and earn from your content
            </p>
            <div className="mt-6">
              <Link
                to="/creator/apply"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboard.earnings?.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboard.availableBalance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboard.rooms?.length || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tickets Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboard.rooms?.reduce((sum, r) => sum + (r.ticketSold || 0), 0) || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Stripe Account Status */}
        {dashboard.stripeAccountStatus !== 'active' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Complete your Stripe account setup
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You need to complete your Stripe account setup to receive payments.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const response = await axios.post('/payments/create-connect-account');
                      window.location.href = response.data.accountLinkUrl;
                    } catch (error) {
                      toast.error('Failed to create Stripe account');
                    }
                  }}
                  className="mt-3 inline-flex items-center px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={dashboard.availableBalance < 10}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request Payout
          </button>
          
          <Link
            to="/rooms?create=true&monetized=true"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Monetized Room
          </Link>
        </div>

        {/* Rooms Table */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium">Your Rooms</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboard.rooms?.map((room) => (
                  <tr key={room._id}>
                    <td className="px-6 py-4">
                      <Link to={`/room/${room._id}`} className="text-indigo-600 hover:text-indigo-900">
                        {room.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">${room.ticketPrice || '0.00'}</td>
                    <td className="px-6 py-4">{room.ticketSold || 0}</td>
                    <td className="px-6 py-4">${room.revenue?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium">Recent Transactions</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboard.transactions?.map((tx) => (
              <div key={tx._id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} - {tx.room?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">+${tx.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-medium mb-4">Request Payout</h3>
            <form onSubmit={handlePayout}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Min. $10)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    min="10"
                    max={dashboard.availableBalance}
                    step="0.01"
                    className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Available: ${dashboard.availableBalance?.toFixed(2)}
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Request Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;