import 'dotenv/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as JimpModule from 'jimp';
import { prisma } from '../db-store.js';
import jwt from 'jsonwebtoken';

const Jimp = ((JimpModule as any).default || (JimpModule as any).Jimp || JimpModule) as any;

// Environment Configs
const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME;
const REGION = process.env.STORAGE_REGION || 'us-east-1';
const ENDPOINT = process.env.STORAGE_ENDPOINT;
const ACCESS_KEY_ID = process.env.STORAGE_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.STORAGE_SECRET_ACCESS_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'BaytiAI_Storage_Secret_Key_2026';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Initialize S3 if configured
let s3Client: S3Client | null = null;
const isS3Configured = !!(BUCKET_NAME && ACCESS_KEY_ID && SECRET_ACCESS_KEY);

if (isS3Configured) {
  console.log(`[Storage Service] Initializing S3 Client for bucket: ${BUCKET_NAME}`);
  s3Client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID!,
      secretAccessKey: SECRET_ACCESS_KEY!,
    },
    ...(ENDPOINT ? { endpoint: ENDPOINT, forcePathStyle: true } : {}),
  });
} else {
  console.log('[Storage Service] S3 configuration missing. Operating in PostgreSQL Binary Fallback mode.');
}

/**
 * Compress and optimize uploaded images
 */
async function optimizeAndCompressImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  // Only optimize if it's an image
  if (!mimeType.startsWith('image/')) {
    return { buffer, mimeType };
  }

  // Skip SVG or GIFs since Jimp might not handle them well or they are vector/animated
  if (mimeType.includes('svg') || mimeType.includes('gif')) {
    return { buffer, mimeType };
  }

  try {
    const image = await Jimp.read(buffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // 1. Resize if image is extremely large (max width/height 1200px)
    if (width > 1200 || height > 1200) {
      image.resize(1200, Jimp.AUTO || -1);
    }

    // 2. Reduce quality to 80% to compress file size heavily with negligible loss of visual quality
    image.quality(80);

    // Get MIME type or fallback to image/jpeg
    const targetMime = mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/webp'
      ? mimeType
      : 'image/jpeg';

    // Support getBufferAsync safely across Jimp versions
    const compressedBuffer = typeof image.getBufferAsync === 'function'
      ? await image.getBufferAsync(targetMime)
      : await new Promise<Buffer>((resolve, reject) => {
          image.getBuffer(targetMime, (err: any, buf: Buffer) => {
            if (err) reject(err);
            else resolve(buf);
          });
        });

    console.log(`[Storage Service] Image optimized: ${width}x${height} -> ${image.bitmap.width}x${image.bitmap.height}. Size reduced from ${buffer.length} to ${compressedBuffer.length} bytes.`);
    return { buffer: compressedBuffer, mimeType: targetMime };
  } catch (error) {
    console.error('[Storage Service] Image optimization failed, uploading raw file:', error);
    return { buffer, mimeType };
  }
}

/**
 * Generate secure signed URL for reading a file
 */
export async function generateSecureSignedUrl(key: string, expirySeconds: number = 3600): Promise<string> {
  // 1. Check S3 mode
  if (isS3Configured && s3Client) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: expirySeconds });
    } catch (err) {
      console.error('[Storage Service] S3 signed URL error, falling back to local proxy:', err);
    }
  }

  // 2. DB fallback mode: generate JWT-signed endpoint URL
  const token = jwt.sign({ key, exp: Math.floor(Date.now() / 1000) + expirySeconds }, JWT_SECRET);
  return `${APP_URL}/api/storage/file/${key}?token=${token}`;
}

/**
 * Upload a file to cloud storage (S3 or DB fallback)
 */
export async function uploadFile(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  userId?: string
): Promise<{ key: string; url: string; size: number }> {
  // 1. Optimize and compress images
  const { buffer, mimeType: finalMime } = await optimizeAndCompressImage(fileBuffer, mimeType);
  const size = buffer.length;

  // Generate unique file key (avoid conflicts)
  const uniqueId = Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const key = `${userId || 'anon'}/${uniqueId}_${cleanFilename}`;

  let url = '';

  if (isS3Configured && s3Client) {
    // S3 upload mode
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: finalMime,
        })
      );
      
      // S3 URLs can be structured cleanly
      url = `${ENDPOINT || `https://s3.${REGION}.amazonaws.com`}/${BUCKET_NAME}/${key}`;
      console.log(`[Storage Service] Uploaded file to S3: ${key}`);
    } catch (err: any) {
      console.error('[Storage Service] S3 upload failed, reverting to DB storage:', err.message);
    }
  }

  // If S3 failed or wasn't configured, we store in DB fallback
  if (!url) {
    console.log(`[Storage Service] Saving file to PostgreSQL: ${key}`);
    url = `${APP_URL}/api/storage/file/${key}`;
  }

  // Save/register file metadata inside PostgreSQL CloudFile model
  const cloudFile = await prisma.cloudFile.create({
    data: {
      key,
      url,
      mimeType: finalMime,
      size,
      userId,
      data: !url.includes('amazonaws.com') ? buffer : null, // Only store binary data if S3 is not used
    },
  });

  // Generate secure signed URL for the user
  const signedUrl = await generateSecureSignedUrl(key);

  return {
    key,
    url: signedUrl,
    size,
  };
}

/**
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const cloudFile = await prisma.cloudFile.findUnique({
      where: { key },
    });

    if (!cloudFile) {
      console.warn(`[Storage Service] File key not found in database: ${key}`);
      return false;
    }

    // 1. Delete from S3 if configured
    if (isS3Configured && s3Client && cloudFile.url.includes('amazonaws.com')) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          })
        );
        console.log(`[Storage Service] Deleted from S3: ${key}`);
      } catch (err: any) {
        console.error(`[Storage Service] S3 delete failed for key ${key}:`, err.message);
      }
    }

    // 2. Delete from PostgreSQL
    await prisma.cloudFile.delete({
      where: { key },
    });

    console.log(`[Storage Service] File metadata deleted from DB: ${key}`);
    return true;
  } catch (error: any) {
    console.error(`[Storage Service] File deletion failed for key ${key}:`, error);
    return false;
  }
}

/**
 * Replace an existing file with a new file
 */
export async function replaceFile(
  oldKey: string | null | undefined,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  userId?: string
): Promise<{ key: string; url: string; size: number }> {
  // Delete the old file first if key exists
  if (oldKey) {
    console.log(`[Storage Service] Replacing file. Deleting old key: ${oldKey}`);
    await deleteFile(oldKey);
  }

  // Upload the new file
  return await uploadFile(fileBuffer, filename, mimeType, userId);
}
