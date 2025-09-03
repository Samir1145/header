import { StrictMode } from 'react'
import App from '@/App'
import '@/i18n' // Import i18n to initialize it

export const Root = () => {
  return (
    <StrictMode>
      <App />
    </StrictMode>
  )
}
