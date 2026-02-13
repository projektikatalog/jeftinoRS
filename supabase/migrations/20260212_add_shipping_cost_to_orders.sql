-- 1. Dodavanje kolone shipping_cost u tabelu porudzbine
ALTER TABLE porudzbine
  ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC NOT NULL DEFAULT 0;

-- 2. Funkcija za generisanje koda porudžbine (ako već ne postoji)
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
    result text := '';
    i integer := 0;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || chars[1+floor(random()*array_length(chars, 1))::int];
    END LOOP;
    RETURN result;
END;
$$;

-- 3. Ažuriranje RPC funkcije create_new_order da podrži shipping_cost i generiše order_code
CREATE OR REPLACE FUNCTION create_new_order(
    p_ime_kupca text,
    p_email_kupca text,
    p_adresa_kupca text,
    p_grad_kupca text,
    p_postanski_broj_kupca text,
    p_telefon_kupca text,
    p_artikli jsonb,
    p_ukupna_cena numeric,
    p_shipping_cost numeric
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
        v_order_code := generate_order_code();
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
                order_code
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
                v_order_code
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

-- 4. Dozvola za izvršavanje funkcije
GRANT EXECUTE ON FUNCTION create_new_order TO anon, authenticated, service_role;

