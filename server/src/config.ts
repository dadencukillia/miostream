// Services host
export const POSTGRES_HOST = process.env['POSTGRES_HOST']!;
export const REDIS_HOST = process.env['REDIS_HOST']!;
export const RUSTFS_HOST = process.env['RUSTFS_HOST']!;

export const DB_NAME = "miostream";
export const DB_PASS = process.env["DB_PASS"] ?? await Bun.file(process.env["DB_PASS_FILE"]!).text();
export const DB_URL = `postgresql://postgres:${DB_PASS}@${POSTGRES_HOST}/${DB_NAME}`;
