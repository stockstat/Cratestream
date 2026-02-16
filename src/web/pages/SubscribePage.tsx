import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function SubscribePage() {
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // If not logged in, create account first
    if (!user) {
      const result = await signUp(email, password);
      if (!result.success) {
        setError(result.error || 'Failed to create account');
        setLoading(false);
        return;
      }
    }

    // TODO: Redirect to Stripe Checkout
    // For now, just show success message
    alert('Stripe integration coming next! Your account is created.');
    navigate('/player');
    setLoading(false);
  };

  const handleBackToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h1>
          <p className="text-xl text-gray-300">Unlimited access to 99,246 tracks</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Monthly Plan */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`bg-white/10 backdrop-blur-lg rounded-xl p-8 text-left transition-all ${
              selectedPlan === 'monthly'
                ? 'ring-4 ring-orange-500 scale-105'
                : 'hover:bg-white/15'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Monthly</h3>
                <p className="text-gray-300">Pay as you go</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'monthly' ? 'border-orange-500' : 'border-gray-500'
              }`}>
                {selectedPlan === 'monthly' && (
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$3</span>
              <span className="text-gray-300 text-xl">/month</span>
            </div>

            <ul className="space-y-3 text-gray-200">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited streaming
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                2 devices simultaneously
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Personal playlists
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cancel anytime
              </li>
            </ul>
          </button>

          {/* Annual Plan */}
          <button
            onClick={() => setSelectedPlan('annual')}
            className={`bg-white/10 backdrop-blur-lg rounded-xl p-8 text-left transition-all relative ${
              selectedPlan === 'annual'
                ? 'ring-4 ring-orange-500 scale-105'
                : 'hover:bg-white/15'
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              SAVE $6
            </div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Annual</h3>
                <p className="text-gray-300">Best value</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === 'annual' ? 'border-orange-500' : 'border-gray-500'
              }`}>
                {selectedPlan === 'annual' && (
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$30</span>
              <span className="text-gray-300 text-xl">/year</span>
              <p className="text-sm text-green-400 mt-1">($2.50/month)</p>
            </div>

            <ul className="space-y-3 text-gray-200">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited streaming
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                2 devices simultaneously
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Personal playlists
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                17% savings
              </li>
            </ul>
          </button>
        </div>

        {/* Sign Up Form (if not logged in) */}
        {!user && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 max-w-md mx-auto mb-6">
            <h3 className="text-xl font-bold text-white mb-6">Create your account</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all disabled:opacity-50 text-lg"
              >
                {loading ? 'Processing...' : `Subscribe ${selectedPlan === 'monthly' ? '$3/mo' : '$30/yr'}`}
              </button>
            </form>

            <p className="mt-4 text-sm text-gray-300 text-center">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-orange-400 hover:text-orange-300 font-medium underline"
              >
                Login
              </button>
            </p>
          </div>
        )}

        {/* Already logged in */}
        {user && (
          <div className="max-w-md mx-auto">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all disabled:opacity-50 text-lg"
            >
              {loading ? 'Processing...' : `Continue to Checkout`}
            </button>
          </div>
        )}

        {/* Back Link - Fixed with button instead of Link */}
        <div className="mt-8 text-center">
          <button
            onClick={handleBackToHome}
            className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
