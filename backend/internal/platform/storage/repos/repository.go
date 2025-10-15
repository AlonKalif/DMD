// File: /internal/platform/storage/repository.go
package repos

import (
	"dmd/backend/internal/api/common/filters"
	"dmd/backend/internal/model/audio"
	"dmd/backend/internal/model/character"
	"dmd/backend/internal/model/combat"
	"dmd/backend/internal/model/gameplay"
	"dmd/backend/internal/model/images"
)

type CharacterRepository interface {
	GetCharacterByID(id uint) (*character.Character, error)
	GetAllCharacters(filters filters.CharacterFilters) ([]*character.Character, error)
	CreateCharacter(char *character.Character) error
	UpdateCharacter(char *character.Character) error
	DeleteCharacter(id uint) error
	LevelUpCharacter(id uint, newMaxHP uint) (*character.Character, error)
}

type NPCRepository interface {
	GetNPCByID(id uint) (*character.NPC, error)
	GetAllNPCs(filters filters.NPCFilters) ([]*character.NPC, error)
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
	GetAllItems(filters filters.ItemFilters) ([]*gameplay.Item, error)
	CreateItem(item *gameplay.Item) error
	UpdateItem(item *gameplay.Item) error
	DeleteItem(id uint) error
	BulkCreateItems(items []*gameplay.Item) error // Transactional
}

type SpellRepository interface {
	GetSpellByID(id uint) (*gameplay.Spell, error)
	GetAllSpells(filters filters.SpellFilters) ([]*gameplay.Spell, error)
	CreateSpell(spell *gameplay.Spell) error
	UpdateSpell(spell *gameplay.Spell) error
	DeleteSpell(id uint) error
	BulkCreateSpells(spells []*gameplay.Spell) error // Transactional
}

type TrackRepository interface {
	GetTrackByID(id uint) (*audio.Track, error)
	GetAllTracks(filters filters.TrackFilters) ([]*audio.Track, error)
	CreateTrack(track *audio.Track) error
	UpdateTrack(track *audio.Track) error
	DeleteTrack(id uint) error
	BulkCreateTracks(tracks []*audio.Track) error // Transactional
}

type PlaylistRepository interface {
	GetPlaylistByID(id uint) (*audio.Playlist, error)
	GetAllPlaylists(filters filters.PlaylistFilters) ([]*audio.Playlist, error)
	CreatePlaylist(playlist *audio.Playlist, trackIDs []uint) (*audio.Playlist, error) // Transactional
}

type ImagesRepository interface {
	GetImageByID(id uint) (*images.ImageEntry, error)
	GetAllImages(filters filters.ImagesFilters) ([]*images.ImageEntry, error)
	GetAllTypes() ([]string, error)
	CreateImageEntry(asset *images.ImageEntry) error
	UpdateImageEntry(asset *images.ImageEntry) error
	DeleteImage(id uint) error
	GetImageByPath(path string) (*images.ImageEntry, error)
	BulkCreateImageEntries(assets []*images.ImageEntry) error // Transactional
}
