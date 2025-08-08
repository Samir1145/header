import { useState } from 'react'
import { firebaseForgotPassword } from '@/api/firebaseAuth'
import { toast } from 'sonner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/Dialog'
import { ZapIcon } from 'lucide-react'

const ForgotPasswordModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const { t } = useTranslation()

    const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!email) {
            toast.error(t('login.errorEmptyFields', 'Please enter your email'))
            return
        }

        try {
            setLoading(true)
            await firebaseForgotPassword(email)
            toast.success(t('login.resetEmailSent', 'Reset email sent successfully!'))
            setEmail('')
            onOpenChange(false) // close modal
        } catch (error: any) {
            console.error('Forgot password error:', error)
            toast.error(error.message || t('login.resetEmailError', 'Failed to send reset email'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <ZapIcon className="size-5 text-emerald-400" />
                        {t('login.forgotPassword', 'Forgot Password')}
                    </DialogTitle>
                    <DialogDescription>{t('login.enterEmailReset', 'Enter your email to receive a reset link.')}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleForgotPassword} className="space-y-6 mt-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="username-input" className="text-sm font-medium w-16 shrink-0">
                            {t('login.email', 'Email')}
                        </label> <Input
                            type="email"
                            placeholder={t('login.emailPlaceholder', 'Enter your email')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11 flex-1"
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <DialogClose asChild>
                            <Button variant="ghost" type="button">{t('cancel', 'Cancel')}</Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>
                            {loading ? t('login.sending', 'Sending...') : t('login.sendResetLink', 'Send Reset Link')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default ForgotPasswordModal
