-- backend/schema.sql

-- Users Table: Stores user account information, preferences, and emergency contacts.
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_of_birth DATE,
    gender VARCHAR(50),
    bio TEXT,
    preferred_mood_time TIME,
    hydration_goal INTEGER DEFAULT 2000,
    mindfulness_reminder_time TIME DEFAULT '09:00:00',
    emergency_contact TEXT,
    profile_image TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    mindfulness_reminders_enabled BOOLEAN DEFAULT TRUE,
    mindfulness_reminders_time TIME DEFAULT '09:00:00',
    water_goal_ml INTEGER DEFAULT 2000,
    water_reminders_enabled BOOLEAN DEFAULT TRUE,
    water_reminders_frequency_hours INTEGER DEFAULT 2,
    journal_password_hash VARCHAR(255) NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin'))
);

-- Addresses Table: Stores user address information.
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences Table: Stores various user-specific preferences.
CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    preference_name VARCHAR(100) NOT NULL,
    preference_value TEXT,
    UNIQUE (user_id, preference_name),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emergency Contacts Table: Stores emergency contact information for users.
CREATE TABLE emergency_contacts (
    contact_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    relationship VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Mood Logs Table: Tracks user mood entries.
CREATE TABLE mood_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    mood VARCHAR(20) NOT NULL CHECK (mood IN ('happy', 'sad', 'angry', 'anxious', 'neutral')),
    note TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    mood_intensity INTEGER CHECK (mood_intensity >= 1 AND mood_intensity <= 5) -- Example intensity scale
);

-- Journal Categories Table: Stores predefined journal categories.
CREATE TABLE journal_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entries Table: Stores user journal entries.
CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    mood VARCHAR(20) DEFAULT 'neutral' CHECK (mood IN ('happy', 'sad', 'angry', 'anxious', 'neutral')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,
    category_id INTEGER REFERENCES journal_categories(category_id)
);

-- Water Logs Table: Records individual water intake instances.
CREATE TABLE water_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount_ml INTEGER NOT NULL, -- Amount consumed in this instance
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Professional Resources Table: Curated list of mental health resources (Admin managed).
CREATE TABLE professional_resources (
    resource_id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Therapy', 'Hotlines', 'Crisis Centers')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    contact_info VARCHAR(255),
    link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    is_verified BOOLEAN DEFAULT FALSE
);

-- Guided Meditations Table: Stores information about meditation audio sessions (Admin managed).
CREATE TABLE guided_meditations (
    meditation_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    theme VARCHAR(100),
    audio_url VARCHAR(255) NOT NULL,
    duration_seconds INTEGER, -- Length of the audio session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    instructor VARCHAR(100),
    language VARCHAR(50),
    tags TEXT[] -- Array to store multiple tags
);

-- Sedona Method Logs Table: Records user sessions and reflections for the Sedona Method module.
CREATE TABLE sedona_method_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reflection_text TEXT
);

-- Reminders Table: Stores user-defined reminders.
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('mindfulness', 'water')),
    title VARCHAR(255) NOT NULL,
    time TIME NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    frequency INTERVAL -- e.g., '2 hours', '1 day' for recurring reminders
);

-- Insert admin user (password will be hashed in the application)
INSERT INTO users (username, email, password_hash, is_admin)
VALUES ('admin', 'admin@wisp.com', '$2b$10$YourHashedPasswordHere', TRUE);

-- Insert a test regular user
INSERT INTO users (username, email, password_hash, is_admin)
VALUES ('testuser', 'test@wisp.com', '$2b$10$YourHashedPasswordHere', FALSE);

-- Optional: Add trigger to update 'updated_at' timestamp on relevant table modifications
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
BEFORE UPDATE ON addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at
BEFORE UPDATE ON emergency_contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON professional_resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meditations_updated_at
BEFORE UPDATE ON guided_meditations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_categories_updated_at
BEFORE UPDATE ON journal_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON reminders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add indexes for performance
CREATE INDEX idx_mood_logs_user_date ON mood_logs(user_id, logged_at);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, created_at);
CREATE INDEX idx_water_logs_user_date ON water_logs(user_id, logged_at);
CREATE INDEX idx_reminders_user_type ON reminders(user_id, type);
CREATE INDEX idx_journal_entries_category ON journal_entries(category_id);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_user_preferences_user_name ON user_preferences(user_id, preference_name);
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX idx_professional_resources_category ON professional_resources(category);
CREATE INDEX idx_guided_meditations_theme ON guided_meditations(theme);

-- Insert Initial Professional Resources Data
INSERT INTO professional_resources (
  category, title, description, contact_info, link, created_at, updated_at, phone_number, email, address
) VALUES
(
  'Hotlines',
  'Umang Pakistan',
  'Provides anonymous emotional support via trained volunteers in Pakistan.',
  '0311-7786264',
  'https://www.instagram.com/umangpakistan',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  '0311-7786264',
  NULL,
  NULL
),
(
  'Therapy',
  'Therapy Works',
  'One of the oldest psychotherapy centers in Pakistan offering counseling and clinical psychology services.',
  '+92-21-35870748',
  'https://therapyworks.com.pk',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  '+92-21-35870748',
  NULL,
  NULL
),
(
  'Crisis Centers',
  'Rozan Helpline',
  'Offers psychosocial support, especially for women and children, including trauma counseling.',
  '0304-1111744',
  'https://rozan.org',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  '0304-1111744',
  NULL,
  NULL
),
(
  'Therapy',
  'Taskeen Health Initiative',
  'Non-profit mental health initiative offering counseling services and awareness programs.',
  'info@taskeen.org',
  'https://taskeen.org',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL,
  'info@taskeen.org',
  NULL
),
(
  'Hotlines',
  'PAHCHAAN (Child Abuse & Mental Health)',
  'Provides mental health services with a focus on children and trauma survivors.',
  '042-35913944',
  'https://pahchaan.org.pk',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  '042-35913944',
  NULL,
  NULL
),
(
  'Therapy',
  'Mind Organization',
  'Mental health NGO offering therapy, workshops, and awareness campaigns.',
  'contact@mind.org.pk',
  'https://mind.org.pk',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  NULL,
  'contact@mind.org.pk',
  NULL
),
(
  'Crisis Centers',
  'Befrienders Karachi',
  'Offers a confidential helpline for people struggling with emotional distress.',
  '021-34971882',
  'http://www.befrienderskarachi.org',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  '021-34971882',
  NULL,
  NULL
);

-- Insert Initial Journal Category Data
INSERT INTO journal_categories (name, description) VALUES
('General', 'Daily thoughts and reflections'),
('Gratitude', 'Things you are thankful for'),
('Goals', 'Tracking progress towards your objectives'),
('Challenges', 'Difficulties and how you are coping'),
('Ideas', 'Brainstorming and new concepts');