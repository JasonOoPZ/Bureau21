export type CharacterStats = {
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
  is_newbie: boolean;
  newbie_until: string;
  welfare_days_remaining: number;
  created_at: string;
  last_login: string;
};

export type ItemType = "weapon" | "armor" | "herb" | "substance" | "consumable" | "misc";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type Item = {
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
};

export type InventoryItem = {
  id: string;
  character_id: string;
  item_id: string;
  quantity: number;
  durability: number | null;
  is_equipped: boolean;
  item?: Item;
};

export type BattleLogEntry = {
  turn: number;
  actor: "attacker" | "defender";
  action: "attack" | "panic_attack" | "rest";
  damage: number;
  remaining_lf: number;
  message: string;
};

export type BattleResult = {
  id: string;
  attacker_id: string;
  defender_id: string;
  winner_id: string;
  xp_gained: number;
  credits_stolen: number;
  alignment_change: number;
  log_text: string;
  log_entries: BattleLogEntry[];
  created_at: string;
};

export type LeaderboardCategory = "kingpin" | "warlord" | "chemist" | "miner" | "rookie";

export type LeaderboardEntry = {
  id: string;
  character_id: string;
  season: string;
  category: LeaderboardCategory;
  score: number;
  updated_at: string;
  character?: { username: string; level: number };
};

export type Syndicate = {
  id: string;
  name: string;
  description: string;
  treasury: number;
  created_by: string;
  is_subscribed: boolean;
  created_at: string;
  member_count?: number;
};

export type SyndicateRole = "leader" | "officer" | "member";

export type SyndicateMember = {
  id: string;
  syndicate_id: string;
  character_id: string;
  role: SyndicateRole;
  joined_at: string;
  character?: { username: string; level: number };
};

export type MessageBoard = "game_help" | "trading" | "announcements" | "general";

export type BoardMessage = {
  id: string;
  board: MessageBoard;
  author_id: string;
  title: string;
  body: string;
  karma: number;
  created_at: string;
  author?: { username: string };
};

export type ChatMessage = {
  id: string;
  room: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export type KillFeedEventType = "kill" | "discovery" | "achievement" | "syndicate";

export type KillFeedEvent = {
  id: string;
  event_type: KillFeedEventType;
  message: string;
  actor_id: string;
  target_id: string | null;
  created_at: string;
};

export type District =
  | "the_core"
  | "hab_block"
  | "the_academy"
  | "hydroponics_bay"
  | "the_bazaar"
  | "syndicate_row"
  | "the_underbelly"
  | "docking_bay"
  | "fabrication_deck"
  | "outer_ring"
  | "the_armory";

export type StationLocation = {
  id: string;
  district: District;
  name: string;
  description: string;
  route: string;
  unlocks_at_day?: number;
  unlocks_at_level?: number;
  requires_item?: string;
};
