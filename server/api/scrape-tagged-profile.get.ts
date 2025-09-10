// // server/api/scrape-profile.get.ts

// server/api/scrape-profile.get.ts
import * as cheerio from "cheerio";
import {
  defineEventHandler,
  getQuery,
  createError,
  setResponseStatus,
} from "h3";

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event);
  if (!url || typeof url !== "string") {
    console.error("❌ Missing or invalid URL param:", url);
    throw createError({
      statusCode: 400,
      statusMessage: "Missing or invalid ?url= query parameter",
    });
  }

  console.log("🌐 Fetching challenge URL:", url);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    console.log("📡 Upstream status:", res.status, res.statusText);

    if (!res.ok) {
      throw new Error(
        `Upstream responded with ${res.status} ${res.statusText}`
      );
    }

    const html = await res.text();
    console.log("📄 HTML length:", html.length);

    const $ = cheerio.load(html);

    // 🔑 Extract characters from <b> tags with a value attribute
    const chars: string[] = [];
    $("b[value]").each((i, el) => {
      const val = $(el).attr("value");
      if (val) {
        console.log(`✅ Found char [${i}]:`, val);
        chars.push(val);
      } else {
        console.warn(`⚠️ Skipped element at index ${i} (no value attr)`);
      }
    });

    if (chars.length === 0) {
      console.error("❌ No characters extracted from <b> tags");
    }

    const hiddenString = chars.join("");
    console.log("🔑 Hidden string reconstructed:", hiddenString);

    return {
      hiddenString,
      length: hiddenString.length,
    };
  } catch (err: any) {
    console.error("💥 Scraping error:", err.message);
    setResponseStatus(event, 500);
    return { error: err.message };
  }
});

// import * as cheerio from "cheerio";
// import {
//   defineEventHandler,
//   getQuery,
//   createError,
//   setResponseStatus,
// } from "h3";

// export default defineEventHandler(async (event) => {
//   // 1️⃣ Validate query param
//   const { url } = getQuery(event);
//   if (!url || typeof url !== "string") {
//     throw createError({
//       statusCode: 400,
//       statusMessage: "Missing or invalid ?url= query parameter",
//     });
//   }

//   try {
//     // 2️⃣ Fetch the HTML (no Axios)
//     const res = await fetch(url, {
//       headers: {
//         "Cache-Control": "no-cache",
//         Pragma: "no-cache",
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
//       },
//     });

//     if (!res.ok) {
//       throw new Error(
//         `Upstream responded with ${res.status} ${res.statusText}`
//       );
//     }

//     const html = await res.text();

//     // 3️⃣ Parse with Cheerio
//     const $ = cheerio.load(html);
//     const formattedDisplayName =
//       $("#page_displayname_text").text().trim() || null;
//     const avatarUrl = $("#primary-photo img").attr("src") ?? null;

//     // 4️⃣ Return JSON
//     return { formattedDisplayName, avatarUrl };
//   } catch (err: any) {
//     console.error("Scraping error:", err.message);
//     setResponseStatus(event, 500);
//     return {
//       formattedDisplayName: null,
//       avatarUrl: null,
//       error: err.message,
//     };
//   }
// });
