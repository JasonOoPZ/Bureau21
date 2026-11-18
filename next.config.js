const isDev = process.env.NODE_ENV !== "production";

/*
 * Content-Security-Policy is shipped in REPORT-ONLY mode: it blocks nothing,
 * browsers just log violations to the console. Tighten it and switch the
 * header name to `Content-Security-Policy` once the console stays clean.
 *
 * External hosts were audited from the source:
 *  - Fonts: next/font/google self-hosts Orbitron and Space Grotesk at build
 *    time, so no fonts.googleapis.com / fonts.gstatic.com at runtime.
 *  - Images: everything is served from /public. Google profile pictures
 *    (lh3.googleusercontent.com) are allowed in case User.image is rendered.
 *  - Google OAuth is a top-level form POST + redirect, hence form-action.
 *  - thirdweb: only <ThirdwebProvider> is mounted today; its API hosts are
 *    allowed so wiring up a wallet button does not start with CSP noise.
 *  - 'unsafe-inline' is required by Next's inline bootstrap scripts until
 *    nonces are wired through middleware; 'unsafe-eval' is dev-only (HMR).
 */
const cspReportOnly = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  "font-src 'self' data:",
  `connect-src 'self' https://*.thirdweb.com${isDev ? " ws: wss:" : ""}`,
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Ignored by browsers over plain http, so local dev is unaffected.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
