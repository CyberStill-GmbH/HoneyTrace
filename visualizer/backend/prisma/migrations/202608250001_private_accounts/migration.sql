CREATE TABLE "app_user" (
  "id" UUID NOT NULL,
  "github_id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "avatar_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "user_session" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "access_token_hash" TEXT NOT NULL,
  "refresh_token_hash" TEXT NOT NULL,
  "access_expires_at" TIMESTAMP(3) NOT NULL,
  "refresh_expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_session_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ingest_token" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "token_hint" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_used_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  CONSTRAINT "ingest_token_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "analysis" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "source_id" TEXT NOT NULL,
  "trace_id" TEXT NOT NULL,
  "schema_version" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL,
  "ended_at" TIMESTAMP(3) NOT NULL,
  "stages" JSONB NOT NULL,
  "techniques" JSONB NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "evidence" JSONB NOT NULL,
  "raw_trace" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "analysis_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "analysis_confidence_check" CHECK ("confidence" >= 0 AND "confidence" <= 1)
);
CREATE TABLE "analysis_event" (
  "id" BIGSERIAL NOT NULL,
  "analysis_id" UUID NOT NULL,
  "event_id" TEXT NOT NULL,
  "sequence" BIGINT NOT NULL,
  "event_type" TEXT NOT NULL,
  "event_timestamp" TIMESTAMP(3) NOT NULL,
  "event_data" JSONB NOT NULL,
  CONSTRAINT "analysis_event_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "analysis_event_sequence_check" CHECK ("sequence" >= 0)
);
CREATE TABLE "visualization_history" (
  "id" BIGSERIAL NOT NULL,
  "user_id" UUID NOT NULL,
  "analysis_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "visualization_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "visualization_history_action_check" CHECK ("action" IN ('opened', 'filtered', 'exported'))
);
CREATE UNIQUE INDEX "app_user_github_id_key" ON "app_user"("github_id");
CREATE UNIQUE INDEX "user_session_access_token_hash_key" ON "user_session"("access_token_hash");
CREATE UNIQUE INDEX "user_session_refresh_token_hash_key" ON "user_session"("refresh_token_hash");
CREATE INDEX "user_session_user_id_idx" ON "user_session"("user_id");
CREATE UNIQUE INDEX "ingest_token_token_hash_key" ON "ingest_token"("token_hash");
CREATE INDEX "ingest_token_user_id_created_at_idx" ON "ingest_token"("user_id", "created_at" DESC);
CREATE INDEX "analysis_user_id_created_at_idx" ON "analysis"("user_id", "created_at" DESC);
CREATE INDEX "analysis_user_id_trace_id_idx" ON "analysis"("user_id", "trace_id");
CREATE UNIQUE INDEX "analysis_user_id_source_id_trace_id_key" ON "analysis"("user_id", "source_id", "trace_id");
CREATE INDEX "analysis_event_analysis_id_sequence_idx" ON "analysis_event"("analysis_id", "sequence");
CREATE UNIQUE INDEX "analysis_event_analysis_id_event_id_key" ON "analysis_event"("analysis_id", "event_id");
CREATE INDEX "visualization_history_user_id_created_at_idx" ON "visualization_history"("user_id", "created_at" DESC);
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ingest_token" ADD CONSTRAINT "ingest_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analysis" ADD CONSTRAINT "analysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "analysis_event" ADD CONSTRAINT "analysis_event_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visualization_history" ADD CONSTRAINT "visualization_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visualization_history" ADD CONSTRAINT "visualization_history_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
