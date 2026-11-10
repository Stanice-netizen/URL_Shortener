INSERT INTO links (code, target_url, expires_at)
VALUES
    ('example', 'https://example.com', NULL),
    ('github', 'https://github.com', NULL),
    ('openai', 'https://openai.com', NULL)
ON CONFLICT (code) DO NOTHING;
