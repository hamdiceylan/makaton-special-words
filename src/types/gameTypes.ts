// Game types and configurations

export type GameType = 
  | 'match-pictures'    // Resim → Resim eşleme
  | 'match-words'       // Kelime → Kelime eşleme  
  | 'picture-to-word'   // Resim → Kelime eşleme
  | 'word-to-picture'   // Kelime → Resim eşleme
  | 'sound-to-picture'  // Ses → Resim eşleme
  | 'sound-to-word';    // Ses → Kelime eşleme

export type CardContentType = 'image' | 'text' | 'question-icon';
export type FlipType = 'single' | 'double';
export type MatchProperty = 'image' | 'text';

export interface GameConfig {
  // Match card (ortadaki sürüklenebilir kart) nasıl görünecek?
  matchCardContent: CardContentType;
  
  // Static cards (sabit kartlar) nasıl görünecek?
  staticCardContent: CardContentType;
  
  // Eşleşme kontrolü hangi property üzerinden yapılacak?
  matchProperty: MatchProperty;
  
  // Flip animasyonu single mi double mi?
  flipType: FlipType;
  
  // Match sonrası static card'ın içeriği ne olacak?
  matchedStaticContent: CardContentType;
  
  // Match sonrası match card'ın içeriği ne olacak? (flip için)
  matchedMatchContent: CardContentType;
  
  // Ses otomatik çalacak mı başlangıçta? (sound-to-* oyunları için)
  autoPlaySound?: boolean;
}

// Her oyun tipi için konfigürasyon
export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  'match-pictures': {
    matchCardContent: 'image',
    staticCardContent: 'image',
    matchProperty: 'image',
    flipType: 'single',
    matchedStaticContent: 'text',
    matchedMatchContent: 'text',
  },
  'match-words': {
    matchCardContent: 'text',
    staticCardContent: 'text',
    matchProperty: 'text',
    flipType: 'single',
    matchedStaticContent: 'image',
    matchedMatchContent: 'image',
  },
  'picture-to-word': {
    matchCardContent: 'image',
    staticCardContent: 'text',
    matchProperty: 'text',
    flipType: 'double',
    matchedStaticContent: 'image',
    matchedMatchContent: 'text',
  },
  'word-to-picture': {
    matchCardContent: 'text',
    staticCardContent: 'image',
    matchProperty: 'text',
    flipType: 'double',
    matchedStaticContent: 'text',
    matchedMatchContent: 'image',
  },
  'sound-to-picture': {
    matchCardContent: 'question-icon',
    staticCardContent: 'image',
    matchProperty: 'image',
    flipType: 'single',
    matchedStaticContent: 'text',
    matchedMatchContent: 'text',
    autoPlaySound: true,
  },
  'sound-to-word': {
    matchCardContent: 'question-icon',
    staticCardContent: 'text',
    matchProperty: 'text',
    flipType: 'single',
    matchedStaticContent: 'image',
    matchedMatchContent: 'image',
    autoPlaySound: true,
  },
};

