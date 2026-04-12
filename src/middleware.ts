export default function middleware() {
  // No authentication required
}

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)((?!).*)",
  ],
};