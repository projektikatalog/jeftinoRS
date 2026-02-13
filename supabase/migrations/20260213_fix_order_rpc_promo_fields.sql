-- 1. Dodavanje promotion_id kolone ako ne postoji
ALTER TABLE porudzbine ADD COLUMN IF NOT EXISTS promotion_id TEXT;

-- 2. Brisanje funkcije po imenu bez obzira na argumente (za novije verzije PostgreSa)
-- Ako ovo ne prođe, koristićemo DROP sa listom argumenata
DO $$ 
BEGIN
    -- Brišemo sve funkcije sa ovim imenom
    EXECUTE (
        SELECT string_agg('DROP FUNCTION ' || oid::regprocedure || ';', ' ')
        FROM pg_proc
        WHERE proname = 'create_new_order'
        AND pronamespace = 'public'::regnamespace
    );
EXCEPTION WHEN OTHERS THEN 
    NULL;
END $$;

-- 3. Ažuriranje RPC funkcije create_new_order da podrži promo podatke
CREATE OR REPLACE FUNCTION create_new_order(
    p_ime_kupca text,
    p_email_kupca text,
    p_adresa_kupca text,
    p_grad_kupca text,
    p_postanski_broj_kupca text,
    p_telefon_kupca text,
    p_artikli jsonb,
    p_ukupna_cena numeric,
    p_shipping_cost numeric,
    p_promo_title text DEFAULT NULL,
    p_promo_price numeric DEFAULT NULL,
    p_promotion_id text DEFAULT NULL,
    p_order_code text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order porudzbine;
    v_order_code text;
    done bool;
BEGIN
    done := false;
    WHILE NOT done LOOP
        IF p_order_code IS NOT NULL AND NOT done THEN
            v_order_code := p_order_code;
        ELSE
            v_order_code := generate_order_code();
        END IF;
        
        BEGIN
            INSERT INTO porudzbine (
                ime_kupca,
                email_kupca,
                adresa_kupca,
                grad_kupca,
                postanski_broj_kupca,
                telefon_kupca,
                artikli,
                ukupna_cena,
                shipping_cost,
                status,
                order_code,
                promo_title,
                promo_price,
                promotion_id
            ) VALUES (
                p_ime_kupca,
                p_email_kupca,
                p_adresa_kupca,
                p_grad_kupca,
                p_postanski_broj_kupca,
                p_telefon_kupca,
                p_artikli,
                p_ukupna_cena,
                p_shipping_cost,
                'Primljeno',
                v_order_code,
                p_promo_title,
                p_promo_price,
                p_promotion_id
            )
            RETURNING * INTO new_order;
            done := true;
        EXCEPTION WHEN unique_violation THEN
            done := false;
        END;
    END LOOP;

    RETURN row_to_json(new_order);
END;
$$;

-- Ponovna dozvola za izvršavanje
GRANT EXECUTE ON FUNCTION create_new_order TO anon, authenticated, service_role;
