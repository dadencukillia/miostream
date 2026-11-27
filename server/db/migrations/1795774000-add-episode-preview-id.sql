-- migrate:up
ALTER TABLE public.episodes
  ADD COLUMN preview_id BIGINT;

-- migrate:down
ALTER TABLE public.episodes
  DROP COLUMN IF EXISTS preview_id;