import {
	DeleteObjectCommand,
	GetObjectCommand,
	NoSuchKey,
	PutObjectCommand,
	type S3Client,
} from "@aws-sdk/client-s3";

const BUCKET_NAME = "previews";

export type PreviewS3Result =
	| { notModified: true; etag?: string }
	| { notModified: false; content: Uint8Array; etag?: string };

const formatPreviewKey = (previewId: string): string => `${previewId.trim()}.webp`;

export const setPreviewById = async (
	s3: S3Client,
	previewId: string,
	content: Buffer
): Promise<void> => {
	await s3.send(new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: formatPreviewKey(previewId),
		ACL: "public-read",
		ContentType: "image/webp",
		Body: content,
	}));
};

export const getPreviewById = async (
	s3: S3Client,
	previewId: string,
	ifNoneMatch?: string
): Promise<PreviewS3Result | null> => {
	try {
		const object = await s3.send(new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: formatPreviewKey(previewId),
			IfNoneMatch: ifNoneMatch,
		}));

		if (ifNoneMatch && object.ETag && object.ETag === ifNoneMatch) {
			return { notModified: true, etag: object.ETag };
		}

		if (!object.Body) throw new Error("No body in S3 response");

		return {
			notModified: false,
			content: await object.Body.transformToByteArray(),
			etag: object.ETag,
		};
	} catch (e: any) {
		if (e instanceof NoSuchKey) {
			return null;
		}
		if (e?.$metadata?.httpStatusCode === 304 || e?.name === "NotModified") {
			return { notModified: true, etag: ifNoneMatch };
		}

		throw e;
	}
};

export const removePreviewById = async (
	s3: S3Client,
	previewId: string
): Promise<void> => {
	await s3.send(new DeleteObjectCommand({
		Bucket: BUCKET_NAME,
		Key: formatPreviewKey(previewId),
	}));
};
