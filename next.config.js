/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "script-src 'self' 'unsafe-eval' https://clerk.\#{Clerk.instanceDomain}\# js.globalstg.clerk.accounts.dev;",
          },
        ],
      },
    ];
  },
};

export default config;
