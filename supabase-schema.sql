-- Bureau 21 Database Schema
-- Run this in Supabase SQL Editor

-- Characters table
CREATE TABLE characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  level INTEGER DEFAULT 1 NOT NULL,
  xp INTEGER DEFAULT 0 NOT NULL,
  credits_hand INTEGER DEFAULT 300 NOT NULL,
  credits_bank INTEGER DEFAULT 0 NOT NULL,
  bytes INTEGER DEFAULT 0 NOT NULL,
  marks INTEGER DEFAULT 0 NOT NULL,
  tokens INTEGER DEFAULT 20 NOT NULL,
  alignment INTEGER DEFAULT 0 NOT NULL,
  age_days INTEGER DEFAULT 0 NOT NULL,
  is_dead BOOLEAN DEFAULT FALSE NOT NULL,
  life_force INTEGER DEFAULT 15 NOT NULL,
  max_life_force INTEGER DEFAULT 15 NOT NULL,
  strength REAL DEFAULT 3.0 NOT NULL,
  speed REAL DEFAULT 5.0 NOT NULL,
  endurance REAL DEFAULT 0.2 NOT NULL,
  panic REAL DEFAULT 0.0 NOT NULL,
  confidence INTEGER DEFAULT 10 NOT NULL,
  max_confidence INTEGER DEFAULT 75 NOT NULL,
  motivation INTEGER DEFAULT 500 NOT NULL,
  max_motivation INTEGER DEFAULT 500 NOT NULL,
  atk_def_split INTEGER DEFAULT 50 NOT NULL,
  ap_available INTEGER DEFAULT 0 NOT NULL,
  gym_streak INTEGER DEFAULT 0 NOT NULL,
  last_gym_date DATE,
  gym_energy_used INTEGER DEFAULT 0 NOT NULL,
  gym_energy_date DATE,
  is_newbie BOOLEAN DEFAULT TRUE NOT NULL,
  newbie_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 days') NOT NULL,
  welfare_days_remaining INTEGER DEFAULT 30 NOT NULL,
  battle_gauge_minutes INTEGER DEFAULT 10 NOT NULL,
  last_motivation_regen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  onboarding_step INTEGER DEFAULT 0 NOT NULL,
  syndicate_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read all characters" ON characters FOR SELECT USING (true);
CREATE POLICY "Users can update own character" ON characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own character" ON characters FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Items
CREATE TYPE item_type AS ENUM ('weapon', 'armor', 'herb', 'substance', 'consumable', 'misc');
CREATE TYPE item_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type item_type NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  atk_bonus INTEGER DEFAULT 0 NOT NULL,
  def_bonus INTEGER DEFAULT 0 NOT NULL,
  heal_amount INTEGER DEFAULT 0 NOT NULL,
  is_revive BOOLEAN DEFAULT FALSE NOT NULL,
  level_req INTEGER DEFAULT 1 NOT NULL,
  max_strength INTEGER DEFAULT 0 NOT NULL,
  buy_price INTEGER DEFAULT 0 NOT NULL,
  sell_price INTEGER DEFAULT 0 NOT NULL,
  rarity item_rarity DEFAULT 'common' NOT NULL
);
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read items" ON items FOR SELECT USING (true);

-- Inventory
CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  durability INTEGER,
  is_equipped BOOLEAN DEFAULT FALSE NOT NULL
);
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own inventory" ON inventory FOR SELECT USING (
  character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);
CREATE POLICY "Users can modify own inventory" ON inventory FOR ALL USING (
  character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);

-- Battles
CREATE TABLE battles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attacker_id UUID REFERENCES characters(id) NOT NULL,
  defender_id UUID REFERENCES characters(id) NOT NULL,
  winner_id UUID REFERENCES characters(id) NOT NULL,
  xp_gained INTEGER DEFAULT 0 NOT NULL,
  credits_stolen INTEGER DEFAULT 0 NOT NULL,
  alignment_change INTEGER DEFAULT 0 NOT NULL,
  log_text TEXT DEFAULT '' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read battles they were in" ON battles FOR SELECT USING (
  attacker_id IN (SELECT id FROM characters WHERE user_id = auth.uid()) OR
  defender_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);
CREATE POLICY "Server can insert battles" ON battles FOR INSERT WITH CHECK (true);

-- Leaderboards
CREATE TYPE leaderboard_category AS ENUM ('kingpin', 'warlord', 'chemist', 'miner', 'rookie');
CREATE TABLE leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  season TEXT NOT NULL,
  category leaderboard_category NOT NULL,
  score INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(character_id, season, category)
);
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read leaderboards" ON leaderboards FOR SELECT USING (true);

-- Syndicates
CREATE TABLE syndicates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '' NOT NULL,
  treasury INTEGER DEFAULT 0 NOT NULL,
  created_by UUID REFERENCES characters(id) NOT NULL,
  is_subscribed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE syndicates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read syndicates" ON syndicates FOR SELECT USING (true);

-- Syndicate Members
CREATE TYPE syndicate_role AS ENUM ('leader', 'officer', 'member');
CREATE TABLE syndicate_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  syndicate_id UUID REFERENCES syndicates(id) ON DELETE CASCADE NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  role syndicate_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(character_id)
);
ALTER TABLE syndicate_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read members" ON syndicate_members FOR SELECT USING (true);

-- Messages (Boards)
CREATE TYPE board_type AS ENUM ('game_help', 'trading', 'announcements', 'general');
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board board_type NOT NULL,
  author_id UUID REFERENCES characters(id) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  karma INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Users can post messages" ON messages FOR INSERT WITH CHECK (
  author_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room TEXT DEFAULT 'town_square' NOT NULL,
  author_id UUID REFERENCES characters(id) NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read chat" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can post chat" ON chat_messages FOR INSERT WITH CHECK (
  author_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);

-- Kill Feed
CREATE TYPE kill_feed_type AS ENUM ('kill', 'discovery', 'achievement', 'syndicate');
CREATE TABLE kill_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type kill_feed_type NOT NULL,
  message TEXT NOT NULL,
  actor_id UUID REFERENCES characters(id),
  target_id UUID REFERENCES characters(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE kill_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read kill feed" ON kill_feed FOR SELECT USING (true);

-- Seed Data
INSERT INTO items (name, type, description, heal_amount, is_revive, buy_price, sell_price, rarity) VALUES
  ('Blue Herb', 'herb', 'Revives a dead operator and restores up to 200 Life Force.', 200, true, 500, 250, 'common'),
  ('Green Herb', 'herb', 'Restores 50 Life Force.', 50, false, 100, 50, 'common'),
  ('Red Herb', 'herb', 'Restores 100 Life Force.', 100, false, 250, 125, 'uncommon'),
  ('Golden Herb', 'herb', 'Restores 200 Life Force.', 200, false, 600, 300, 'rare');

INSERT INTO items (name, type, description, atk_bonus, level_req, max_strength, buy_price, sell_price, rarity) VALUES
  ('Rusty Pipe', 'weapon', 'A bent pipe. Better than nothing.', 3, 1, 10, 100, 50, 'common'),
  ('Shock Baton', 'weapon', 'Standard-issue stun weapon.', 8, 3, 25, 500, 250, 'common'),
  ('Plasma Knife', 'weapon', 'Compact energy blade.', 15, 5, 40, 1500, 750, 'uncommon'),
  ('Rail Pistol', 'weapon', 'Electromagnetic sidearm.', 25, 8, 60, 5000, 2500, 'uncommon'),
  ('Void Blade', 'weapon', 'Dark matter-infused sword.', 50, 12, 100, 20000, 10000, 'rare');

INSERT INTO items (name, type, description, def_bonus, level_req, max_strength, buy_price, sell_price, rarity) VALUES
  ('Scrap Vest', 'armor', 'Makeshift protection from salvaged metal.', 3, 1, 10, 100, 50, 'common'),
  ('Station Guard Jacket', 'armor', 'Decommissioned security gear.', 8, 3, 25, 500, 250, 'common'),
  ('Kevlar Weave', 'armor', 'Ballistic fiber underlayer.', 15, 5, 40, 1500, 750, 'uncommon'),
  ('Mag-Shield Vest', 'armor', 'Magnetic field personal shield.', 25, 8, 60, 5000, 2500, 'uncommon'),
  ('Dark Matter Plate', 'armor', 'Cutting-edge composite armor.', 50, 12, 100, 20000, 10000, 'rare');

INSERT INTO items (name, type, description, buy_price, rarity) VALUES
  ('Hot Bun', 'consumable', 'Restores 50 motivation. Freshly baked.', 200, 'common'),
  ('Coffee', 'consumable', 'Restores 25 fishing endurance.', 7500, 'common'),
  ('Gym Membership', 'misc', 'Lifetime access to the Galaxy Gym.', 500, 'common');
