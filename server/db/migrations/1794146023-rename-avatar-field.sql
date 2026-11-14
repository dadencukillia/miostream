-- migrate:up
ALTER TABLE public.users ADD COLUMN avatar_id UUID;
UPDATE public.users SET avatar_id = avatar_url::UUID WHERE avatar_url IS NOT NULL AND avatar_url <> '';
ALTER TABLE public.users DROP COLUMN avatar_url;

ALTER TABLE public.animes ADD COLUMN cover_id UUID;
UPDATE public.animes SET cover_id = cover_url::UUID WHERE cover_url IS NOT NULL AND cover_url <> '';
ALTER TABLE public.animes DROP COLUMN cover_url;

-- migrate:down
ALTER TABLE public.users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT '';
UPDATE public.users SET avatar_url = avatar_id::TEXT WHERE avatar_id IS NOT NULL;
ALTER TABLE public.users DROP COLUMN avatar_id;

ALTER TABLE public.animes ADD COLUMN cover_url TEXT NOT NULL DEFAULT '';
UPDATE public.animes SET cover_url = cover_id::TEXT WHERE cover_id IS NOT NULL;
ALTER TABLE public.animes DROP COLUMN cover_id;