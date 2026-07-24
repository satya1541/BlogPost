import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const bucketName = process.env.AWS_S3_BUCKET || "blog-post1541";
const region = process.env.AWS_REGION || "ap-south-2";

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Uploads a Buffer directly to AWS S3 and returns the public CDN/S3 URL.
 */
export async function uploadToS3(
  buffer: Buffer,
  filename: string,
  contentType: string = "image/png"
): Promise<string> {
  const key = `uploads/${filename}`;
  console.log(`[S3 Upload] Uploading ${key} to bucket ${bucketName} (${region})...`);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  console.log(`[S3 Upload] Successfully uploaded to S3: ${publicUrl}`);
  return publicUrl;
}

/**
 * Deletes an object from AWS S3 using its S3 URL.
 */
export async function deleteFromS3(s3Url: string): Promise<void> {
  if (!s3Url || !s3Url.includes(bucketName)) return;

  try {
    const urlObj = new URL(s3Url);
    const key = urlObj.pathname.startsWith("/") ? urlObj.pathname.slice(1) : urlObj.pathname;
    console.log(`[S3 Delete] Deleting object key: ${key}`);

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    console.log(`[S3 Delete] Successfully deleted ${key} from S3`);
  } catch (error: any) {
    console.warn(`[S3 Delete] Failed to delete ${s3Url}:`, error.message);
  }
}
