-- 🧹 Add Soft Delete Columns
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;

-- 🛡️ Add Data Validation Constraints at DB Level
ALTER TABLE posts ADD CONSTRAINT check_title_length CHECK (char_length(title) >= 3);
ALTER TABLE users ADD CONSTRAINT check_valid_email CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');

-- Ensure the audit log captures exactly what we need
-- (Your existing publish_audit_logs table is mostly good, let's just make sure it's structured right)
CREATE TABLE IF NOT EXISTS publish_audit_logs (
    id               SERIAL PRIMARY KEY,
    post_id          INT REFERENCES posts(id) ON DELETE CASCADE,
    action_by        INT REFERENCES users(id),
    action           VARCHAR(50) NOT NULL, -- e.g., 'PUBLISHED', 'EDITED', 'SOFT_DELETED'
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);