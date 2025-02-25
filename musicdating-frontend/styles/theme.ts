import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: '#121212',
        color: 'white',
      },
    },
  },
  colors: {
    brand: {
      spotify: '#1DB954',
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          bg: 'brand.spotify',
          color: 'white',
          _hover: {
            bg: '#1ed760',
          },
        },
      },
    },
  },
  fonts: {
    heading: 'var(--font-circular), sans-serif',
    body: 'var(--font-circular), sans-serif',
  },
  breakpoints: {
    sm: '320px',
    md: '768px',
    lg: '960px',
    xl: '1200px',
  },
})

export default theme
