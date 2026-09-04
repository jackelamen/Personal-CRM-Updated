import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rolodex — Personal CRM",
    short_name: "Rolodex",
    description:
      "Keep track of the people you know: notes, labels and follow-ups that do not slip.",
    // standalone drops the browser chrome, so an installed copy opens like an app.
    display: "standalone",
    orientation: "portrait",
    start_url: "/",
    scope: "/",
    background_color: "#0e1014",
    theme_color: "#0e1014",
    categories: ["productivity", "business"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        // Safe-area artwork, so Android can crop to any device mask.
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Add contact", url: "/people/new" },
      { name: "People", url: "/people" },
    ],
  };
}
