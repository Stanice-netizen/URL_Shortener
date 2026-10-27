CREATE TABLE IF NOT EXISTS links (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(16) UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    click_count INTEGER NOT NULL DEFAULT 0 CHECK (click_count >= 0),

    CONSTRAINT valid_code
    CHECK (code ~ '^[A-Za-z0-9_-]{3,16}$'),

    CONSTRAINT valid_target_url
    CHECK (target_url ~* '^https?://')
);

CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    referrer TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_clicks_link_time
ON clicks(link_id, clicked_at DESC, id DESC);