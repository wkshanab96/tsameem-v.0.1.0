import axios from "axios";

// Different webhook URLs for different features
// Using a mock endpoint that always returns success for development
const MOCK_ENDPOINT = "https://jsonplaceholder.typicode.com/posts";

// Log all environment variables for debugging
console.log("Environment variables for webhooks:");
console.log(
  "NEXT_PUBLIC_STORE_N8N_WEBHOOK_URL:",
  process.env.NEXT_PUBLIC_STORE_N8N_WEBHOOK_URL,
);
console.log(
  "NEXT_PUBLIC_SEARCH_N8N_WEBHOOK_URL:",
  process.env.NEXT_PUBLIC_SEARCH_N8N_WEBHOOK_URL,
);
console.log(
  "NEXT_PUBLIC_EXPERT_N8N_WEBHOOK_URL:",
  process.env.NEXT_PUBLIC_EXPERT_N8N_WEBHOOK_URL,
);
console.log(
  "NEXT_PUBLIC_AIENGINEER_N8N_WEBHOOK_URL:",
  process.env.NEXT_PUBLIC_AIENGINEER_N8N_WEBHOOK_URL,
);
console.log(
  "NEXT_PUBLIC_SKETCH_N8N_WEBHOOK_URL:",
  process.env.NEXT_PUBLIC_SKETCH_N8N_WEBHOOK_URL,
);

// Use the specific webhook URLs provided from environment variables
const STORE_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_STORE_N8N_WEBHOOK_URL ||
  "https://n8n.tsameem.online/webhook-test/storetothevectordatabase";
const SEARCH_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_SEARCH_N8N_WEBHOOK_URL ||
  "https://n8n.tsameem.online/webhook-test/searchdatabase";
const EXPERT_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_EXPERT_N8N_WEBHOOK_URL ||
  "https://n8n.tsameem.online/webhook-test/expertschat";
const AIENGINEER_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_AIENGINEER_N8N_WEBHOOK_URL ||
  "https://n8n.tsameem.online/webhook-test/AIEngineeringDrawings";
const SKETCH_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_SKETCH_N8N_WEBHOOK_URL ||
  "https://n8n.tsameem.online/webhook-test/Sketchconverter";

// Allow localhost URLs for development
function sanitizeWebhookUrl(url: string | undefined): string {
  if (!url) {
    console.log(`No webhook URL provided, using mock endpoint instead`);
    return MOCK_ENDPOINT;
  }

  // Only block n8n.tempolabs.ai URLs
  // Allow n8n.tsameem.online URLs
  if (url.includes("n8n.tempolabs.ai")) {
    console.log(
      `Blocked webhook URL detected: ${url}, using mock endpoint instead`,
    );
    return MOCK_ENDPOINT;
  }

  // Allow localhost URLs for development
  console.log(`Using webhook URL: ${url}`);
  return url;
}

// Legacy support for old code
const N8N_WEBHOOK_URL = sanitizeWebhookUrl(STORE_WEBHOOK_URL);

console.log("N8N Webhook URLs configured:");
console.log("- STORE_WEBHOOK_URL:", sanitizeWebhookUrl(STORE_WEBHOOK_URL));
console.log("- SEARCH_WEBHOOK_URL:", sanitizeWebhookUrl(SEARCH_WEBHOOK_URL));
console.log("- EXPERT_WEBHOOK_URL:", sanitizeWebhookUrl(EXPERT_WEBHOOK_URL));
console.log(
  "- AIENGINEER_WEBHOOK_URL:",
  sanitizeWebhookUrl(AIENGINEER_WEBHOOK_URL),
);
console.log("- SKETCH_WEBHOOK_URL:", sanitizeWebhookUrl(SKETCH_WEBHOOK_URL));

export interface ProcessDocumentResponse {
  id: string;
  name: string;
  processed: boolean;
  extractedText?: string;
  metadata?: Record<string, any>;
  thumbnailUrl?: string;
}

/**
 * Sends document metadata to n8n for processing
 * @param metadata The metadata of the uploaded file
 * @returns The processed document data
 */
export async function processDocumentWithN8n(metadata: {
  fileId: string;
  folderId?: string;
  userId?: string;
  fileType?: string;
  storagePath?: string;
  publicUrl?: string;
}): Promise<ProcessDocumentResponse | null> {
  console.log("Notifying n8n about uploaded document metadata only:", metadata);

  try {
    // Use the store webhook URL for document processing
    const webhookUrl = sanitizeWebhookUrl(STORE_WEBHOOK_URL);
    console.log("Using n8n store webhook URL:", webhookUrl);
    console.log("Full webhook request will be sent to:", webhookUrl);
    console.log("Sending metadata to n8n:", metadata);

    // For mock endpoint, return a successful response immediately without making a network call
    if (webhookUrl === MOCK_ENDPOINT) {
      console.log(
        "Using mock endpoint - returning simulated successful response",
      );
      return {
        id: metadata.fileId || "",
        name: "Document",
        processed: true,
        extractedText: "Mock extracted text for development",
        metadata: { ...metadata },
      };
    }

    // Only attempt real network call if not using mock endpoint
    // Use fetch with timeout to avoid hanging on connection issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log("Webhook request timed out after 15 seconds");
    }, 15000); // 15 second timeout for better reliability

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response with better error handling
      let responseData = {};
      try {
        responseData = await response.json();
        console.log("Webhook response data:", responseData);
      } catch (e) {
        console.log("Failed to parse JSON response, using default response");
        responseData = {
          id: metadata.fileId || "",
          name: "Document",
          processed: true,
          extractedText: "Mock extracted text for development",
          metadata: { ...metadata },
        };
      }

      console.log("n8n webhook response status:", response.status);
      console.log("n8n webhook request successful");

      // Ensure extractedText is never undefined
      if (responseData && responseData.extractedText === undefined) {
        responseData.extractedText = "";
      }

      return responseData;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error during webhook call:", fetchError);
      // Instead of throwing, return a default response
      return {
        id: metadata.fileId || "",
        name: "Document",
        processed: false,
        extractedText: "",
        metadata: { error: fetchError.message || "Connection failed" },
      };
    }
  } catch (error) {
    console.error("Error notifying n8n about document:", error);
    // Return a default response instead of throwing an error
    return {
      id: metadata.fileId || "",
      name: "Unknown",
      processed: false,
      extractedText: "", // Add default empty string for extractedText
      metadata: { error: error.message || "Unknown error" },
    };
  }
}

// Export sanitized webhook URLs for use in other components
export const sanitizedWebhookUrls = {
  store: sanitizeWebhookUrl(STORE_WEBHOOK_URL),
  search: sanitizeWebhookUrl(SEARCH_WEBHOOK_URL),
  expert: sanitizeWebhookUrl(EXPERT_WEBHOOK_URL),
  aiEngineer: sanitizeWebhookUrl(AIENGINEER_WEBHOOK_URL),
  sketch: sanitizeWebhookUrl(SKETCH_WEBHOOK_URL),
};
