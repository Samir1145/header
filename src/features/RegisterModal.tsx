import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/Dialog'
import { firebaseRegister, getUserMetadata } from '@/api/firebaseAuth'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/state'
import { ZapIcon } from 'lucide-react'
import { SiteInfo } from '@/lib/constants'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const RegisterModal = ({ open, onOpenChange }: Props) => {
    const { t } = useTranslation()
    const { login } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!email || !password) {
            toast.error(t('login.errorEmptyFields', 'Please enter email and password'))
            return
        }

        try {
            setLoading(true)
            const result = await firebaseRegister(email, password)
            const user = result.user

            // Save user to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                role: 'user',
                plan: 'free',
                createdAt: Timestamp.now(),
            })

            const metadata = await getUserMetadata(user?.uid)
            const token = await user.getIdToken()

            login(token, 'firebase', 'v1', null, null, metadata.role, metadata.plan)

            toast.success(t('login.successMessage', 'Registration successful!'))
            onOpenChange(false)
        } catch (error: any) {
            console.error('Registration error:', error)

            let errorMsg = t('login.errorInvalidCredentials', 'Something went wrong')
            if (error.code === 'auth/email-already-in-use') {
                errorMsg = 'This email is already registered.'
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = 'Invalid email format.'
            } else if (error.code === 'auth/weak-password') {
                errorMsg = 'Password should be at least 6 characters.'
            } else if (error.message) {
                errorMsg = error.message
            }

            toast.error(errorMsg)
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

                <form onSubmit={handleRegister} className="space-y-5 mt-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="username-input" className="text-sm font-medium w-16 shrink-0">
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
                        <label htmlFor="password-input" className="text-sm font-medium w-16 shrink-0">
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
            </DialogContent>
        </Dialog>
    )
}

export default RegisterModal
