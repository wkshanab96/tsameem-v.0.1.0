import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "N8N_WEBHOOK_URL is not configured" },
        { status: 400 },
      );
    }

    console.log("Testing webhook connection to:", webhookUrl);

    // Create a simple test payload
    const formData = new FormData();
    const testFile = new Blob(["test content"], { type: "text/plain" });
    formData.append("file", testFile, "test.txt");
    formData.append(
      "metadata",
      JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
      }),
    );

    // Send test request to webhook
    const response = await axios.post(webhookUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 10000,
    });

    return NextResponse.json({
      success: true,
      message: "Webhook test successful",
      status: response.status,
      data: response.data,
    });
  } catch (error) {
    console.error("Error testing webhook:", error);

    let errorMessage = "Unknown error";
    let statusCode = 500;
    let responseData = null;

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      statusCode = error.response.status;
      errorMessage = `Server responded with status: ${error.response.status}`;
      responseData = error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = "No response received from webhook server";
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
        responseData,
        webhookUrl: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL,
      },
      { status: statusCode },
    );
  }
}
