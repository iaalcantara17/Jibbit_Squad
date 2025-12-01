import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface SessionPaymentProps {
  sessionId: string;
  advisorId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate?: string;
  invoiceUrl?: string;
}

export const SessionPayment = ({ sessionId, advisorId, amount, status, paymentDate, invoiceUrl }: SessionPaymentProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Fallback payment tracking (no actual Stripe integration)
    // In production, this would integrate with Stripe checkout
    setTimeout(() => {
      setIsProcessing(false);
      alert('Payment processing simulated (Stripe not configured). Status would be updated in session_payments table.');
    }, 1500);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>
          Session billing and invoice information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Session Fee</p>
            <p className="text-2xl font-bold">${amount}</p>
          </div>
          <Badge variant={getStatusColor()}>{status}</Badge>
        </div>

        {paymentDate && (
          <div>
            <p className="text-sm text-muted-foreground">Payment Date</p>
            <p className="text-sm font-medium">{format(new Date(paymentDate), 'MMM d, yyyy')}</p>
          </div>
        )}

        {status === 'pending' && (
          <Button onClick={handlePayment} disabled={isProcessing} className="w-full">
            {isProcessing ? 'Processing...' : 'Pay Now'}
          </Button>
        )}

        {status === 'completed' && (
          <div className="space-y-2">
            {invoiceUrl ? (
              <Button variant="outline" className="w-full" asChild>
                <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </a>
              </Button>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                <Download className="h-4 w-4 mr-2" />
                Invoice Not Available
              </Button>
            )}
          </div>
        )}

        <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm text-amber-900 dark:text-amber-100">
          <p className="font-semibold mb-1">⚠ Payment Integration Status</p>
          <p>Stripe integration not configured. This is a fallback implementation that tracks payment status and invoices. In production, this would integrate with Stripe checkout and webhooks.</p>
        </div>
      </CardContent>
    </Card>
  );
};
