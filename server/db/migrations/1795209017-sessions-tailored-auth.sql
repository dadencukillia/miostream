-- migrate:up

DELETE FROM public.sessions;

ALTER TABLE public.sessions
    DROP CONSTRAINT IF EXISTS sessions_refresh_token_check;

ALTER TABLE public.sessions
    ALTER COLUMN refresh_token DROP NOT NULL,
    ALTER COLUMN refresh_token SET DEFAULT NULL;

ALTER TABLE public.sessions
    ADD CONSTRAINT sessions_refresh_token_check
    CHECK (refresh_token IS NULL OR length(refresh_token) = 64);

ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS previous_refresh_token BYTEA UNIQUE DEFAULT NULL
        CHECK (previous_refresh_token IS NULL OR length(previous_refresh_token) = 64),
    ADD COLUMN IF NOT EXISTS rotated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- migrate:down

DELETE FROM public.sessions;

ALTER TABLE public.sessions
    DROP COLUMN IF EXISTS previous_refresh_token,
    DROP COLUMN IF EXISTS rotated_at;

ALTER TABLE public.sessions
    DROP CONSTRAINT IF EXISTS sessions_refresh_token_check;

ALTER TABLE public.sessions
    ALTER COLUMN refresh_token DROP DEFAULT,
    ALTER COLUMN refresh_token SET NOT NULL;

ALTER TABLE public.sessions
    ADD CONSTRAINT sessions_refresh_token_check
    CHECK (length(refresh_token) = 96);
