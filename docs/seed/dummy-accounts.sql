-- Seed dummy accounts + transactions untuk uji tampilan Dashboard + Accounts list.
-- Idempotent: pakai ON CONFLICT (user_id, slug) — aman re-run.
-- Target user: first row di user_profiles (single-user dev).
-- Lookup account_type & category by slug (bukan hardcode UUID).

DO $$
DECLARE
  v_user   UUID := (SELECT id FROM public.user_profiles ORDER BY created_at LIMIT 1);
  v_wallet UUID := (SELECT id FROM public.account_types WHERE user_id = v_user AND slug = 'wallet');
  v_atm    UUID := (SELECT id FROM public.account_types WHERE user_id = v_user AND slug = 'atm');
  v_plat   UUID := (SELECT id FROM public.account_types WHERE user_id = v_user AND slug = 'platform');
  v_mandiri_id UUID;
BEGIN
  -- ── Accounts ──────────────────────────────────────────────────────────────
  INSERT INTO public.accounts
    (user_id, account_type_id, name, slug, current_balance, last_reality_check,
     last_reality_check_at, asset_category, icon_name, color_hex, is_wallet, sort_order)
  VALUES
    (v_user, v_wallet, 'Wallet',  'wallet',  170500,  201500,  NOW() - INTERVAL '2 days', 'liquid', 'wallet', NULL,       TRUE,  1),
    (v_user, v_atm,    'Mandiri', 'mandiri', 7186018, 7946696, NOW() - INTERVAL '2 days', 'liquid', 'M',      '#dc2626', FALSE, 2),
    (v_user, v_atm,    'BCA',     'bca',     1319417, NULL,     NOW() - INTERVAL '2 days', 'liquid', 'B',      '#2563eb', FALSE, 3),
    (v_user, v_atm,    'BNI',     'bni',     450000,  450000,   NOW() - INTERVAL '5 days', 'liquid', 'B',      '#ca8a04', FALSE, 4),
    (v_user, v_plat,   'GoPay',   'gopay',   85000,   90000,    NOW() - INTERVAL '1 day',  'liquid', 'GP',     '#14b8a6', FALSE, 5),
    (v_user, v_plat,   'Flip',    'flip',    120000,  NULL,     NOW() - INTERVAL '3 days', 'liquid', 'F',      '#9333ea', FALSE, 6)
  ON CONFLICT (user_id, slug) DO UPDATE SET
    current_balance       = EXCLUDED.current_balance,
    last_reality_check    = EXCLUDED.last_reality_check,
    last_reality_check_at = EXCLUDED.last_reality_check_at,
    icon_name             = EXCLUDED.icon_name,
    color_hex             = EXCLUDED.color_hex,
    sort_order            = EXCLUDED.sort_order;

  SELECT id INTO v_mandiri_id FROM public.accounts WHERE user_id = v_user AND slug = 'mandiri';

  -- ── Transactions (spending baru-baru ini untuk Recent Transactions) ───────
  -- Hapus dummy lama dulu biar re-run tidak dobel (identifikasi via note prefix)
  DELETE FROM public.transactions
  WHERE user_id = v_user AND note IN ('Balon Mima', 'Kerupuk Ultramilk Kecil', 'Soto 2x', 'Bensin Motor', 'Belanja Bulanan');

  INSERT INTO public.transactions
    (user_id, transaction_date, transaction_type, account_id, category_id, note, amount)
  VALUES
    (v_user, CURRENT_DATE - 1, 'spending', v_mandiri_id,
       (SELECT id FROM public.categories WHERE user_id = v_user AND slug = 'entertainment'), 'Balon Mima', 10000),
    (v_user, CURRENT_DATE - 1, 'spending', v_mandiri_id,
       (SELECT id FROM public.categories WHERE user_id = v_user AND slug = 'food'), 'Kerupuk Ultramilk Kecil', 16000),
    (v_user, CURRENT_DATE - 1, 'spending', v_mandiri_id,
       (SELECT id FROM public.categories WHERE user_id = v_user AND slug = 'dining-out'), 'Soto 2x', 26000),
    (v_user, CURRENT_DATE - 2, 'spending', v_mandiri_id,
       (SELECT id FROM public.categories WHERE user_id = v_user AND slug = 'transport'), 'Bensin Motor', 30000),
    (v_user, CURRENT_DATE - 3, 'spending', v_mandiri_id,
       (SELECT id FROM public.categories WHERE user_id = v_user AND slug = 'groceries'), 'Belanja Bulanan', 250000);
END $$;
