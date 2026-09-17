// Services host
export const POSTGRES_HOST = process.env['POSTGRES_HOST']!;
export const REDIS_HOST = process.env['REDIS_HOST']!;
export const RUSTFS_HOST = process.env['RUSTFS_HOST']!;

export const DB_NAME = "miostream";
export const DB_PASS = process.env["DB_PASS"] ?? await Bun.file(process.env["DB_PASS_FILE"]!).text();
export const DB_URL = `postgresql://postgres:${DB_PASS}@${POSTGRES_HOST}/${DB_NAME}`;

export const RUSTFS_ACCESS_KEY = process.env["RUSTFS_ACCESS_KEY"] ?? await Bun.file(process.env["RUSTFS_ACCESS_KEY_FILE"]!).text();
export const RUSTFS_SECRET_KEY = process.env["RUSTFS_SECRET_KEY"] ?? await Bun.file(process.env["RUSTFS_SECRET_KEY_FILE"]!).text();
