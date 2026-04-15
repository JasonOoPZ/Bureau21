export type ItemType = 'weapon' | 'armor' | 'herb' | 'substance' | 'consumable' | 'misc';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type SyndicateRole = 'leader' | 'officer' | 'member';
export type BoardType = 'game_help' | 'trading' | 'announcements' | 'general';
export type KillFeedType = 'kill' | 'discovery' | 'achievement' | 'syndicate';
export type LeaderboardCategory = 'kingpin' | 'warlord' | 'chemist' | 'miner' | 'rookie';
export type WorkoutType = 'strength' | 'speed' | 'endurance' | 'panic';

export interface Character {
  id: string;
  user_id: string;
  username: string;
  level: number;
  xp: number;
  credits_hand: number;
  credits_bank: number;
  bytes: number;
  marks: number;
  tokens: number;
  alignment: number;
  age_days: number;
  is_dead: boolean;
  life_force: number;
  max_life_force: number;
  strength: number;
  speed: number;
  endurance: number;
  panic: number;
  confidence: number;
  max_confidence: number;
  motivation: number;
  max_motivation: number;
  atk_def_split: number;
  ap_available: number;
  gym_streak: number;
  last_gym_date: string | null;
  gym_energy_used: number;
  gym_energy_date: string | null;
  is_newbie: boolean;
  newbie_until: string;
  welfare_days_remaining: number;
  battle_gauge_minutes: number;
  last_motivation_regen: string;
  onboarding_step: number;
  syndicate_id: string | null;
  created_at: string;
  last_login: string;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  atk_bonus: number;
  def_bonus: number;
  heal_amount: number;
  is_revive: boolean;
  level_req: number;
  max_strength: number;
  buy_price: number;
  sell_price: number;
  rarity: ItemRarity;
}

export interface InventoryEntry {
  id: string;
  character_id: string;
  item_id: string;
  quantity: number;
  durability: number | null;
  is_equipped: boolean;
  item?: Item;
}

export interface Battle {
  id: string;
  attacker_id: string;
  defender_id: string;
  winner_id: string;
  xp_gained: number;
  credits_stolen: number;
  alignment_change: number;
  log_text: string;
  created_at: string;
}

export interface Syndicate {
  id: string;
  name: string;
  description: string;
  treasury: number;
  created_by: string;
  is_subscribed: boolean;
  created_at: string;
}

export interface SyndicateMember {
  id: string;
  syndicate_id: string;
  character_id: string;
  role: SyndicateRole;
  joined_at: string;
  character?: Character;
}

export interface Message {
  id: string;
  board: BoardType;
  author_id: string;
  title: string;
  body: string;
  karma: number;
  created_at: string;
  character?: Character;
}

export interface ChatMessage {
  id: string;
  room: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface KillFeedEntry {
  id: string;
  event_type: KillFeedType;
  message: string;
  actor_id: string | null;
  target_id: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  character_id: string;
  season: string;
  category: LeaderboardCategory;
  score: number;
  updated_at: string;
  character?: Character;
}

export interface BattleResult {
  winner_id: string;
  log_entries: string[];
  xp_gained: number;
  credits_stolen: number;
  alignment_change: number;
  attacker_survived: boolean;
  defender_survived: boolean;
}

export interface GymResult {
  stat_name: WorkoutType;
  gain_amount: number;
  new_value: number;
  energy_used: number;
  energy_remaining: number;
  max_energy: number;
  streak: number;
}

export interface CharacterStats {
  id: string;
  username: string;
  level: number;
  strength: number;
  speed: number;
  endurance: number;
  panic: number;
  atk_def_split: number;
  life_force: number;
  max_life_force: number;
  credits_hand: number;
  alignment: number;
  age_days: number;
  is_dead: boolean;
  is_newbie: boolean;
  newbie_until: string;
}
