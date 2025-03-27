import axios from "axios";

// Use the webhook URL directly from .env file
const N8N_WEBHOOK_URL =
  "http://localhost:5678/webhook-test/60d86fea-b650-4643-8368-a3d73e069eaa";

console.log("N8N_WEBHOOK_URL is set to:", N8N_WEBHOOK_URL);

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

  // Always proceed with the webhook call since we have a hardcoded URL
  console.log("Proceeding with n8n webhook notification");

  try {
    // Use the webhook URL from environment variables
    const webhookUrl = N8N_WEBHOOK_URL;
    console.log("Using n8n webhook URL:", webhookUrl);

    // Add additional logging to debug webhook issues
    console.log("Using hardcoded webhook URL");
    console.log("Full webhook request will be sent to:", webhookUrl);
    console.log("Sending metadata to n8n:", metadata);

    // Send ONLY metadata to n8n webhook (no file content)
    const response = await axios.post(webhookUrl, metadata, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });

    console.log("n8n webhook response status:", response.status);
    console.log("n8n webhook request successful");

    // Ensure extractedText is never undefined
    const responseData = response.data;
    if (responseData && responseData.extractedText === undefined) {
      responseData.extractedText = "";
    }

    return responseData;
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
