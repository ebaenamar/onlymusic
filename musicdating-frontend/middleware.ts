import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
})

export const config = {
  matcher: [
    "/",
    "/api/match/:path*",
    "/api/moments/:path*",
  ]
}
