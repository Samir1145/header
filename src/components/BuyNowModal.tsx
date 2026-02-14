import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { useAuthStore } from '@/stores/state';
import Button from '@/components/ui/Button';
import LoginModal from '@/features/LoginModal';
import RegisterModal from '@/features/RegisterModal';
import RazorpayModal from '@/components/RazorpayModal';

interface BuyNowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitle: string;
  itemDescription?: string;
}

export default function BuyNowModal({ open, onOpenChange, itemTitle, itemDescription }: BuyNowModalProps) {
  const { isAuthenticated } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  const handleBuyNow = () => {
    if (isAuthenticated) {
      // User is logged in, close this modal first, then open Razorpay
      onOpenChange(false);
      // Small delay to ensure modal closes before opening Razorpay
      setTimeout(() => {
        setShowRazorpayModal(true);
      }, 100);
    } else {
      // User not logged in, show login/register options
      setShowLoginModal(true);
    }
  };

  const handleShowRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleShowLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleLoginSuccess = () => {
    // Close all modals first
    setShowLoginModal(false);
    onOpenChange(false);
    // Small delay to ensure modals close before opening Razorpay
    setTimeout(() => {
      setShowRazorpayModal(true);
    }, 100);
  };

  const handleRegisterSuccess = () => {
    // Close all modals first
    setShowRegisterModal(false);
    onOpenChange(false);
    // Small delay to ensure modals close before opening Razorpay
    setTimeout(() => {
      setShowRazorpayModal(true);
    }, 100);
  };

  const handlePaymentComplete = () => {
    setShowRazorpayModal(false);
    onOpenChange(false);
  };

  // Close all modals when RazorpayModal opens to prevent overlay stacking
  useEffect(() => {
    if (showRazorpayModal) {
      // Close BuyNowModal
      if (open) {
        onOpenChange(false);
      }
      // Close LoginModal if open
      if (showLoginModal) {
        setShowLoginModal(false);
      }
      // Close RegisterModal if open
      if (showRegisterModal) {
        setShowRegisterModal(false);
      }
    }
  }, [showRazorpayModal, open, showLoginModal, showRegisterModal, onOpenChange]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-full p-6 space-y-5">
          <DialogTitle>Purchase Item</DialogTitle>
          <DialogDescription>
            Ready to purchase this item?
          </DialogDescription>
          
          <div className="text-center space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">{itemTitle}</h3>
              <p className="text-gray-600 mt-2">Ready to purchase this item?</p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={handleBuyNow}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              >
                Buy Now
              </Button>
              
              <Button 
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={(open) => {
          setShowLoginModal(open);
          if (!open && !showRazorpayModal) {
            // If login modal is closed and payment modal is not open, close the main modal
            onOpenChange(false);
          }
        }}
        onLoginSuccess={handleLoginSuccess}
        onShowRegister={handleShowRegister}
      />

      {/* Register Modal */}
      <RegisterModal 
        open={showRegisterModal} 
        onOpenChange={(open) => {
          setShowRegisterModal(open);
          if (!open && !showRazorpayModal) {
            // If register modal is closed and payment modal is not open, close the main modal
            onOpenChange(false);
          }
        }}
        onRegisterSuccess={handleRegisterSuccess}
        onShowLogin={handleShowLogin}
      />

      {/* Razorpay Payment Modal */}
      <RazorpayModal
        open={showRazorpayModal}
        onOpenChange={setShowRazorpayModal}
        itemTitle={itemTitle}
        ibbiId={itemDescription}
        onPaymentComplete={handlePaymentComplete}
      />
    </>
  );
}
