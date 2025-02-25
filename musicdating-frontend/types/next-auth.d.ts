import 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    expires?: number
    user: {
      id: string
      name?: string
      email?: string
      image?: string
    }
  }
}
