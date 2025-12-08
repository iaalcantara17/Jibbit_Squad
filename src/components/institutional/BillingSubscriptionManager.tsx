import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreditCard, AlertTriangle, Check, ExternalLink, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Sprint 3 UC-114: Corporate Career Services Integration
 * Billing and subscription management for team accounts
 * Implements graceful "not configured" state when Stripe is not set up
 */
export const BillingSubscriptionManager = () => {
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Check if Stripe is configured (would be set via environment)
  const isStripeConfigured = false; // Graceful fallback - Stripe not configured by default

  const { data: subscription } = useQuery({
    queryKey: ['institutional-subscription'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get institution settings to check subscription status
      const { data: settings } = await supabase
        .from('institutional_settings')
        .select('*')
        .eq('created_by', user.id)
        .single();

      if (!settings) return null;

      // Mock subscription data for demo purposes
      return {
        plan: 'starter',
        status: 'active',
        seats: 50,
        usedSeats: 12,
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        monthlyPrice: 499,
        institutionId: settings.id,
      };
    },
  });

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 499,
      seats: 50,
      features: [
        'Up to 50 students/members',
        'Basic analytics and reporting',
        'Email support',
        'White-label branding',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 999,
      seats: 200,
      features: [
        'Up to 200 students/members',
        'Advanced analytics',
        'Priority support',
        'Custom domain',
        'API access',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null, // Custom pricing
      seats: null, // Unlimited
      features: [
        'Unlimited students/members',
        'Dedicated account manager',
        'SLA guarantee',
        'Custom integrations',
        'On-premise deployment option',
      ],
    },
  ];

  const handleUpgrade = (planId: string) => {
    if (!isStripeConfigured) {
      toast.info('Payment processing is not yet configured. Please contact support to upgrade.');
      return;
    }
    setIsUpgrading(true);
    // Would redirect to Stripe checkout
    setTimeout(() => {
      toast.success('Upgrade initiated');
      setIsUpgrading(false);
    }, 1000);
  };

  const handleManageBilling = () => {
    if (!isStripeConfigured) {
      toast.info('Billing portal is not yet configured. Please contact support for billing inquiries.');
      return;
    }
    // Would redirect to Stripe customer portal
    toast.info('Opening billing portal...');
  };

  return (
    <div className="space-y-6">
      {/* Stripe not configured warning */}
      {!isStripeConfigured && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment Processing Not Configured</AlertTitle>
          <AlertDescription>
            Stripe integration is not yet set up. Billing features are displayed in demo mode.
            Contact your administrator to enable payment processing.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Manage your institutional subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold capitalize">{subscription.plan} Plan</h3>
                    <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Renews on {new Date(subscription.renewalDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${subscription.monthlyPrice}</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">
                          {subscription.usedSeats} / {subscription.seats}
                        </p>
                        <p className="text-sm text-muted-foreground">Seats Used</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          ${(subscription.monthlyPrice / subscription.seats * subscription.usedSeats).toFixed(0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Cost per Active Seat</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleManageBilling} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active subscription found.</p>
              <p className="text-sm">Choose a plan below to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the right plan for your institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${subscription?.plan === plan.id ? 'border-primary ring-2 ring-primary' : ''}`}
              >
                {subscription?.plan === plan.id && (
                  <Badge className="absolute -top-2 -right-2">Current</Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.price ? (
                      <>
                        <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    ) : (
                      <span className="text-lg font-semibold">Contact Sales</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={subscription?.plan === plan.id ? 'outline' : 'default'}
                    disabled={subscription?.plan === plan.id || isUpgrading}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {subscription?.plan === plan.id ? 'Current Plan' : plan.price ? 'Upgrade' : 'Contact Sales'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View past invoices and payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isStripeConfigured ? (
            <div className="space-y-2">
              {/* Would show actual invoices from Stripe */}
              <p className="text-center py-4 text-muted-foreground">
                Loading billing history...
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Billing history will be available once payment processing is configured.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
