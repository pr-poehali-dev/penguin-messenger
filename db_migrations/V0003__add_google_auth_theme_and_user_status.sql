-- Добавляем поддержку Google OAuth и темы оформления
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS font_size INTEGER DEFAULT 16;

-- Добавляем поддержку групповых чатов
ALTER TABLE chats
  ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS group_avatar VARCHAR(500);

-- Создаем индексы для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(online);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);