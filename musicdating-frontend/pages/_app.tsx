import { ChakraProvider, useToast } from '@chakra-ui/react'
import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'
import theme from '../styles/theme'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps }
}: AppProps) {
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Client-side error:', error)
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [toast])

  return (
    <SessionProvider session={session}>
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </SessionProvider>
  )
}
