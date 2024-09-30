import { Readability } from "@mozilla/readability";

export const fetchAndProcessContent = async (url) => {
  try {
    const proxyUrl = "https://cors-anywhere-three-pied.vercel.app/api/";

    // Encode the target URL
    const encodedUrl = encodeURIComponent(url);

    // Construct the full proxy URL
    const fullUrl = `${proxyUrl}${encodedUrl}`;
    console.log(fullUrl);
    const urlObject = new URL(url);
    const origin = urlObject.origin;
    console.log(origin);

    // Make the fetch request with the necessary headers
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        Origin: origin, // Add a dummy Origin header
      },
    });
    console.log(response);

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`,
      );
    }

    const htmlContent = await response.text();
    console.log(htmlContent);
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const reader = new Readability(doc);
    const article = reader.parse();
    console.log(article);

    if (!article) throw new Error("Could not parse article content.");

    const wordCount = article.textContent.trim().split(/\s+/).length;
    const readingMinutes = Math.ceil(wordCount / 200);
    const readingTime = `${readingMinutes} minute${readingMinutes > 1 ? "s" : ""}`;

    return {
      content: article.content,
      plaintext: article.textContent,
      readingTime,
      wordCount,
    };
  } catch (error) {
    console.error("Error fetching or processing content:", error);
    return {
      content: "",
      readingTime: "",
      wordCount: 0,
    };
  }
};
