-- ============================================================
-- CampusHub Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  college       VARCHAR(200),
  course        VARCHAR(100),
  year          SMALLINT CHECK (year BETWEEN 1 AND 6),
  bio           TEXT,
  avatar_url    VARCHAR(500),
  is_online     BOOLEAN DEFAULT FALSE,
  last_seen     TIMESTAMPTZ DEFAULT NOW(),
  refresh_token TEXT,
  is_verified   BOOLEAN DEFAULT FALSE,
  otp_code      VARCHAR(10),
  otp_expires_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name_trgm ON users USING GIN (name gin_trgm_ops);

-- ============================================================
-- BOOKS (Textbook Exchange)
-- ============================================================
CREATE TABLE books (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(300) NOT NULL,
  author      VARCHAR(200),
  subject     VARCHAR(100),
  condition   VARCHAR(20) NOT NULL CHECK (condition IN ('new','good','fair','poor')),
  listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('sell','exchange','donate')),
  price       NUMERIC(10,2),
  description TEXT,
  status      VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available','reserved','exchanged')),
  photos      JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_books_owner ON books(owner_id);
CREATE INDEX idx_books_subject ON books(subject);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_listing_type ON books(listing_type);
CREATE INDEX idx_books_title_trgm ON books USING GIN (title gin_trgm_ops);

-- ============================================================
-- BOOK REQUESTS
-- ============================================================
CREATE TABLE book_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT,
  status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, requester_id)
);

CREATE INDEX idx_book_requests_book ON book_requests(book_id);
CREATE INDEX idx_book_requests_requester ON book_requests(requester_id);

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(300) NOT NULL,
  subject     VARCHAR(100) NOT NULL,
  semester    SMALLINT,
  description TEXT,
  file_url    VARCHAR(500) NOT NULL,
  file_type   VARCHAR(10) NOT NULL CHECK (file_type IN ('pdf','image')),
  thumbnail_url VARCHAR(500),
  tags        JSONB DEFAULT '[]',
  download_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_uploader ON notes(uploader_id);
CREATE INDEX idx_notes_subject ON notes(subject);
CREATE INDEX idx_notes_tags ON notes USING GIN (tags);
CREATE INDEX idx_notes_title_trgm ON notes USING GIN (title gin_trgm_ops);

-- ============================================================
-- NOTE LIKES
-- ============================================================
CREATE TABLE note_likes (
  note_id  UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (note_id, user_id)
);

-- ============================================================
-- NOTE BOOKMARKS
-- ============================================================
CREATE TABLE note_bookmarks (
  note_id  UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (note_id, user_id)
);

-- ============================================================
-- NOTE COMMENTS
-- ============================================================
CREATE TABLE note_comments (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id   UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_note_comments_note ON note_comments(note_id);

-- ============================================================
-- COMMUNITIES
-- ============================================================
CREATE TABLE communities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  slug        VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  category    VARCHAR(50) CHECK (category IN ('subject','course','club','interest')),
  is_private  BOOLEAN DEFAULT FALSE,
  avatar_url  VARCHAR(500),
  banner_url  VARCHAR(500),
  admin_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  member_count INTEGER DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communities_admin ON communities(admin_id);
CREATE INDEX idx_communities_name_trgm ON communities USING GIN (name gin_trgm_ops);

-- ============================================================
-- COMMUNITY MEMBERS
-- ============================================================
CREATE TABLE community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin','moderator','member')),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE INDEX idx_community_members_user ON community_members(user_id);

-- ============================================================
-- POSTS (Ideas & Thoughts Feed)
-- ============================================================
CREATE TABLE posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  content      TEXT NOT NULL,
  image_url    VARCHAR(500),
  tags         JSONB DEFAULT '[]',
  like_count   INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN (tags);

-- ============================================================
-- POST LIKES
-- ============================================================
CREATE TABLE post_likes (
  post_id  UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ============================================================
-- POST COMMENTS
-- ============================================================
CREATE TABLE post_comments (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id);

-- ============================================================
-- MESSAGES (Chat)
-- ============================================================
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id  UUID REFERENCES users(id) ON DELETE CASCADE,       -- NULL for group messages
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE, -- NULL for DMs
  content      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_message_target CHECK (
    (receiver_id IS NOT NULL AND community_id IS NULL) OR
    (receiver_id IS NULL AND community_id IS NOT NULL)
  )
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_community ON messages(community_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_dm ON messages(sender_id, receiver_id) WHERE receiver_id IS NOT NULL;

-- ============================================================
-- SAVED NEWS
-- ============================================================
CREATE TABLE saved_news (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_url VARCHAR(1000) NOT NULL,
  title       VARCHAR(500),
  description TEXT,
  image_url   VARCHAR(500),
  source      VARCHAR(200),
  category    VARCHAR(50),
  published_at TIMESTAMPTZ,
  saved_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_url)
);

CREATE INDEX idx_saved_news_user ON saved_news(user_id);

-- ============================================================
-- TRIGGERS: Keep updated_at fresh
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_books_updated BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_book_requests_updated BEFORE UPDATE ON book_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_communities_updated BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: Auto-update community member count
-- ============================================================
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = member_count - 1 WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_community_member_count
AFTER INSERT OR DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- ============================================================
-- TRIGGER: Auto-update post like/comment counts
-- ============================================================
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_like_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_comment_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
