-- Add user roles
CREATE TABLE IF NOT EXISTS user_roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add user_role relationships
CREATE TABLE IF NOT EXISTS user_role_mappings (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES user_roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Add thread categories/tags
CREATE TABLE IF NOT EXISTS thread_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS thread_category_mappings (
    thread_id INTEGER REFERENCES threads(thread_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES thread_categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (thread_id, category_id)
);

-- Add content reports
CREATE TABLE IF NOT EXISTS content_reports (
    report_id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    thread_id INTEGER REFERENCES threads(thread_id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(comment_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    CHECK (thread_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- Add thread edit history
CREATE TABLE IF NOT EXISTS thread_edits (
    edit_id SERIAL PRIMARY KEY,
    thread_id INTEGER REFERENCES threads(thread_id) ON DELETE CASCADE,
    editor_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    previous_title TEXT,
    previous_content TEXT,
    edit_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comment edit history
CREATE TABLE IF NOT EXISTS comment_edits (
    edit_id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES comments(comment_id) ON DELETE CASCADE,
    editor_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    previous_content TEXT,
    edit_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO user_roles (name) VALUES
('user'),
('moderator'),
('admin')
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO thread_categories (name, description) VALUES
('Question', 'Seeking help or advice'),
('Discussion', 'General discussion topics'),
('Share', 'Sharing experiences or stories'),
('Resource', 'Helpful resources and information'),
('Support', 'Emotional support and encouragement')
ON CONFLICT (name) DO NOTHING;

-- Add soft delete columns
ALTER TABLE threads
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(user_id);

ALTER TABLE comments
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(user_id);