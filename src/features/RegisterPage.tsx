import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/state'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ZapIcon } from 'lucide-react'
import AppSettings from '@/components/AppSettings'
import { SiteInfo } from '@/lib/constants'
import { firebaseRegister, getUserMetadata } from '@/api/firebaseAuth';
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    console.log('RegisterPage mounted')
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error(t('login.errorEmptyFields'));
      return;
    }

    try {
      setLoading(true);

      const result = await firebaseRegister(username, password);
      const user = result.user;
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'user',
        plan: 'free',
        createdAt: Timestamp.now()
      });
      const metadata = await getUserMetadata(user?.uid)

      // Token (optional, for backend access)
      const token = await user.getIdToken();

      login(
        token,
        'firebase',
        'v1',
        null,
        null,
        metadata.role,
        metadata.plan
      )
      toast.success(t('login.successMessage'));
      navigate('/');
    } catch (error: any) {
      console.error('Firebase registration error:', error);

      let errorMsg = t('login.errorInvalidCredentials'); // default fallback

      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email format.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'Password should be at least 6 characters.';
      } else if (error.message) {
        errorMsg = error.message;
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-3xl font-bold tracking-tight">{SiteInfo.name}</h1>
              <p className="text-muted-foreground text-sm">
                {t('login.description')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <label htmlFor="username-input" className="text-sm font-medium w-16 shrink-0">
                {t('login.email', 'Email')}
              </label>
              <Input
                id="username-input"
                placeholder={t('login.emailPlaceholder', 'Please input email')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 flex-1"
              />
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="password-input" className="text-sm font-medium w-16 shrink-0">
                {t('login.password')}
              </label>
              <Input
                id="password-input"
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 flex-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium mt-2"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
          <p className='text-right pt-1'>Already have an account? <Link className="text-green-600" to='/login'>Login Now</Link></p>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterPage
