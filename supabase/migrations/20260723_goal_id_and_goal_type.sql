-- Goals-transactions integration (bf-4ln)
-- 1. transactions.goal_id: FK nullable → savings_goals, ON DELETE SET NULL.
--    Transaksi bisa ter-tag ke goal → collected_amount goal derived dari SUM
--    transaksi ter-tag (query layer, bukan kolom cache).
-- 2. savings_goals.goal_type constraint: 'Investing' → 'Investment'.
-- Idempotent: aman re-run.

-- goal_id column + FK
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.savings_goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_goal_id ON public.transactions(goal_id);

-- goal_type: rename Investing → Investment (data + constraint)
UPDATE public.savings_goals SET goal_type = 'Investment' WHERE goal_type = 'Investing';

ALTER TABLE public.savings_goals DROP CONSTRAINT IF EXISTS savings_goals_goal_type_check;
ALTER TABLE public.savings_goals
  ADD CONSTRAINT savings_goals_goal_type_check CHECK (goal_type = ANY (ARRAY['Saving'::text, 'Investment'::text]));
