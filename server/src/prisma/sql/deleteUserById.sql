DELETE FROM "User"
WHERE "id" = $1::uuid
RETURNING *;