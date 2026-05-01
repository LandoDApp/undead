// ============================
// Central Asset Registry
// ============================
// All assets are referenced via this file.
// Never use emoji or inline require() elsewhere.

// --- Sprites ---
export const sprites = {
  // Player (per clan)
  playerGlut: require('../../../assets/sprites/player-glut.png'),
  playerFrost: require('../../../assets/sprites/player-frost.png'),
  playerHain: require('../../../assets/sprites/player-hain.png'),

  // Ghoul
  ghoul: require('../../../assets/sprites/ghoul.png'),

  // Bastion (per level)
  bastionLv1: require('../../../assets/sprites/bastion-lv1.png'),
  bastionLv2: require('../../../assets/sprites/bastion-lv2.png'),
  bastionLv3: require('../../../assets/sprites/bastion-lv3.png'),

  // City-State (per clan)
  citystateGlut: require('../../../assets/sprites/citystate-glut.png'),
  citystateFrost: require('../../../assets/sprites/citystate-frost.png'),
  citystateHain: require('../../../assets/sprites/citystate-hain.png'),

  // Resources
  resHerb: require('../../../assets/sprites/res-herb.png'),
  resCrystal: require('../../../assets/sprites/res-crystal.png'),
  resRelic: require('../../../assets/sprites/res-relic.png'),

  // Workers
  workerHerbalist: require('../../../assets/sprites/worker-herbalist.png'),
  workerMiner: require('../../../assets/sprites/worker-miner.png'),
  workerScholar: require('../../../assets/sprites/worker-scholar.png'),
  workerScout: require('../../../assets/sprites/worker-scout.png'),

  // Clan Emblems
  clanGlut: require('../../../assets/sprites/clan-glut.png'),
  clanFrost: require('../../../assets/sprites/clan-frost.png'),
  clanHain: require('../../../assets/sprites/clan-hain.png'),
} as const;

// --- UI Icons (16x16 pixel art, exported 48x48) ---
export const icons = {
  sword: require('../../../assets/ui/icon-sword.png'),
  shield: require('../../../assets/ui/icon-shield.png'),
  heart: require('../../../assets/ui/icon-heart.png'),
  herb: require('../../../assets/ui/icon-herb.png'),
  crystal: require('../../../assets/ui/icon-crystal.png'),
  relic: require('../../../assets/ui/icon-relic.png'),
  quest: require('../../../assets/ui/icon-quest.png'),
  streak: require('../../../assets/ui/icon-streak.png'),
  flee: require('../../../assets/ui/icon-flee.png'),
  vision: require('../../../assets/ui/icon-vision.png'),
} as const;

// --- UI Frames (9-slice) ---
export const frames = {
  dark: require('../../../assets/ui/frame-dark.9.png'),
  light: require('../../../assets/ui/frame-light.9.png'),
  gold: require('../../../assets/ui/frame-gold.9.png'),
} as const;

// --- Audio ---
export const audio = {
  wandel: require('../../../assets/audio/wandel.mp3'),
  jagd: require('../../../assets/audio/jagd.mp3'),
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
