-- BASELINE — snapshot of the live `public` schema of project hdbrntafgymrvkjigvzr,
-- taken 2026-10-18 via the Supabase MCP (after 20261018_fix_invite_token_and_fridge_update_guard).
--
-- Why: most of the schema (products, fridges, fridge_members, friendships,
-- push_subscriptions, several RPCs) was created in the dashboard and never had a
-- migration. Older files in this folder are NOT a faithful history — e.g.
-- 20260508_add_first_name.sql was never applied (live search_users/get_user_profiles
-- still return friend_code / no first_name).
--
-- This file is the reference to rebuild the schema on a fresh project.
-- It is already in effect in production: DO NOT run it against prod.
-- Later migrations (20261018_*) patch on top of it.

-- ───────────────────────────── Tables ─────────────────────────────

CREATE TABLE public.fridges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  emoji text NOT NULL DEFAULT '🧊'::text,
  pantry_staples jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT fridges_pkey PRIMARY KEY (id),
  CONSTRAINT fridges_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.fridge_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fridge_id uuid NOT NULL,
  user_id uuid,
  role text NOT NULL DEFAULT 'editor'::text,
  invited_email text,
  invite_token text,
  invite_accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fridge_members_invite_token_key UNIQUE (invite_token),
  CONSTRAINT unique_fridge_user UNIQUE (fridge_id, user_id),
  CONSTRAINT fridge_members_pkey PRIMARY KEY (id),
  CONSTRAINT fridge_members_fridge_id_fkey FOREIGN KEY (fridge_id) REFERENCES fridges(id) ON DELETE CASCADE,
  CONSTRAINT fridge_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fridge_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'editor'::text, 'viewer'::text])))
);
CREATE INDEX idx_fridge_members_user_id ON public.fridge_members USING btree (user_id);
CREATE INDEX idx_fridge_members_fridge_id ON public.fridge_members USING btree (fridge_id);
CREATE INDEX idx_fridge_members_token ON public.fridge_members USING btree (invite_token) WHERE (invite_token IS NOT NULL);

CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  expiration_date date NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  added_date date NOT NULL,
  is_estimated_expiration boolean DEFAULT false,
  fridge_zone text,
  created_at timestamp with time zone DEFAULT now(),
  consumed_at timestamp with time zone,
  opened_date date,
  expiration_date_type text,
  fridge_id uuid NOT NULL,
  image_url text,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_fridge_id_fkey FOREIGN KEY (fridge_id) REFERENCES fridges(id) ON DELETE CASCADE,
  CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT products_expiration_date_type_check CHECK ((expiration_date_type = ANY (ARRAY['dlc'::text, 'ddm'::text])))
);
CREATE INDEX idx_products_fridge_id ON public.products USING btree (fridge_id);
CREATE INDEX products_user_id_idx ON public.products USING btree (user_id);

CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT friendships_unique UNIQUE (requester_id, addressee_id),
  CONSTRAINT friendships_pkey PRIMARY KEY (id),
  CONSTRAINT friendships_addressee_id_fkey FOREIGN KEY (addressee_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT friendships_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT friendships_no_self CHECK ((requester_id <> addressee_id)),
  CONSTRAINT friendships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text])))
);

CREATE TABLE public.user_profiles (
  user_id uuid NOT NULL,
  country text,
  gender text,
  age integer,
  dietary_preferences text[] DEFAULT '{}'::text[],
  updated_at timestamp with time zone DEFAULT now(),
  disliked_ingredients text[] DEFAULT '{}'::text[],
  custom_preferences text DEFAULT ''::text,
  pantry_staples text[] DEFAULT '{}'::text[],
  display_name text,
  friend_code text,
  kitchen_equipment text[] DEFAULT '{}'::text[],
  username_changed_at timestamp with time zone,
  first_name text,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_profiles_age_check CHECK (((age > 0) AND (age < 150)))
);

CREATE TABLE public.saved_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipe_data jsonb NOT NULL,
  source text NOT NULL,
  saved_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_recipes_pkey PRIMARY KEY (id),
  CONSTRAINT saved_recipes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT saved_recipes_source_check CHECK ((source = ANY (ARRAY['gemini'::text, 'mealdb'::text])))
);
CREATE INDEX saved_recipes_user_id_idx ON public.saved_recipes USING btree (user_id);

CREATE TABLE public.push_subscriptions (
  user_id uuid NOT NULL,
  subscription text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (user_id),
  CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.fridges ENABLE ROW LEVEL SECURITY;            ALTER TABLE public.fridges FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fridge_members ENABLE ROW LEVEL SECURITY;     ALTER TABLE public.fridge_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;           ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;        ALTER TABLE public.friendships FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;      ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;      ALTER TABLE public.saved_recipes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY; -- not FORCEd live

-- ───────────────────────────── Functions ─────────────────────────────

-- Used by RLS policies: fridges the caller has joined.
CREATE OR REPLACE FUNCTION public.get_user_fridge_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT fridge_id FROM fridge_members
  WHERE user_id = auth.uid() AND invite_accepted_at IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.create_fridge(fridge_name text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE new_fridge_id uuid; current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO fridges (name, owner_id) VALUES (fridge_name, current_user_id) RETURNING id INTO new_fridge_id;
  INSERT INTO fridge_members (fridge_id, user_id, role, invite_accepted_at)
  VALUES (new_fridge_id, current_user_id, 'owner', now());
  RETURN json_build_object('id', new_fridge_id, 'name', fridge_name, 'owner_id', current_user_id, 'created_at', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.create_fridge(fridge_name text, fridge_emoji text DEFAULT '🧊'::text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE new_fridge_id uuid; current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO fridges (name, owner_id, emoji) VALUES (fridge_name, current_user_id, fridge_emoji) RETURNING id INTO new_fridge_id;
  INSERT INTO fridge_members (fridge_id, user_id, role, invite_accepted_at)
  VALUES (new_fridge_id, current_user_id, 'owner', now());
  RETURN json_build_object('id', new_fridge_id, 'name', fridge_name, 'owner_id', current_user_id, 'emoji', fridge_emoji, 'created_at', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.create_fridge_invite(p_fridge_id uuid, p_role text DEFAULT 'editor')
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_token text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM fridges WHERE id = p_fridge_id AND owner_id = (SELECT auth.uid())) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  v_token := replace(gen_random_uuid()::text, '-', '');
  INSERT INTO fridge_members (fridge_id, user_id, role, invite_token) VALUES (p_fridge_id, NULL, p_role, v_token);
  RETURN v_token;
END;
$$;

-- Single-use: the first person to accept consumes the token.
CREATE OR REPLACE FUNCTION public.accept_fridge_invite(token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_member fridge_members%ROWTYPE; v_fridge fridges%ROWTYPE;
BEGIN
  SELECT * INTO v_member FROM fridge_members
  WHERE invite_token = token AND user_id IS NULL AND invite_accepted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_token'; END IF;

  IF EXISTS (SELECT 1 FROM fridge_members WHERE fridge_id = v_member.fridge_id AND user_id = auth.uid()) THEN
    DELETE FROM fridge_members WHERE id = v_member.id;
    SELECT * INTO v_fridge FROM fridges WHERE id = v_member.fridge_id;
    RETURN json_build_object('fridge_id', v_fridge.id, 'fridge_name', v_fridge.name);
  END IF;

  UPDATE fridge_members SET user_id = auth.uid(), invite_accepted_at = now(), invite_token = NULL
  WHERE id = v_member.id;
  SELECT * INTO v_fridge FROM fridges WHERE id = v_member.fridge_id;
  RETURN json_build_object('fridge_id', v_fridge.id, 'fridge_name', v_fridge.name);
END;
$$;

CREATE OR REPLACE FUNCTION public.add_friend_to_fridge(p_fridge_id uuid, p_friend_user_id uuid, p_role text DEFAULT 'editor'::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_uid uuid := (SELECT auth.uid());
BEGIN
  IF NOT EXISTS (SELECT 1 FROM fridge_members WHERE fridge_id = p_fridge_id AND user_id = v_uid AND role = 'owner') THEN
    RAISE EXCEPTION 'NOT_OWNER';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM friendships WHERE status = 'accepted' AND (
      (requester_id = v_uid AND addressee_id = p_friend_user_id) OR
      (requester_id = p_friend_user_id AND addressee_id = v_uid))
  ) THEN RAISE EXCEPTION 'NOT_FRIENDS'; END IF;
  INSERT INTO fridge_members (fridge_id, user_id, role, invite_accepted_at)
  VALUES (p_fridge_id, p_friend_user_id, p_role, now())
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_users(query text)
RETURNS TABLE(user_id uuid, display_name text, friend_code text) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT up.user_id, up.display_name, up.friend_code FROM user_profiles up
  WHERE up.user_id != (SELECT auth.uid())
    AND up.display_name IS NOT NULL
    AND (up.display_name ILIKE query || '%' OR up.friend_code = upper(query))
  LIMIT 10;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_profiles(user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY SELECT up.user_id, up.display_name FROM user_profiles up WHERE up.user_id = ANY(user_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.setup_user_identity(p_display_name text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_code text;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int; attempts int := 0;
BEGIN
  IF length(p_display_name) < 3 OR length(p_display_name) > 20 OR p_display_name !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'USERNAME_INVALID';
  END IF;
  IF EXISTS (SELECT 1 FROM user_profiles WHERE lower(display_name) = lower(p_display_name) AND user_id != v_uid) THEN
    RAISE EXCEPTION 'USERNAME_TAKEN';
  END IF;
  LOOP
    v_code := '';
    FOR i IN 1..8 LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM user_profiles WHERE friend_code = v_code);
    attempts := attempts + 1;
    IF attempts > 20 THEN RAISE EXCEPTION 'CODE_GENERATION_FAILED'; END IF;
  END LOOP;
  INSERT INTO user_profiles (user_id, display_name, friend_code) VALUES (v_uid, p_display_name, v_code)
  ON CONFLICT (user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        friend_code = COALESCE(user_profiles.friend_code, EXCLUDED.friend_code);
  SELECT friend_code INTO v_code FROM user_profiles WHERE user_id = v_uid;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_fridge_member_update()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NOT NULL
     AND (SELECT auth.uid()) <> OLD.owner_id
     AND (to_jsonb(NEW) - 'pantry_staples' - 'updated_at')
         IS DISTINCT FROM (to_jsonb(OLD) - 'pantry_staples' - 'updated_at') THEN
    RAISE EXCEPTION 'only_owner_can_edit_fridge';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_fridge_member_update
  BEFORE UPDATE ON public.fridges
  FOR EACH ROW EXECUTE FUNCTION public.guard_fridge_member_update();

-- ───────────────────────────── Policies ─────────────────────────────

-- fridges
CREATE POLICY "select own fridges" ON public.fridges FOR SELECT
  USING (id IN (SELECT get_user_fridge_ids()));
CREATE POLICY "Users can create their own fridges" ON public.fridges FOR INSERT TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "Fridge owners can update their fridges" ON public.fridges FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY "Fridge members can update shared fridge pantry" ON public.fridges FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM fridge_members WHERE fridge_members.fridge_id = fridges.id
    AND fridge_members.user_id = (SELECT auth.uid()) AND fridge_members.invite_accepted_at IS NOT NULL))
  WITH CHECK (EXISTS (SELECT 1 FROM fridge_members WHERE fridge_members.fridge_id = fridges.id
    AND fridge_members.user_id = (SELECT auth.uid()) AND fridge_members.invite_accepted_at IS NOT NULL));
CREATE POLICY "owner delete fridge" ON public.fridges FOR DELETE
  USING (owner_id = (SELECT auth.uid()));

-- fridge_members
CREATE POLICY "select fridge members" ON public.fridge_members FOR SELECT
  USING (fridge_id IN (SELECT get_user_fridge_ids()));
CREATE POLICY "Fridge owners can add members" ON public.fridge_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM fridges WHERE fridges.id = fridge_members.fridge_id AND fridges.owner_id = (SELECT auth.uid())));
CREATE POLICY "owner insert member" ON public.fridge_members FOR INSERT
  WITH CHECK (fridge_id IN (SELECT fm.fridge_id FROM fridge_members fm
    WHERE fm.user_id = (SELECT auth.uid()) AND fm.role = 'owner' AND fm.invite_accepted_at IS NOT NULL));
CREATE POLICY "owner update member" ON public.fridge_members FOR UPDATE   -- replaced in 20261018_lock_down_*
  USING ((fridge_id IN (SELECT fm.fridge_id FROM fridge_members fm
    WHERE fm.user_id = (SELECT auth.uid()) AND fm.role = 'owner' AND fm.invite_accepted_at IS NOT NULL))
    OR (user_id = (SELECT auth.uid())));
CREATE POLICY "owner or self delete member" ON public.fridge_members FOR DELETE
  USING ((user_id = (SELECT auth.uid())) OR (fridge_id IN (SELECT fm.fridge_id FROM fridge_members fm
    WHERE fm.user_id = (SELECT auth.uid()) AND fm.role = 'owner' AND fm.invite_accepted_at IS NOT NULL)));

-- products
CREATE POLICY "members select products" ON public.products FOR SELECT
  USING (fridge_id IN (SELECT get_user_fridge_ids()));
CREATE POLICY "editors insert products" ON public.products FOR INSERT
  WITH CHECK (fridge_id IN (SELECT fridge_members.fridge_id FROM fridge_members
    WHERE fridge_members.user_id = (SELECT auth.uid()) AND fridge_members.role = ANY (ARRAY['owner', 'editor'])
      AND fridge_members.invite_accepted_at IS NOT NULL));
CREATE POLICY "editors update products" ON public.products FOR UPDATE
  USING (fridge_id IN (SELECT get_user_fridge_ids()))
  WITH CHECK (fridge_id IN (SELECT fridge_members.fridge_id FROM fridge_members
    WHERE fridge_members.user_id = (SELECT auth.uid()) AND fridge_members.role = ANY (ARRAY['owner', 'editor'])
      AND fridge_members.invite_accepted_at IS NOT NULL));
CREATE POLICY "editors delete products" ON public.products FOR DELETE
  USING (fridge_id IN (SELECT fridge_members.fridge_id FROM fridge_members
    WHERE fridge_members.user_id = (SELECT auth.uid()) AND fridge_members.role = ANY (ARRAY['owner', 'editor'])
      AND fridge_members.invite_accepted_at IS NOT NULL));

-- friendships
CREATE POLICY "see_own_friendships" ON public.friendships FOR SELECT
  USING ((requester_id = (SELECT auth.uid())) OR (addressee_id = (SELECT auth.uid())));
CREATE POLICY "send_friend_request" ON public.friendships FOR INSERT
  WITH CHECK (requester_id = (SELECT auth.uid()));
CREATE POLICY "addressee_updates_status" ON public.friendships FOR UPDATE   -- replaced in 20261018_lock_down_*
  USING (addressee_id = (SELECT auth.uid()));
CREATE POLICY "either_party_delete" ON public.friendships FOR DELETE
  USING ((requester_id = (SELECT auth.uid())) OR (addressee_id = (SELECT auth.uid())));

-- own-row tables
CREATE POLICY "Users can manage their own profile" ON public.user_profiles FOR ALL
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can manage their own saved recipes" ON public.saved_recipes FOR ALL
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users manage own subscription" ON public.push_subscriptions FOR ALL
  USING ((SELECT auth.uid()) = user_id);
