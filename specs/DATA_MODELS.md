# Data Models

## Player Character
```typescript
interface PlayerCharacter {
  // Basic Info
  id: string;
  name: string;
  race: string;
  class: string[];  // Support multiclassing
  level: number[];  // Level per class
  background: string;
  alignment: string;
  experiencePoints: number;
  
  // Core Stats
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  
  // Derived Stats
  armorClass: number;
  initiative: number;
  speed: number;
  hitPoints: {
    maximum: number;
    current: number;
    temporary: number;
  };
  
  // Combat
  weapons: Weapon[];
  armor: Armor[];
  
  // Abilities
  proficiencies: string[];
  features: Feature[];
  spells: Spell[];
  
  // Inventory
  inventory: InventoryItem[];
  currency: {
    copper: number;
    silver: number;
    electrum: number;
    gold: number;
    platinum: number;
  };
  
  // Custom
  customSections: CustomSection[];
}

## NPC
```typescript
interface NPC {
  id: string;
  name: string;
  type: 'monster' | 'ally' | 'villain';
  challengeRating: number;
  
  // Stats similar to PlayerCharacter but simplified
  attributes: Attributes;
  hitPoints: HitPoints;
  armorClass: number;
  speed: number;
  
  // Combat
  actions: Action[];
  reactions: Reaction[];
  legendaryActions?: LegendaryAction[];
  
  // Additional Info
  description: string;
  notes: string;
  loot?: InventoryItem[];
}
```

## Combat Tracking
```typescript
interface CombatState {
  active: boolean;
  round: number;
  turnOrder: CombatParticipant[];
  currentTurn: number;
}

interface CombatParticipant {
  id: string;
  name: string;
  type: 'player' | 'npc';
  initiative: number;
  conditions: Condition[];
}
```

## Audio System
```typescript
interface AudioTrack {
  id: string;
  name: string;
  source: 'youtube' | 'spotify' | 'local';
  uri: string;
  duration: number;
  tags: string[];
}

interface Playlist {
  id: string;
  name: string;
  tracks: AudioTrack[];
  settings: {
    shuffle: boolean;
    loop: boolean;
    volume: number;
  };
}
```

## Display Content
```typescript
interface DisplayContent {
  id: string;
  type: 'image' | 'map' | 'handout';
  title: string;
  url: string;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
  };
  tags: string[];
}
```

## Custom Section
```typescript
interface CustomSection {
  id: string;
  title: string;
  content: CustomField[];
}

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'checkbox' | 'list';
  value: any;
}
```

## Common Types
```typescript
interface Weapon {
  name: string;
  damage: string;
  damageType: string;
  properties: string[];
  range: string;
}

interface Armor {
  name: string;
  type: string;
  baseAC: number;
  requirements?: string;
}

interface Spell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
}

interface Feature {
  name: string;
  source: string;
  description: string;
  uses?: {
    maximum: number;
    current: number;
    rechargeOn: string;
  };
}

interface InventoryItem {
  name: string;
  quantity: number;
  weight: number;
  description: string;
  value?: number;
}
```
