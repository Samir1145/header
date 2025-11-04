import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';

interface RazorpayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitle: string;
  onPaymentComplete: () => void;
}

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayModal({ open, onOpenChange, itemTitle, onPaymentComplete }: RazorpayModalProps) {
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    if (open) {
      loadRazorpayScript();
    }
  }, [open]);

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment system is loading, please wait...');
      return;
    }

    setLoading(true);

    try {
      // For development/testing, we'll create a direct payment without order creation
      // In production, you should create orders on your backend
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RXLztVsNvcDWNY', // Use the key from console logs
        amount: 9999, // Amount in paise (₹99.99)
        currency: 'INR',
        name: 'Resolution Bazaar',
        description: `Purchase: ${itemTitle}`,
        handler: function (response: any) {
          console.log('Payment successful:', response);
          toast.success('Payment successful!');
          onPaymentComplete();
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        notes: {
          item: itemTitle,
          timestamp: new Date().toISOString()
        },
        theme: {
          color: '#10b981'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-6 space-y-5">
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogDescription>
          Complete your purchase for {itemTitle}
        </DialogDescription>
        
        <div className="text-center space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">{itemTitle}</h3>
            <p className="text-gray-600 mt-2">Amount: ₹99.99</p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            >
              {loading ? 'Processing...' : 'Pay with Razorpay'}
            </Button>
            
            <Button 
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          {!razorpayLoaded && (
            <p className="text-sm text-gray-500">
              Loading payment system...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
