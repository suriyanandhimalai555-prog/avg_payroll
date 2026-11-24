import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

let s3ClientInstance = null;

export const isS3Configured = () => {
    return Boolean(
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_REGION &&
        process.env.AWS_S3_BUCKET
    );
};

const getS3Client = () => {
    if (!s3ClientInstance) {
        s3ClientInstance = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
    }
    return s3ClientInstance;
};

/**
 * Uploads a Base64 data URI (e.g. data:image/jpeg;base64,...) to AWS S3
 * and returns the public HTTPS object URL.
 */
export const uploadBase64ToS3 = async (base64Data, folder = 'profile-photos', filePrefix = 'file') => {
    if (!isS3Configured()) {
        throw new Error('AWS S3 is not configured in .env');
    }

    const matches = String(base64Data).match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
    const contentType = matches ? matches[1] : 'image/jpeg';
    const rawBase64 = matches ? matches[2] : base64Data;
    const buffer = Buffer.from(rawBase64, 'base64');

    const extMap = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'application/pdf': 'pdf'
    };
    const ext = extMap[contentType] || 'jpg';

    const safePrefix = String(filePrefix).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueId = crypto.randomBytes(6).toString('hex');
    const key = `${folder}/${safePrefix}_${Date.now()}_${uniqueId}.${ext}`;

    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000'
    });

    await getS3Client().send(command);

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

/**
 * Deletes an existing S3 object given its full S3 URL (used to clean up old profile photos).
 */
export const deleteFromS3ByUrl = async (fileUrl) => {
    if (!isS3Configured() || !fileUrl || typeof fileUrl !== 'string') return;

    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    const expectedPrefix = `https://${bucket}.s3.${region}.amazonaws.com/`;

    if (!fileUrl.startsWith(expectedPrefix)) return;

    const key = decodeURIComponent(fileUrl.slice(expectedPrefix.length));
    if (!key) return;

    try {
        await getS3Client().send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        }));
    } catch (err) {
        console.warn('Non-fatal S3 old file cleanup error:', err.message);
    }
};