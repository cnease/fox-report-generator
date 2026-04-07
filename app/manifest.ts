import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fox Report Generator",
    short_name: "Fox Reports",
    description: "Fox Pest Control report generator",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#111111",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192-v2.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-v2.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable-v2.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}