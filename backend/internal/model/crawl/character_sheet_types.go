package crawl

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// jsonColumn is a generic wrapper that implements driver.Valuer and sql.Scanner
// for any type, serializing it as JSON in the database.
type jsonColumn[T any] struct {
	Data T
}

func (j jsonColumn[T]) Value() (driver.Value, error) {
	return json.Marshal(j.Data)
}

func (j *jsonColumn[T]) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("jsonColumn.Scan: unsupported type %T", value)
	}
	return json.Unmarshal(bytes, &j.Data)
}

func (j jsonColumn[T]) MarshalJSON() ([]byte, error) {
	return json.Marshal(j.Data)
}

func (j *jsonColumn[T]) UnmarshalJSON(data []byte) error {
	return json.Unmarshal(data, &j.Data)
}

// Concrete JSON column types used by CharacterTemplate.
type AbilityScoresColumn = jsonColumn[AbilityScores]
type SkillScoresColumn = jsonColumn[SkillScores]
type SavingThrowsColumn = jsonColumn[[]SavingThrow]
type ImmunitiesColumn = jsonColumn[[]string]
type DamageRelationsColumn = jsonColumn[[]DamageRelation]
type LanguagesColumn = jsonColumn[[]LanguageEntry]
type SensesColumn = jsonColumn[[]SenseEntry]
type NamedEntriesColumn = jsonColumn[[]NamedEntry]

// AbilityScore holds a single ability's score and modifier.
type AbilityScore struct {
	Score    uint `json:"score"`
	Modifier uint `json:"modifier"`
}

// AbilityScores holds all six core D&D ability scores.
type AbilityScores struct {
	Strength     AbilityScore `json:"strength"`
	Dexterity    AbilityScore `json:"dexterity"`
	Constitution AbilityScore `json:"constitution"`
	Intelligence AbilityScore `json:"intelligence"`
	Wisdom       AbilityScore `json:"wisdom"`
	Charisma     AbilityScore `json:"charisma"`
}

// SkillScores holds all eighteen D&D skill values.
type SkillScores struct {
	Acrobatics     uint `json:"acrobatics"`
	AnimalHandling uint `json:"animal_handling"`
	Arcana         uint `json:"arcana"`
	Athletics      uint `json:"athletics"`
	Deception      uint `json:"deception"`
	History        uint `json:"history"`
	Insight        uint `json:"insight"`
	Intimidation   uint `json:"intimidation"`
	Investigation  uint `json:"investigation"`
	Medicine       uint `json:"medicine"`
	Nature         uint `json:"nature"`
	Perception     uint `json:"perception"`
	Performance    uint `json:"performance"`
	Persuasion     uint `json:"persuasion"`
	Religion       uint `json:"religion"`
	SleightOfHand  uint `json:"sleight_of_hand"`
	Stealth        uint `json:"stealth"`
	Survival       uint `json:"survival"`
}

// SavingThrow pairs a core ability name with its saving throw value.
type SavingThrow struct {
	Ability string `json:"ability"`
	Value   uint   `json:"value"`
}

// DamageRelation describes a character's immunity or vulnerability to a damage type.
type DamageRelation struct {
	DamageType string `json:"damage_type"`
	Relation   string `json:"relation"`
	CustomText string `json:"custom_text,omitempty"`
}

// LanguageEntry describes a known language and proficiency level.
type LanguageEntry struct {
	Language    string `json:"language"`
	Proficiency string `json:"proficiency"`
	CustomText  string `json:"custom_text,omitempty"`
}

// SenseEntry describes a sense the character possesses.
type SenseEntry struct {
	Sense      string `json:"sense"`
	CustomText string `json:"custom_text,omitempty"`
}

// NamedEntry is a generic name+description pair used for Actions, Reactions, and Features.
type NamedEntry struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// ResourceSlot represents a group of resource slots at a given level (e.g. 3 level-1 spell slots).
type ResourceSlot struct {
	Level int `json:"level"`
	Count int `json:"count"`
}

type ResourceSlotsColumn = jsonColumn[[]ResourceSlot]
