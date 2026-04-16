export type BureauNavLink = {
  href: string;
  label: string;
  status?: "live" | "planned";
};

export const topNavLinks: BureauNavLink[] = [
  { href: "/house", label: "House", status: "live" },
  { href: "/gym", label: "Gym", status: "live" },
  { href: "/primaris", label: "Primaris", status: "live" },
  { href: "/battle", label: "Battle", status: "live" },
  { href: "/heroes", label: "Mechas", status: "live" },
  { href: "/station", label: "Station", status: "live" },
  { href: "/boards", label: "Boards", status: "live" },
  { href: "/chat", label: "Chat", status: "live" },
  { href: "/updates", label: "Updates", status: "live" },
];

export const sideRailLinks: BureauNavLink[] = [
  { href: "/house", label: "House", status: "live" },
  { href: "/inventory", label: "Inventory", status: "live" },
  { href: "/bank", label: "Bank", status: "live" },
  { href: "/gym", label: "Galaxy Gym", status: "live" },
  { href: "/primaris", label: "Primaris Core", status: "live" },
  { href: "/battle", label: "Battle Arena", status: "live" },
  { href: "/heroes", label: "Battle Support Corps", status: "live" },
  { href: "/station", label: "Station Overview", status: "live" },
  { href: "/station/armory", label: "Armory", status: "live" },
  { href: "/station/bazaar", label: "Bazaar", status: "live" },
  { href: "/station/academy", label: "The Academy", status: "live" },
  { href: "/station/hydroponics", label: "Hydroponics Bay", status: "live" },
  { href: "/station/syndicate-row", label: "Syndicate Row", status: "live" },
  { href: "/station/underbelly", label: "Underbelly", status: "live" },
  { href: "/station/docking-bay", label: "Docking Bay", status: "live" },
  { href: "/station/fabrication", label: "Fabrication", status: "live" },
  { href: "/station/outer-ring", label: "Outer Ring", status: "live" },
  { href: "/boards", label: "Message Boards", status: "live" },
  { href: "/quickposts", label: "QuickPosts", status: "live" },
  { href: "/chat", label: "Town Hall", status: "live" },
  { href: "/account", label: "My Account", status: "live" },
  { href: "/settings", label: "Settings", status: "live" },
  { href: "/updates", label: "Updates", status: "live" },
];
