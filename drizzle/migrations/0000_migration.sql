CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT 'New conversation',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conversations_user_idx ON public.conversations(user_id, updated_at DESC);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL DEFAULT '',
  detail text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
  notes text,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  due_at timestamptz,
  priority text NOT NULL DEFAULT 'none' CHECK (priority IN ('none','low','medium','high')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','ai_suggested')),
  source_conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.memory_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','proposed')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','ai_extracted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.provider_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  provider text NOT NULL,
  label text NOT NULL DEFAULT 'default',
  base_url text,
  enabled boolean NOT NULL DEFAULT true,
  key_hint text,
  status text NOT NULL DEFAULT 'unconfigured' CHECK (status IN ('unconfigured','untested','ok','error')),
  last_tested_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, label)
);

CREATE TABLE public.creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('image','video','scene3d','document','code')),
  name text NOT NULL DEFAULT 'Untitled',
  prompt text,
  spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','running','succeeded','failed','unavailable')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  creation_id uuid REFERENCES public.creations(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.render_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  creation_id uuid REFERENCES public.creations(id) ON DELETE CASCADE,
  worker text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed','cancelled','unavailable')),
  progress real,
  error text,
  external_job_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  provider text,
  model text,
  kind text NOT NULL,
  status text NOT NULL,
  error_code text,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations, public.messages, public.tasks, public.memory_entries, public.provider_configs, public.creations, public.assets, public.render_jobs, public.usage_events TO authenticated;
GRANT ALL ON public.conversations, public.messages, public.tasks, public.memory_entries, public.provider_configs, public.creations, public.assets, public.render_jobs, public.usage_events TO service_role;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['conversations','messages','tasks','memory_entries','provider_configs','creations','assets','render_jobs','usage_events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "own select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "own delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;

CREATE POLICY "msg conv ownership" ON public.messages AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

CREATE TRIGGER conversations_updated BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER memory_updated BEFORE UPDATE ON public.memory_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER provider_configs_updated BEFORE UPDATE ON public.provider_configs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER creations_updated BEFORE UPDATE ON public.creations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER render_jobs_updated BEFORE UPDATE ON public.render_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_config_id uuid NOT NULL UNIQUE REFERENCES public.provider_configs(id) ON DELETE CASCADE,
  ciphertext text NOT NULL,
  iv text NOT NULL,
  key_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.provider_credentials FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.provider_credentials TO service_role;
ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER provider_credentials_updated BEFORE UPDATE ON public.provider_credentials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "assets own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "assets own insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "assets own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "assets own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'assets' AND (storage.foldername(name))[1] = auth.uid()::text);