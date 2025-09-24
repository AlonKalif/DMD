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
}

type CombatRepository interface {
    GetCombatByID(id uint) (*combat.Combat, error)
}

type ItemRepository interface {
    GetItemByID(id uint) (*gameplay.Item, error)
}

type SpellRepository interface {
    GetSpellByID(id uint) (*gameplay.Spell, error)
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
