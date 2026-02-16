import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';

export function AccountPage() {
  const { user, signOut } = useAuth();
  const { subscription, hasActiveSubscription } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleManageSubscription = () => {
    // TODO: Redirect to Stripe customer portal
    alert('Stripe Customer Portal integration coming next!');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/player" className="text-xl font-bold text-white">
            <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              CrateStream
            </span>
          </Link>
          <Link 
            to="/player"
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Player
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{user?.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Account ID</p>
                <p className="text-white font-mono text-sm">{user?.uid.substring(0, 20)}...</p>
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
            
            {hasActiveSubscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="text-white">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        subscription.status === 'active' 
                          ? 'bg-green-500/20 text-green-300'
                          : subscription.status === 'trial'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {subscription.status === 'active' && '✓'}
                        {subscription.status === 'trial' && '⏱'}
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </span>
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Plan</p>
                    <p className="text-white font-medium">
                      {subscription.plan === 'monthly' && '$3/month'}
                      {subscription.plan === 'annual' && '$30/year'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400">
                    {subscription.cancelAtPeriodEnd ? 'Expires on' : 'Next billing date'}
                  </p>
                  <p className="text-white">{formatDate(subscription.currentPeriodEnd)}</p>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                    <p className="text-yellow-200 text-sm">
                      ⚠️ Your subscription will not renew. You'll have access until {formatDate(subscription.currentPeriodEnd)}.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleManageSubscription}
                  className="w-full py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-300 mb-4">You don't have an active subscription.</p>
                <Link
                  to="/subscribe"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all"
                >
                  Subscribe Now
                </Link>
              </div>
            )}
          </div>

          {/* Active Devices */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Active Devices</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">This Device</p>
                    <p className="text-sm text-gray-400">Chrome • Last active: Now</p>
                  </div>
                </div>
                <span className="text-xs text-green-400 px-2 py-1 bg-green-500/20 rounded">Active</span>
              </div>

              <p className="text-sm text-gray-400 text-center py-4">
                Device management coming soon! You'll be able to see all logged-in devices and log them out remotely.
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/10 backdrop-blur-lg rounded-lg p-6 border border-red-500/30">
            <h2 className="text-xl font-semibold text-red-300 mb-4">Danger Zone</h2>
            
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-500/20 border border-red-500 text-red-200 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
