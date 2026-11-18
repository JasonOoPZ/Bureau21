import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// Client-component pages. Everything else matched below is an async server
// component, so keep this list in sync when a page gains "use client".
const CLIENT_PAGES = [
  "src/app/forgot-password/page.tsx",
  "src/app/reset-password/page.tsx",
];

const config = [
  ...nextCoreWebVitals,
  {
    // `react-hooks/purity` guards against impure calls (Date.now, Math.random)
    // in components that re-render. Async server components render exactly
    // once per request, so reading the request time there is correct. The
    // rule stays on for every client component and for the client pages above.
    files: ["src/app/**/page.tsx", "src/app/**/layout.tsx"],
    ignores: CLIENT_PAGES,
    rules: {
      "react-hooks/purity": "off",
    },
  },
];

export default config;
