import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PracticaTuPAES",
    short_name: "PracticaPAES",
    description: "Prepárate para la PAES con preguntas oficiales DEMRE",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAFA",
    theme_color: "#0F766E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
