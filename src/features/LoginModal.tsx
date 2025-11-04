// components/LoginModal.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { useAuthStore } from '@/stores/state';
import { toast } from 'sonner';
import { firebaseLogin, getUserMetadata } from '@/api/firebaseAuth';
import { useTranslation } from 'react-i18next';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import ForgotPasswordModal from '@/features/ForgotPasswordModal';
import RegisterModal from '@/features/RegisterModal';
import { ZapIcon } from 'lucide-react'
import { SiteInfo } from '@/lib/constants'

interface LoginModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLoginSuccess?: () => void;
    onShowRegister?: () => void;
}

export default function LoginModal({ open, onOpenChange, onLoginSuccess, onShowRegister }: LoginModalProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error(t('login.errorEmptyFields') || 'Email and password are required.');
            return;
        }

        try {
            setLoading(true);
            const result = await firebaseLogin(email, password);
            const token = await result.user.getIdToken();
            const metadata = await getUserMetadata(result.user.uid);

            login(token, 'firebase', 'v1', null, null, metadata.role, metadata.plan);
            toast.success(t('login.successMessage') || 'Login successful!');

            onOpenChange(false);
            
            // Call success callback if provided
            if (onLoginSuccess) {
                onLoginSuccess();
            } else {
                navigate('/');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            let msg = t('login.errorInvalidCredentials') || 'Invalid credentials';

            switch (error.code) {
                case 'auth/user-not-found':
                    msg = 'No user found with this email.';
                    break;
                case 'auth/wrong-password':
                    msg = 'Incorrect password.';
                    break;
                case 'auth/invalid-email':
                    msg = 'Invalid email format.';
                    break;
                case 'auth/invalid-credential':
                    msg = 'Invalid login credentials.';
                    break;
                default:
                    msg = error.message || msg;
            }

            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md w-full p-6 space-y-5">

                    <div className="flex flex-col items-center space-y-4">
                        <div className="flex items-center gap-3">
                            <img src="logo.svg" alt="LightRAG Logo" className="h-12 w-12" />
                            <ZapIcon className="size-10 text-emerald-400" aria-hidden="true" />
                        </div>
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">{SiteInfo.name}</h1>
                            <p className="text-muted-foreground text-sm">
                                {t('login.description')}
                            </p>
                        </div>
                    </div>


                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* <h2 className="text-2xl font-semibold text-center">Login</h2> */}
                        <div className="flex items-center gap-4">
                            <label htmlFor="username-input" className="text-sm font-medium w-16 shrink-0">
                                {t('login.email', 'Email')}
                            </label> <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="h-11 flex-1"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label htmlFor="password-input" className="text-sm font-medium w-16 shrink-0">
                                {t('login.password')}
                            </label>
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="h-11 flex-1"
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>


                    <p className='text-right pt-1'>Don't have Account?
                        <button className="text-green-600" onClick={() => onShowRegister ? onShowRegister() : setShowRegisterModal(true)} >Register Now</button></p>
                    <p className="text-sm mt-2 text-right">
                        <button onClick={() => setShowForgotModal(true)} className="text-blue-500 hover:underline">
                            Forgot Password?
                        </button>
                    </p>


                </DialogContent>
            </Dialog>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal open={showForgotModal} onOpenChange={setShowForgotModal} />

            {/* Register Modal */}
            <RegisterModal open={showRegisterModal} onOpenChange={setShowRegisterModal} />
        </>
    );
}
