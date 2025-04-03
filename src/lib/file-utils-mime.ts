/**
 * Get MIME type from file extension
 * @param fileName The file name to extract MIME type from
 * @returns The MIME type string or null if not recognized
 */
export function getMimeTypeFromFileName(fileName: string): string | null {
  if (!fileName) return null;

  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return null;

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    tif: "image/tiff",
    tiff: "image/tiff",

    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Text
    txt: "text/plain",
    csv: "text/csv",
    html: "text/html",
    htm: "text/html",
    xml: "text/xml",
    json: "application/json",
    md: "text/markdown",

    // Engineering drawings
    dwg: "application/acad",
    dxf: "application/dxf",
    dwf: "application/x-dwf",

    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",

    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",

    // Video
    mp4: "video/mp4",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    wmv: "video/x-ms-wmv",
  };

  return mimeTypes[extension] || null;
}
