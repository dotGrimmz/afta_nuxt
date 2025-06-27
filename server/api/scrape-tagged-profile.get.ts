// server/api/scrape-profile.get.ts
import * as cheerio from "cheerio";
import {
  defineEventHandler,
  getQuery,
  createError,
  setResponseStatus,
} from "h3";

export default defineEventHandler(async (event) => {
  // 1️⃣ Validate query param
  const { url } = getQuery(event);
  if (!url || typeof url !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing or invalid ?url= query parameter",
    });
  }

  try {
    // 2️⃣ Fetch the HTML (no Axios)
    const res = await fetch(url, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!res.ok) {
      throw new Error(
        `Upstream responded with ${res.status} ${res.statusText}`
      );
    }

    const html = await res.text();

    // 3️⃣ Parse with Cheerio
    const $ = cheerio.load(html);
    const formattedDisplayName =
      $("#page_displayname_text").text().trim() || null;
    const avatarUrl = $("#primary-photo img").attr("src") ?? null;

    // 4️⃣ Return JSON
    return { formattedDisplayName, avatarUrl };
  } catch (err: any) {
    console.error("Scraping error:", err.message);
    setResponseStatus(event, 500);
    return {
      formattedDisplayName: null,
      avatarUrl: null,
      error: err.message,
    };
  }
});
