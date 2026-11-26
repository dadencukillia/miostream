-- migrate:up
ALTER TABLE public.episodes
  ADD COLUMN order_index INTEGER;

UPDATE public.episodes e
SET order_index = sub.rn * 100
FROM (
  SELECT episode_id,
         ROW_NUMBER() OVER (PARTITION BY anime_id ORDER BY episode_id) AS rn
  FROM public.episodes
) sub
WHERE e.episode_id = sub.episode_id;

ALTER TABLE public.episodes
  ALTER COLUMN order_index SET NOT NULL,
  ADD CONSTRAINT episodes_order_index_check CHECK (order_index >= 0);

CREATE INDEX IF NOT EXISTS idx_episodes_order_index ON public.episodes(order_index);

-- migrate:down
DROP INDEX IF EXISTS public.idx_episodes_order_index;

ALTER TABLE public.episodes
  DROP CONSTRAINT IF EXISTS episodes_order_index_check,
  DROP COLUMN IF EXISTS order_index;
