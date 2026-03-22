# Prova — Database Schema & RLS Policies
**Version:** 1.0 | **Date:** March 19, 2026

Run these SQL statements in the Supabase SQL Editor in this exact order.
Do not modify RLS policies without understanding the security implications.

---

## 1. Enable UUID Extension

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 2. Create Tables

### 2.1 models
```sql
CREATE TABLE public.models (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT models_model_name_length CHECK (char_length(model_name) <= 200),
  CONSTRAINT models_model_name_not_empty CHECK (char_length(trim(model_name)) > 0)
);
```

### 2.2 submissions
```sql
CREATE TABLE public.submissions (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id                    UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number              INTEGER NOT NULL DEFAULT 1,
  document_text               TEXT NOT NULL,
  conceptual_score            NUMERIC(5,2) NOT NULL CHECK (conceptual_score >= 0 AND conceptual_score <= 100),
  outcomes_score              NUMERIC(5,2) NOT NULL CHECK (outcomes_score >= 0 AND outcomes_score <= 100),
  monitoring_score            NUMERIC(5,2) NOT NULL CHECK (monitoring_score >= 0 AND monitoring_score <= 100),
  final_score                 NUMERIC(5,2) NOT NULL CHECK (final_score >= 0 AND final_score <= 100),
  gap_analysis                JSONB NOT NULL DEFAULT '[]',
  judge_confidence            NUMERIC(4,3) NOT NULL CHECK (judge_confidence >= 0 AND judge_confidence <= 1),
  assessment_confidence_label TEXT NOT NULL CHECK (assessment_confidence_label IN ('High', 'Medium', 'Low')),
  retry_count                 INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 2),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT submissions_version_positive CHECK (version_number > 0)
);
```

### 2.3 gaps
```sql
CREATE TABLE public.gaps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id   UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pillar          TEXT NOT NULL CHECK (pillar IN ('conceptual_soundness', 'outcomes_analysis', 'ongoing_monitoring')),
  element_code    TEXT NOT NULL,
  element_name    TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor')),
  description     TEXT NOT NULL,
  recommendation  TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT gaps_element_code_valid CHECK (
    element_code IN (
      'CS-01','CS-02','CS-03','CS-04','CS-05','CS-06','CS-07',
      'OA-01','OA-02','OA-03','OA-04','OA-05','OA-06','OA-07',
      'OM-01','OM-02','OM-03','OM-04','OM-05','OM-06'
    )
  )
);
```

### 2.4 user_preferences
```sql
CREATE TABLE public.user_preferences (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  show_overview_panel     BOOLEAN NOT NULL DEFAULT TRUE,
  show_model_inventory    BOOLEAN NOT NULL DEFAULT TRUE,
  show_score_progression  BOOLEAN NOT NULL DEFAULT TRUE,
  show_recent_activity    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.5 evals (for AI-TDD eval system)
```sql
CREATE TABLE public.evals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id       UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  input_text_hash     TEXT NOT NULL,
  agent_outputs       JSONB NOT NULL,
  judge_output        JSONB NOT NULL,
  retry_count         INTEGER NOT NULL DEFAULT 0,
  total_latency_ms    INTEGER,
  model_used          TEXT NOT NULL DEFAULT 'claude-haiku-3-5-20241022',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Create Indexes

```sql
-- models
CREATE INDEX idx_models_user_id ON public.models(user_id);
CREATE INDEX idx_models_user_id_model_name ON public.models(user_id, model_name);

-- submissions
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_model_id ON public.submissions(model_id);
CREATE INDEX idx_submissions_user_id_created_at ON public.submissions(user_id, created_at DESC);
CREATE INDEX idx_submissions_final_score ON public.submissions(final_score);

-- gaps
CREATE INDEX idx_gaps_submission_id ON public.gaps(submission_id);
CREATE INDEX idx_gaps_user_id ON public.gaps(user_id);
CREATE INDEX idx_gaps_severity ON public.gaps(severity);
CREATE INDEX idx_gaps_pillar ON public.gaps(pillar);

-- user_preferences
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- evals
CREATE INDEX idx_evals_submission_id ON public.evals(submission_id);
CREATE INDEX idx_evals_created_at ON public.evals(created_at DESC);
```

---

## 4. Enable Row Level Security

```sql
ALTER TABLE public.models            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaps              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evals             ENABLE ROW LEVEL SECURITY;
```

---

## 5. RLS Policies

### 5.1 models policies
```sql
-- SELECT: users can only read their own models
CREATE POLICY "models_select_own"
  ON public.models
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users can only insert their own models
CREATE POLICY "models_insert_own"
  ON public.models
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own models
CREATE POLICY "models_update_own"
  ON public.models
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: users can only delete their own models
CREATE POLICY "models_delete_own"
  ON public.models
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 5.2 submissions policies
```sql
-- SELECT
CREATE POLICY "submissions_select_own"
  ON public.submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "submissions_insert_own"
  ON public.submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE (allow user to update their own — e.g., for future edit features)
CREATE POLICY "submissions_update_own"
  ON public.submissions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "submissions_delete_own"
  ON public.submissions
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 5.3 gaps policies
```sql
-- SELECT
CREATE POLICY "gaps_select_own"
  ON public.gaps
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "gaps_insert_own"
  ON public.gaps
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "gaps_delete_own"
  ON public.gaps
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 5.4 user_preferences policies
```sql
-- SELECT
CREATE POLICY "user_preferences_select_own"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "user_preferences_insert_own"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "user_preferences_update_own"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 5.5 evals policies
```sql
-- evals table: no user access at all (server-side only via service role key)
-- No RLS policies created for evals — service role bypasses RLS
-- Anon and authenticated roles cannot access evals
CREATE POLICY "evals_no_access"
  ON public.evals
  FOR ALL
  USING (false);
```

---

## 6. Functions and Triggers

### 6.1 Auto-increment version number
```sql
CREATE OR REPLACE FUNCTION get_next_version_number(p_model_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.submissions
  WHERE model_id = p_model_id;

  RETURN next_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.2 Update user_preferences updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 6.3 Auto-create user preferences on signup
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

## 7. Supabase Client Setup

### 7.1 Browser client (`/src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 7.2 Server client (`/src/lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Use this in API routes and Server Components
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        }
      }
    }
  );
}

// Use this for operations that need to bypass RLS (server-side only)
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
```

### 7.3 Middleware (`/src/lib/supabase/middleware.ts`)
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/check') ||
    request.nextUrl.pathname.startsWith('/submissions') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/help');

  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

---

## 8. Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The service role key is used ONLY in:
- `createServiceClient()` in `/src/lib/supabase/server.ts`
- Writing to the `evals` table (bypasses RLS)

Never reference `SUPABASE_SERVICE_ROLE_KEY` anywhere else.

---

*Prova Database v1.0 | March 2026*
