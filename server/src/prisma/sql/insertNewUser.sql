INSERT INTO "User" (
    "nickname",
    "full_name",
    "email",
    "password_hash"
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;
