SELECT *
FROM "User"
WHERE "id" = $1::uuid
LIMIT 1;