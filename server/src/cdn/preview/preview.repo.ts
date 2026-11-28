import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	NoSuchKey,
	NotFound,
	PutObjectCommand,
	type S3Client,
} from "@aws-sdk/client-s3";

const BUCKET_NAME = "previews";

export type PreviewS3Result =
	| { notModified: true; etag?: string }
	| { notModified: false; content: Uint8Array; etag?: string };

const formatPreviewKey = (previewId: string): string => `${previewId.trim()}.webp`;

const isNotFoundError = (e: any): boolean =>
	e instanceof NoSuchKey ||
	e instanceof NotFound ||
	e?.$metadata?.httpStatusCode === 404;

const getPreviewEtag = async (s3: S3Client, previewId: string): Promise<string | null | undefined> => {
	try {
		const head = await s3.send(new HeadObjectCommand({
			Bucket: BUCKET_NAME,
			Key: formatPreviewKey(previewId),
		}));
		return head.ETag;
	} catch (e) {
		if (isNotFoundError(e)) {
			return null;
		}
		throw e;
	}
};

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
		if (isNotFoundError(e)) {
			return null;
		}
		if (e?.$metadata?.httpStatusCode === 304 || e?.name === "NotModified") {
			const etagFromError: string | undefined =
				e?.ETag ?? e?.$response?.headers?.etag;

			if (etagFromError) {
				return { notModified: true, etag: etagFromError };
			}

			const headEtag = await getPreviewEtag(s3, previewId);
			if (headEtag === null) {
				return null;
			}

			return { notModified: true, etag: headEtag };
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
