CREATE TABLE IF NOT EXISTS app_user (
  id UUID PRIMARY KEY,
  github_id TEXT UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_session (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analysis (
  id UUID PRIMARY KEY,
  source_id TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  techniques JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_trace JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, trace_id)
);

CREATE TABLE IF NOT EXISTS analysis_event (
  id BIGSERIAL PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES analysis(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  sequence BIGINT NOT NULL CHECK (sequence >= 0),
  event_type TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  UNIQUE (analysis_id, event_id)
);

CREATE TABLE IF NOT EXISTS visualization_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES analysis(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('opened', 'filtered', 'exported')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analysis_created_idx ON analysis (created_at DESC);
CREATE INDEX IF NOT EXISTS analysis_trace_idx ON analysis (trace_id);
CREATE INDEX IF NOT EXISTS analysis_event_analysis_idx ON analysis_event (analysis_id, sequence);
CREATE INDEX IF NOT EXISTS history_user_created_idx ON visualization_history (user_id, created_at DESC);
