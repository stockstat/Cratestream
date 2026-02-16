import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

export interface Subscription {
  status: 'active' | 'canceled' | 'trial' | 'none';
  plan: 'monthly' | 'annual' | null;
  subscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>({
    status: 'none',
    plan: null,
    subscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription({
        status: 'none',
        plan: null,
        subscriptionId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false
      });
      setLoading(false);
      return;
    }

    // Listen to user's subscription status in real-time
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          // Check if subscription has expired
          const subscriptionEnd = data.subscriptionEnd?.toDate();
          const now = new Date();
          
          let status = data.subscriptionStatus || 'none';
          
          // If trial/active but expired, update to none
          if (subscriptionEnd && now > subscriptionEnd && (status === 'trial' || status === 'active')) {
            status = 'none';
          }
          
          setSubscription({
            status,
            plan: data.subscriptionPlan || null,
            subscriptionId: data.subscriptionId || null,
            currentPeriodEnd: subscriptionEnd || null,
            cancelAtPeriodEnd: data.cancelAtPeriodEnd || false
          });
          setLoading(false);
        } else {
          // NEW USER - Automatically create a 7-day trial
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now
          
          try {
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              subscriptionStatus: 'trial',
              subscriptionPlan: null,
              subscriptionId: null,
              subscriptionEnd: trialEndDate,
              cancelAtPeriodEnd: false,
              createdAt: new Date()
            });
            
            // Set local state
            setSubscription({
              status: 'trial',
              plan: null,
              subscriptionId: null,
              currentPeriodEnd: trialEndDate,
              cancelAtPeriodEnd: false
            });
          } catch (error) {
            console.error('Error creating trial:', error);
            // Fall back to no subscription
            setSubscription({
              status: 'none',
              plan: null,
              subscriptionId: null,
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false
            });
          }
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching subscription:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const hasActiveSubscription = subscription.status === 'active' || subscription.status === 'trial';

  return {
    subscription,
    loading,
    hasActiveSubscription
  };
}
