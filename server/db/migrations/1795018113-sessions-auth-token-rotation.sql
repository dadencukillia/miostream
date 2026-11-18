-- migrate:up
DELETE FROM public.sessions;

ALTER TABLE public.sessions
    DROP CONSTRAINT IF EXISTS sessions_refresh_token_check;

ALTER TABLE public.sessions
    ADD CONSTRAINT sessions_refresh_token_check
    CHECK (length(refresh_token) = 64);

ALTER TABLE public.sessions
    ADD COLUMN previous_refresh_token BYTEA UNIQUE DEFAULT NULL
        CONSTRAINT sessions_previous_refresh_token_check
        CHECK (length(previous_refresh_token) = 64),
    ADD COLUMN rotated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- migrate:down
DELETE FROM public.sessions;

ALTER TABLE public.sessions
    DROP COLUMN IF EXISTS previous_refresh_token,
    DROP COLUMN IF EXISTS rotated_at;

ALTER TABLE public.sessions
    DROP CONSTRAINT IF EXISTS sessions_refresh_token_check;

ALTER TABLE public.sessions
    ADD CONSTRAINT sessions_refresh_token_check
    CHECK (length(refresh_token) = 96);
