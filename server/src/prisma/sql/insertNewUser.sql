INSERT INTO "User" (
    "nickname",
    "name",
    "email",
    "password_hash"
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;