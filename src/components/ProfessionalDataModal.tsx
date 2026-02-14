import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

interface ProfessionalDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export default function ProfessionalDataModal({ open, onOpenChange, userEmail }: ProfessionalDataModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-6 space-y-5">
        <DialogTitle>Email Sent Successfully</DialogTitle>
        <DialogDescription>
          Your professional information has been sent to your email address.
        </DialogDescription>
        
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              An email has been sent to:
            </p>
            <p className="text-base font-semibold text-gray-900">
              {userEmail || 'your email address'}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Please check your inbox for the professional details.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
