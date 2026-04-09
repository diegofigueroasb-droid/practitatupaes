import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
});

import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {};

export default withPWA(config);
