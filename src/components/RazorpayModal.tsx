import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import ProfessionalDataModal from './ProfessionalDataModal';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface RazorpayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitle: string;
  ibbiId?: string;
  onPaymentComplete: () => void;
}

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayModal({ open, onOpenChange, itemTitle, ibbiId, onPaymentComplete }: RazorpayModalProps) {
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loadingProfessionalData, setLoadingProfessionalData] = useState(false);
  
  // Use refs to access current values in handler
  const ibbiIdRef = useRef(ibbiId);
  const onPaymentCompleteRef = useRef(onPaymentComplete);
  const onOpenChangeRef = useRef(onOpenChange);
  const fetchProfessionalDataRef = useRef<((ibbiId: string) => Promise<void>) | null>(null);
  const setLoadingProfessionalDataRef = useRef(setLoadingProfessionalData);

  // Update refs when props change
  useEffect(() => {
    ibbiIdRef.current = ibbiId;
    onPaymentCompleteRef.current = onPaymentComplete;
    onOpenChangeRef.current = onOpenChange;
    setLoadingProfessionalDataRef.current = setLoadingProfessionalData;
  }, [ibbiId, onPaymentComplete, onOpenChange]);

  // Fetch professional data from webhook
  const fetchProfessionalData = async (ibbiIdValue: string) => {
    try {
      // Loading state is already set in the payment handler
      // Get user's email from Firebase auth
      const currentUser = auth.currentUser;
      const email = currentUser?.email || '';
      
      if (!email) {
        throw new Error('User email not found. Please ensure you are logged in.');
      }
      
      setUserEmail(email);
      
      const response = await fetch('https://iamnikhilsharma.app.n8n.cloud/webhook/ibbi-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ibbi_id: ibbiIdValue,
          email: email
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Response received successfully - show confirmation modal
      await response.json(); // Consume response but don't need to store it
      setLoadingProfessionalData(false);
      setShowProfessionalModal(true);
    } catch (error) {
      console.error('Failed to fetch professional data:', error);
      toast.error('Failed to send email. Please try again.');
      setLoadingProfessionalData(false);
      // Even if webhook fails, complete the payment flow
      onPaymentCompleteRef.current();
    }
  };

  // Store function in ref
  useEffect(() => {
    fetchProfessionalDataRef.current = fetchProfessionalData;
  }, []);

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
        handler: async function (response: any) {
          console.log('Payment successful:', response);
          toast.success('Payment successful!');
          
          // Close the payment modal first
          setLoading(false);
          
          // If ibbi_id is available, fetch professional data
          const currentIbbiId = ibbiIdRef.current;
          if (currentIbbiId && fetchProfessionalDataRef.current) {
            // Set loading state BEFORE closing payment modal to show loader immediately
            setLoadingProfessionalDataRef.current(true);
            
            // Wait for React to process the state update and render the loader
            await new Promise(resolve => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  resolve(undefined);
                });
              });
            });
            
            // Close payment modal after loader is visible
            onOpenChangeRef.current(false);
            // Fetch and show professional data
            await fetchProfessionalDataRef.current(currentIbbiId);
          } else {
            // If no ibbi_id, just complete the payment flow
            onOpenChangeRef.current(false);
            onPaymentCompleteRef.current();
          }
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
    <>
      <Dialog open={open && !showProfessionalModal && !loadingProfessionalData} onOpenChange={onOpenChange}>
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
                disabled={loading || !razorpayLoaded || loadingProfessionalData}
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

      {/* Agent Working Loader Modal */}
      <Dialog open={loadingProfessionalData} onOpenChange={() => {}}>
        <DialogContent className="max-w-md w-full p-6 space-y-5">
          <DialogTitle>Processing Your Request</DialogTitle>
          <DialogDescription>
            Please wait while we process your information
          </DialogDescription>
          
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-green-600 animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-base font-semibold text-gray-900">
                Agent is working right now
              </p>
              <p className="text-sm text-gray-500">
                This may take a few moments...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Professional Data Modal */}
      <ProfessionalDataModal
        open={showProfessionalModal}
        onOpenChange={(open) => {
          setShowProfessionalModal(open);
          if (!open) {
            // Close payment modal and complete flow when professional modal closes
            onOpenChange(false);
            onPaymentCompleteRef.current();
          }
        }}
        userEmail={userEmail}
      />
    </>
  );
}
