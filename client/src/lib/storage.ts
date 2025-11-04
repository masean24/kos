/**
 * Client-side storage helper for uploading files to S3
 * Uses tRPC procedure to get presigned URL from server
 */

export async function storagePut(
  key: string,
  data: Uint8Array | Buffer | string,
  contentType?: string
): Promise<{ url: string; key: string }> {
  // Convert data to base64
  let base64: string;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    // Convert Uint8Array to base64
    const arr = Array.from(data);
    base64 = btoa(String.fromCharCode.apply(null, arr as any));
  }
  
  const response = await fetch('/api/trpc/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      data: base64,
      contentType: contentType || 'application/octet-stream',
    }),
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  
  const result = await response.json();
  return result.result.data;
}
