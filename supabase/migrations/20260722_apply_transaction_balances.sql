-- apply_transaction_balances: atomic balance mutations untuk transactions
-- (create/edit/delete). pgBouncer transaction mode (port 6543) blokir BEGIN/SAVEPOINT
-- di app layer, jadi atomicity dijamin di DB level via function ini.
--
-- SECURITY: SECURITY DEFINER + WAJIB filter user_id di dalam function.
-- p_user_id di-pass dari action layer (requireUser). UPDATE ... WHERE user_id
-- = p_user_id mencegah IDOR (mutate saldo akun user lain). Raise exception
-- kalau 0 rows → seluruh transaksi rollback (akun asing/tidak ada = gagal total).
-- Issue: bf-uk7 (atomicity) + bf-ay8 (IDOR hardening).

DROP FUNCTION IF EXISTS apply_transaction_balances(jsonb);

CREATE OR REPLACE FUNCTION apply_transaction_balances(
  p_user_id UUID,
  p_adjustments JSONB  -- [{"account_id": "uuid", "delta": 1000}, ...]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  adj JSONB;
  v_rows INT;
BEGIN
  FOR adj IN SELECT * FROM jsonb_array_elements(p_adjustments)
  LOOP
    UPDATE accounts
    SET current_balance = current_balance + (adj->>'delta')::numeric
    WHERE id = (adj->>'account_id')::uuid
      AND user_id = p_user_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RAISE EXCEPTION 'Account % not found or not owned by user', adj->>'account_id';
    END IF;
  END LOOP;
END;
$$;
