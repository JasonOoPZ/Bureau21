export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/lobby/:path*", "/admin/:path*"],
};
