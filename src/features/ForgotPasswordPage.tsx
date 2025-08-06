import { useState } from 'react'
import { firebaseForgotPassword } from '@/api/firebaseAuth'
import { toast } from 'sonner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ZapIcon } from 'lucide-react'
import AppSettings from '@/components/AppSettings'

const ForgotPasswordPage = () => {
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
    } catch (error: any) {
      console.error('Forgot password error:', error)
      toast.error(error.message || t('login.resetEmailError', 'Failed to send reset email'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <AppSettings className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-md" />
          </div>
          <Card className="w-full max-w-[480px] shadow-lg mx-4">
            <CardHeader className="flex items-center justify-center space-y-2 pb-8 pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center gap-3">
                  <img src="logo.svg" alt="LightRAG Logo" className="h-12 w-12" />
                  <ZapIcon className="size-10 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="text-center space-y-2">
                  
      <h2 className="text-2xl font-bold text-center">{t('login.forgotPassword', 'Forgot Password')}</h2>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
    <form onSubmit={handleForgotPassword} className="max-w-md mx-auto mt-10 space-y-6">
            <div className="flex items-center gap-4">
       <label htmlFor="username-input" className="text-sm font-medium w-16 shrink-0">
                {t('login.email','Email')}
              </label>
              <Input
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        required
        className="h-11 flex-1"
      />
      
    </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? t('login.sending', 'Sending...') : t('login.sendResetLink', 'Send Reset Link')}
      </Button>
    </form>
     </CardContent>
      </Card>
    </div>
  )
}

export default ForgotPasswordPage
