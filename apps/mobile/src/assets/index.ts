// ============================
// Central Asset Registry
// ============================
// All assets are referenced via this file.
// Never use emoji or inline require() elsewhere.

// --- Sprites ---
export const sprites = {
  // Player (per clan)
  playerGlut: require('./sprites/player-glut.png'),
  playerFrost: require('./sprites/player-frost.png'),
  playerHain: require('./sprites/player-hain.png'),

  // Ghoul
  ghoul: require('./sprites/ghoul.png'),

  // Bastion (per level)
  bastionLv1: require('./sprites/bastion-lv1.png'),
  bastionLv2: require('./sprites/bastion-lv2.png'),
  bastionLv3: require('./sprites/bastion-lv3.png'),

  // City-State (per clan)
  citystateGlut: require('./sprites/citystate-glut.png'),
  citystateFrost: require('./sprites/citystate-frost.png'),
  citystateHain: require('./sprites/citystate-hain.png'),

  // Resources
  resHerb: require('./sprites/res-herb.png'),
  resCrystal: require('./sprites/res-crystal.png'),
  resRelic: require('./sprites/res-relic.png'),

  // Workers
  workerHerbalist: require('./sprites/worker-herbalist.png'),
  workerMiner: require('./sprites/worker-miner.png'),
  workerScholar: require('./sprites/worker-scholar.png'),
  workerScout: require('./sprites/worker-scout.png'),

  // Clan Emblems
  clanGlut: require('./sprites/clan-glut.png'),
  clanFrost: require('./sprites/clan-frost.png'),
  clanHain: require('./sprites/clan-hain.png'),
} as const;

// --- UI Icons ---
export const icons = {
  sword: require('./ui/icon-sword.png'),
  shield: require('./ui/icon-shield.png'),
  heart: require('./ui/icon-heart.png'),
  herb: require('./ui/icon-herb.png'),
  crystal: require('./ui/icon-crystal.png'),
  relic: require('./ui/icon-relic.png'),
  quest: require('./ui/icon-quest.png'),
  streak: require('./ui/icon-streak.png'),
  flee: require('./ui/icon-flee.png'),
  vision: require('./ui/icon-vision.png'),
} as const;

// --- UI Frames ---
export const frames = {
  dark: require('./ui/frame-dark.9.png'),
  light: require('./ui/frame-light.9.png'),
  gold: require('./ui/frame-gold.9.png'),
} as const;

// --- Audio ---
export const audio = {
  wandel: require('./audio/wandel.mp3'),
  jagd: require('./audio/jagd.mp3'),
} as const;

// --- Helper maps for dynamic lookup ---
import type { ClanType, WorkerType, VisionType } from '@undead/shared';
import type { ImageSourcePropType } from 'react-native';

export const playerSpriteByClan: Record<ClanType, ImageSourcePropType> = {
  glut: sprites.playerGlut,
  frost: sprites.playerFrost,
  hain: sprites.playerHain,
};

export const citystateSpriteByClan: Record<ClanType, ImageSourcePropType> = {
  glut: sprites.citystateGlut,
  frost: sprites.citystateFrost,
  hain: sprites.citystateHain,
};

export const clanEmblem: Record<ClanType, ImageSourcePropType> = {
  glut: sprites.clanGlut,
  frost: sprites.clanFrost,
  hain: sprites.clanHain,
};

export const bastionSpriteByLevel: ImageSourcePropType[] = [
  sprites.bastionLv1,
  sprites.bastionLv2,
  sprites.bastionLv3,
];

export const workerSprite: Record<WorkerType, ImageSourcePropType> = {
  herbalist: sprites.workerHerbalist,
  miner: sprites.workerMiner,
  scholar: sprites.workerScholar,
  scout: sprites.workerScout,
};

export const workerIcon: Record<WorkerType, ImageSourcePropType> = {
  herbalist: icons.herb,
  miner: icons.crystal,
  scholar: icons.quest,
  scout: icons.vision,
};

export const resourceIcon: Record<string, ImageSourcePropType> = {
  herb: icons.herb,
  crystal: icons.crystal,
  relic: icons.relic,
};

export const visionIcon: Record<VisionType, ImageSourcePropType> = {
  buff_herbs: icons.herb,
  buff_crystals: icons.crystal,
  buff_xp: icons.streak,
  bonus_resource: icons.relic,
  scout_hint: icons.vision,
};
