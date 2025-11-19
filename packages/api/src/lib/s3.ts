import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Get AWS configuration from environment
const getAWSConfig = () => {
	const AWS_REGION = process.env.AWS_REGION || "af-south-1";
	const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
	const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
	const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "mohletter-documents-prod";

	// Validate AWS credentials
	if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
		throw new Error(
			"AWS credentials are missing. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables."
		);
	}

	return {
		region: AWS_REGION,
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
		bucketName: BUCKET_NAME,
	};
};

// Initialize S3 client (lazy initialization)
let s3Client: S3Client | null = null;

const getS3Client = (): S3Client => {
	if (!s3Client) {
		const config = getAWSConfig();
		s3Client = new S3Client({
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
		});
	}
	return s3Client;
};

export interface GenerateUploadUrlParams {
	fileName: string;
	fileType: string;
	fileSize: number;
}

export interface UploadUrlResponse {
	uploadUrl: string;
	fileUrl: string;
	key: string;
}

/**
 * Generate a pre-signed URL for uploading files to S3
 */
export async function generateUploadUrl(
	params: GenerateUploadUrlParams
): Promise<UploadUrlResponse> {
	const { fileName, fileType, fileSize } = params;

	// Get AWS configuration (validates credentials)
	const config = getAWSConfig();
	const client = getS3Client();

	// Validate file size (max 50MB)
	const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
	if (fileSize > MAX_FILE_SIZE) {
		throw new Error("File size exceeds maximum allowed size of 50MB");
	}

	// Validate file type
	const ALLOWED_TYPES = [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/tiff",
		"application/pdf",
	];
	if (!ALLOWED_TYPES.includes(fileType)) {
		throw new Error(
			"Invalid file type. Allowed types: JPG, PNG, TIFF, PDF"
		);
	}

	// Generate unique key with timestamp
	const timestamp = Date.now();
	const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
	const key = `scanned-letters/${timestamp}-${sanitizedFileName}`;

	// Create the command for putting an object
	const command = new PutObjectCommand({
		Bucket: config.bucketName,
		Key: key,
		ContentType: fileType,
	});

	// Generate pre-signed URL (valid for 5 minutes)
	const uploadUrl = await getSignedUrl(client, command, {
		expiresIn: 300, // 5 minutes
	});

	// Construct the file URL (for accessing the file after upload)
	const fileUrl = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${key}`;

	return {
		uploadUrl,
		fileUrl,
		key,
	};
}

/**
 * Get the public URL for a file in S3
 */
export function getFileUrl(key: string): string {
	const config = getAWSConfig();
	return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${key}`;
}

/**
 * Generate a pre-signed URL for viewing/downloading files from S3
 */
export async function generateViewUrl(s3Url: string): Promise<string> {
	const config = getAWSConfig();
	const client = getS3Client();

	// Extract key from S3 URL
	// URL format: https://bucket-name.s3.region.amazonaws.com/key
	const urlMatch = s3Url.match(/https:\/\/[^/]+\/(.+)$/);
	if (!urlMatch) {
		throw new Error("Invalid S3 URL format");
	}

	const key = urlMatch[1];

	// Create the command for getting an object
	const command = new GetObjectCommand({
		Bucket: config.bucketName,
		Key: key,
	});

	// Generate pre-signed URL (valid for 1 hour)
	const viewUrl = await getSignedUrl(client, command, {
		expiresIn: 3600, // 1 hour
	});

	return viewUrl;
}
