import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · Private period tracker`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/tracker",
    display: "standalone",
    background_color: "#fbf6f3",
    theme_color: "#7d304b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
