import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import {
    Dialog,
    DialogContent,
    DialogClose,
} from '@/components/ui/Dialog'
import { sqliteRegister } from '@/api/sqliteAuth'
import { useAuthStore } from '@/stores/state'
import { ZapIcon } from 'lucide-react'
import { SiteInfo } from '@/lib/constants'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onRegisterSuccess?: () => void
    onShowLogin?: () => void
}

const RegisterModal = ({ open, onOpenChange, onRegisterSuccess, onShowLogin }: Props) => {
    const { t } = useTranslation()
    const { login } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [loading, setLoading] = useState(false)

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!email || !password || !fullName || !phoneNumber || !confirmPassword) {
            toast.error(t('login.errorEmptyFields', 'Please fill in all fields'))
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long')
            return
        }

        // Basic phone number validation
        const phoneRegex = /^[0-9]{10}$/
        if (!phoneRegex.test(phoneNumber)) {
            toast.error('Please enter a valid 10-digit phone number')
            return
        }

        try {
            setLoading(true)

            // Use SQLite auth
            const result = await sqliteRegister(email, password, fullName, phoneNumber)

            // Store the token
            localStorage.setItem('LIGHTRAG-API-TOKEN', result.token)

            // Update auth store
            login(
                result.token,
                'sqlite',
                'v1',
                null,
                null,
                result.user.role,
                result.user.plan
            )

            toast.success(t('login.successMessage', 'Registration successful!'))
            onOpenChange(false)

            // Call success callback if provided
            if (onRegisterSuccess) {
                onRegisterSuccess()
            }
        } catch (error: any) {
            console.error('Registration error:', error)
            toast.error(error.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">

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

                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="fullname-input" className="text-sm font-medium w-20 shrink-0">
                            Full Name
                        </label>
                        <Input
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="h-11 flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="email-input" className="text-sm font-medium w-20 shrink-0">
                            {t('login.email', 'Email')}
                        </label>
                        <Input
                            type="email"
                            placeholder={t('login.emailPlaceholder', 'Enter your email')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11 flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="phone-input" className="text-sm font-medium w-20 shrink-0">
                            Phone
                        </label>
                        <Input
                            type="tel"
                            placeholder="Enter your phone number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                            className="h-11 flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="password-input" className="text-sm font-medium w-20 shrink-0">
                            {t('login.password')}
                        </label>
                        <Input
                            type="password"
                            placeholder={t('login.passwordPlaceholder', 'Enter your password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11 flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="confirm-password-input" className="text-sm font-medium w-20 shrink-0">
                            Confirm
                        </label>
                        <Input
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="h-11 flex-1"
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                                {t('cancel', 'Cancel')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>
                            {loading ? t('login.registering', 'Registering...') : t('login.register', 'Register')}
                        </Button>
                    </div>
                </form>

                <p className='text-right pt-1'>Already have an account?
                    <button className="text-green-600 ml-1" onClick={() => onShowLogin ? onShowLogin() : onOpenChange(false)}>
                        Login Now
                    </button>
                </p>
            </DialogContent>
        </Dialog>
    )
}

export default RegisterModal
