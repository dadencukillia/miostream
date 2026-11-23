import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";

const BUCKET_NAME = "previews";

export async function setPreviewById(
	s3: S3Client,
	previewId: string,
	content: Buffer,
) {
	const previewFile = `${previewId.replaceAll("-", "").trim()}.webp`;

	await s3.send(new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: previewFile,
		ACL: "public-read",
		ContentType: "image/webp",
		Body: content
	}));
}

export async function getPreviewById(
	s3: S3Client,
	previewId: string,
): Promise<Uint8Array | null> {
	const previewFile = `${previewId.replaceAll("-", "").trim()}.webp`;

	try {
		const object = await s3.send(new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: previewFile,
			ResponseContentEncoding: "gzip",
		}));

		if (!object.Body) throw Error("No body in S3 response");

		return object.Body.transformToByteArray();
	} catch (e) {
		if (e instanceof NoSuchKey) {
			return null;
		}

		throw e;
	}
}

export async function removePreviewById(
	s3: S3Client,
	previewId: string,
) {
	const previewFile = `${previewId.replaceAll("-", "").trim()}.webp`;

	await s3.send(new DeleteObjectCommand({
		Bucket: BUCKET_NAME,
		Key: previewFile,
	}));
}
