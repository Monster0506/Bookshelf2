import { Readability } from "@mozilla/readability";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Disable the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

// Function to process HTML files
export const processHTMLFile = async (file) => {
  try {
    const fileContent = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(fileContent, "text/html");

    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) throw new Error("Could not parse article content.");

    // Generate the plaintext by removing HTML tags and classes
    const plaintext = article.textContent;

    const wordCount = plaintext.trim().split(/\s+/).length;
    const readingMinutes = Math.ceil(wordCount / 200);
    const readingTime = `${readingMinutes} minute${readingMinutes > 1 ? "s" : ""}`;

    return {
      content: article.content, // This retains the HTML structure for markdown rendering
      plaintext, // Stripped text content without HTML elements
      readingTime,
      wordCount,
    };
  } catch (error) {
    console.error("Error processing HTML file:", error);
    return {
      content: "",
      plaintext: "",
      readingTime: "",
      wordCount: 0,
    };
  }
};

export const processPDFFile = async (file) => {
  try {
    const fileData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
    let pdfText = "";

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      pdfText += pageText + " ";
    }

    // Generate the plaintext directly from the extracted text
    const plaintext = pdfText.trim();

    // Calculate reading time based on word count (assuming ~200 words per minute)
    const wordCount = plaintext.split(/\s+/).length;
    const readingMinutes = Math.ceil(wordCount / 200);
    const readingTime = `${readingMinutes} minute${readingMinutes > 1 ? "s" : ""}`;

    return {
      content: `<p>${plaintext.replace(/\n/g, "<br>")}</p>`, // Simple markdown content as HTML
      plaintext, // The raw text content
      readingTime,
      wordCount,
    };
  } catch (error) {
    console.error("Error processing PDF file:", error);
    return {
      content: "",
      plaintext: "",
      readingTime: "",
      wordCount: 0,
    };
  }
};
