import { Navigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { subscription, loading, hasActiveSubscription } = useSubscription();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Checking subscription...</p>
        </div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return <Navigate to="/subscribe" replace />;
  }

  // Show trial warning banner if on trial
  if (subscription.status === 'trial') {
    const daysLeft = subscription.currentPeriodEnd 
      ? Math.ceil((subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <>
        <div className="bg-yellow-500/20 border-b border-yellow-500 px-4 py-2 text-center text-yellow-200 text-sm">
          ⚠️ Trial: {daysLeft} days remaining. <a href="/subscribe" className="underline font-medium">Subscribe now</a>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
