import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://app.trips.bd";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/stays", changefreq: "daily", priority: "0.9" },
  { path: "/flights", changefreq: "daily", priority: "0.9" },
  { path: "/activities", changefreq: "daily", priority: "0.9" },
  { path: "/trains", changefreq: "weekly", priority: "0.7" },
  { path: "/transfers", changefreq: "weekly", priority: "0.7" },
  { path: "/cars", changefreq: "weekly", priority: "0.7" },
  { path: "/esim", changefreq: "weekly", priority: "0.7" },
  { path: "/packages", changefreq: "weekly", priority: "0.7" },
  { path: "/deals", changefreq: "daily", priority: "0.8" },
  { path: "/host", changefreq: "monthly", priority: "0.5" },
  { path: "/support", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/account/delete", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        try {
          const { publicClient } = await import("@/lib/supabase-public");
          const sb = publicClient();
          const pageSize = 1000;

          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await sb
              .from("listings")
              .select("slug")
              .eq("is_published", true)
              .order("slug")
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            entries.push(
              ...(data ?? []).map((row) => ({
                path: `/listing/${encodeURIComponent(row.slug)}`,
                changefreq: "weekly" as const,
                priority: "0.6",
              })),
            );
            if (!data || data.length < pageSize) break;
          }

          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await sb
              .from("activities")
              .select("slug")
              .order("slug")
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            entries.push(
              ...(data ?? []).map((row) => ({
                path: `/activities/${encodeURIComponent(row.slug)}`,
                changefreq: "weekly" as const,
                priority: "0.6",
              })),
            );
            if (!data || data.length < pageSize) break;
          }
        } catch (err) {
          console.error("sitemap: dynamic entries unavailable", err);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
