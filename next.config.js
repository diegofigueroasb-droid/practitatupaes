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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.your-domain.com https://js.clerk.com; connect-src 'self' https://clerk.your-domain.com; img-src 'self' https://img.clerk.com data:; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

export default config;
