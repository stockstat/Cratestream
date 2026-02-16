import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export function AccountPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscription, hasActiveSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancelSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Set subscription to cancel at end of period
      await updateDoc(userRef, {
        'subscription.cancelAtPeriodEnd': true,
        'subscription.updatedAt': new Date().toISOString()
      });

      alert('Your subscription will be canceled at the end of the current billing period.');
      setShowCancelConfirm(false);
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      await updateDoc(userRef, {
        'subscription.cancelAtPeriodEnd': false,
        'subscription.updatedAt': new Date().toISOString()
      });

      alert('Your subscription has been reactivated!');
      window.location.reload();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      alert('Failed to reactivate subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (!subscription) return null;

    if (subscription.status === 'trial') {
      return (
        <span className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold border-2 border-blue-400/30">
          FREE TRIAL
        </span>
      );
    }

    if (subscription.cancelAtPeriodEnd) {
      return (
        <span className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-full text-sm font-bold border-2 border-orange-400/30">
          CANCELING
        </span>
      );
    }

    if (subscription.status === 'active') {
      return (
        <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-bold border-2 border-green-400/30">
          ACTIVE
        </span>
      );
    }

    return (
      <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-bold border-2 border-red-400/30">
        EXPIRED
      </span>
    );
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/player')}
            className="text-orange-400 hover:text-orange-300 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Player
          </button>
          
          <h1 className="text-5xl font-black text-orange-400 mb-2" style={{ fontFamily: 'Impact, sans-serif' }}>
            ACCOUNT SETTINGS
          </h1>
          <p className="text-gray-400">{user.email}</p>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-zinc-900 border-2 border-orange-500/30 rounded-xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Impact, sans-serif' }}>
                SUBSCRIPTION STATUS
              </h2>
            </div>
            {getStatusBadge()}
          </div>

          {subscription && (
            <div className="space-y-4">
              {/* Status Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Plan</p>
                  <p className="text-white font-bold text-lg">
                    {subscription.status === 'trial' ? 'Free Trial' : 'Premium - $3/month'}
                  </p>
                </div>

                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">
                    {subscription.status === 'trial' ? 'Trial Ends' : 'Next Billing Date'}
                  </p>
                  <p className="text-white font-bold text-lg">
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>

                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Member Since</p>
                  <p className="text-white font-bold text-lg">
                    {formatDate(subscription.createdAt)}
                  </p>
                </div>

                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Access Level</p>
                  <p className="text-white font-bold text-lg">
                    {hasActiveSubscription ? 'Full Access' : 'Limited'}
                  </p>
                </div>
              </div>

              {/* Trial Info */}
              {subscription.status === 'trial' && (
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mt-4">
                  <p className="text-blue-400 text-sm">
                    <strong>Free Trial:</strong> You have full access until {formatDate(subscription.currentPeriodEnd)}. 
                    After that, subscribe for just $3/month to keep listening.
                  </p>
                </div>
              )}

              {/* Canceling Info */}
              {subscription.cancelAtPeriodEnd && (
                <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4 mt-4">
                  <p className="text-orange-400 text-sm">
                    <strong>Subscription Canceling:</strong> Your subscription will end on {formatDate(subscription.currentPeriodEnd)}. 
                    You'll have access until then.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Cancel/Reactivate Subscription */}
          {subscription && subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border-2 border-red-400/30 rounded-xl p-4 font-black transition-all"
              style={{ fontFamily: 'Impact, sans-serif' }}
            >
              CANCEL SUBSCRIPTION
            </button>
          )}

          {subscription && subscription.cancelAtPeriodEnd && (
            <button
              onClick={handleReactivateSubscription}
              disabled={loading}
              className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border-2 border-green-400/30 rounded-xl p-4 font-black transition-all disabled:opacity-50"
              style={{ fontFamily: 'Impact, sans-serif' }}
            >
              {loading ? 'REACTIVATING...' : 'REACTIVATE SUBSCRIPTION'}
            </button>
          )}

          {/* Upgrade from Trial */}
          {subscription && subscription.status === 'trial' && (
            <button
              onClick={() => navigate('/subscribe')}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white border-2 border-orange-400/30 rounded-xl p-4 font-black transition-all"
              style={{ fontFamily: 'Impact, sans-serif' }}
            >
              UPGRADE TO PREMIUM - $3/MONTH
            </button>
          )}

          {/* Logout */}
          <button
            onClick={() => {
              signOut();
              navigate('/');
            }}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 border-2 border-zinc-700 rounded-xl p-4 font-black transition-all"
            style={{ fontFamily: 'Impact, sans-serif' }}
          >
            LOGOUT
          </button>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border-2 border-red-400/30 rounded-xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-black text-white mb-4" style={{ fontFamily: 'Impact, sans-serif' }}>
                CANCEL SUBSCRIPTION?
              </h3>
              <p className="text-gray-300 mb-6">
                Your subscription will remain active until {subscription && formatDate(subscription.currentPeriodEnd)}. 
                After that, you'll lose access to the full library.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg p-3 font-bold disabled:opacity-50"
                >
                  {loading ? 'Canceling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg p-3 font-bold"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
