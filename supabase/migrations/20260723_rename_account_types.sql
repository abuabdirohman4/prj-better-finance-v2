-- Rename account_types: Wallet→Cash, Bank/ATM→Bank, Platform→E-wallet, drop Other (bf-vgh)
-- account_types per-user (di-seed via trigger seed_defaults_for_new_user saat signup).
-- WAJIB update FUNCTION (untuk user baru) + rename rows existing.
-- Label English 1 kata; i18n (Tunai/Rekening Bank/Dompet Digital) nanti.
-- asset_category (liquid/non-liquid) ada di tabel accounts, BUKAN account_types.
-- Idempotent: aman re-run.

-- 1. Update seed function untuk user baru
CREATE OR REPLACE FUNCTION public.seed_defaults_for_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.account_types (user_id, name, slug, sort_order, is_system) VALUES
        (NEW.id, 'Cash', 'cash', 1, TRUE),
        (NEW.id, 'Bank', 'bank', 2, TRUE),
        (NEW.id, 'E-wallet', 'ewallet', 3, TRUE);

    INSERT INTO public.categories (user_id, name, slug, group_name, sort_order, is_system) VALUES
        -- eating
        (NEW.id,'Dining Out','dining-out','eating',1,TRUE),
        (NEW.id,'Food','food','eating',2,TRUE),
        (NEW.id,'Fruits','fruits','eating',3,TRUE),
        (NEW.id,'Groceries','groceries','eating',4,TRUE),
        (NEW.id,'Grab Credit','grab-credit','eating',5,TRUE),
        -- living
        (NEW.id,'Charge','charge','living',1,TRUE),
        (NEW.id,'Credit','credit','living',2,TRUE),
        (NEW.id,'Children','children','living',3,TRUE),
        (NEW.id,'Entertainment','entertainment','living',4,TRUE),
        (NEW.id,'Health','health','living',5,TRUE),
        (NEW.id,'House','house','living',6,TRUE),
        (NEW.id,'Knowledge','knowledge','living',7,TRUE),
        (NEW.id,'Spouse','spouse','living',8,TRUE),
        (NEW.id,'Tools','tools','living',9,TRUE),
        (NEW.id,'Transport','transport','living',10,TRUE),
        (NEW.id,'Other Spend','other-spend','living',11,TRUE),
        -- saving
        (NEW.id,'AP','ap','saving',1,TRUE),
        (NEW.id,'AR','ar','saving',2,TRUE),
        (NEW.id,'Retained','retained','saving',3,TRUE),
        (NEW.id,'Sinking','sinking','saving',4,TRUE),
        (NEW.id,'Wishlist','wishlist','saving',5,TRUE),
        -- investing
        (NEW.id,'Business','business','investing',1,TRUE),
        (NEW.id,'Emergency','emergency','investing',2,TRUE),
        (NEW.id,'Investment','investment','investing',3,TRUE),
        -- giving
        (NEW.id,'Infaq Rezeki','infaq-rezeki','giving',1,TRUE),
        (NEW.id,'Tax Salary','tax-salary','giving',2,TRUE),
        (NEW.id,'Shodaqoh','shodaqoh','giving',3,TRUE),
        -- earning
        (NEW.id,'Net Salary','net-salary','earning',1,TRUE),
        (NEW.id,'Salary','salary','earning',2,TRUE),
        (NEW.id,'Allowance','allowance','earning',3,TRUE),
        (NEW.id,'Interest','interest','earning',4,TRUE),
        (NEW.id,'Other Earn','other-earn','earning',5,TRUE);

    RETURN NEW;
END; $function$;

-- 2. Rename rows existing (by slug lama). Akun ikut otomatis (FK by id, bukan name).
UPDATE public.account_types SET name='Cash',     slug='cash'    WHERE slug='wallet';
UPDATE public.account_types SET name='Bank',     slug='bank'    WHERE slug='atm';
UPDATE public.account_types SET name='E-wallet', slug='ewallet' WHERE slug='platform';
DELETE FROM public.account_types WHERE slug='other';
