// File: /internal/platform/storage/repository.go
package storage

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/model/audio"
    "dmd/backend/internal/model/character"
    "dmd/backend/internal/model/combat"
    "dmd/backend/internal/model/gameplay"
    "dmd/backend/internal/model/media"
)

type CharacterRepository interface {
    GetCharacterByID(id uint) (*character.Character, error)
    GetAllCharacters(filters common.CharacterFilters) ([]*character.Character, error)
    CreateCharacter(char *character.Character) error
    UpdateCharacter(char *character.Character) error
    DeleteCharacter(id uint) error
    LevelUpCharacter(id uint, newMaxHP uint) (*character.Character, error)
}

type NPCRepository interface {
    GetNPCByID(id uint) (*character.NPC, error)
    GetAllNPCs(filters common.NPCFilters) ([]*character.NPC, error)
    CreateNPC(npc *character.NPC) error
    UpdateNPC(npc *character.NPC) error
    DeleteNPC(id uint) error
    BulkCreateNPCs(npcs []*character.NPC) error // Transactional method
}

type AbilityRepository interface {
    GetAbilityByID(id uint) (*character.Ability, error)
    GetAbilitiesByCharacterID(characterID uint) ([]*character.Ability, error)
    CreateAbility(ability *character.Ability) error
    UpdateAbility(ability *character.Ability) error
    DeleteAbility(id uint) error
    AssignAbilitiesToCharacter(characterID uint, abilities []*character.Ability) error // Transactional
}

type CombatRepository interface {
    CreateCombat(combat *combat.Combat) error // Transactional method
    GetActiveCombat() (*combat.Combat, error)
    GetCombatByID(id uint) (*combat.Combat, error)
    UpdateCombatant(combatant *combat.Combatant) error
}

type ItemRepository interface {
    GetItemByID(id uint) (*gameplay.Item, error)
    GetAllItems(filters common.ItemFilters) ([]*gameplay.Item, error)
    CreateItem(item *gameplay.Item) error
    UpdateItem(item *gameplay.Item) error
    DeleteItem(id uint) error
    BulkCreateItems(items []*gameplay.Item) error // Transactional
}

type SpellRepository interface {
    GetSpellByID(id uint) (*gameplay.Spell, error)
    GetAllSpells(filters common.SpellFilters) ([]*gameplay.Spell, error)
    CreateSpell(spell *gameplay.Spell) error
    UpdateSpell(spell *gameplay.Spell) error
    DeleteSpell(id uint) error
    BulkCreateSpells(spells []*gameplay.Spell) error // Transactional
}

type TrackRepository interface {
    GetTrackByID(id uint) (*audio.Track, error)
}

type PlaylistRepository interface {
    GetPlaylistByID(id uint) (*audio.Playlist, error)
}

type MediaAssetRepository interface {
    GetMediaAssetByID(id uint) (*media.MediaAsset, error)
}
