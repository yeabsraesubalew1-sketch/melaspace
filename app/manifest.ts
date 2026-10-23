import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mela Space",
    short_name: "Mela",
    description: "A calm space for reflection, clarity, and personal growth.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f0e8",
    theme_color: "#5a4338",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
