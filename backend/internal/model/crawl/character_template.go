package crawl

import (
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type CharacterTemplate struct {
	gorm.Model

	// Identity
	Name          string `json:"name" gorm:"not null"`
	CharacterType string `json:"character_type" gorm:"column:character_type;default:pc"`
	CreatureType  string `json:"creature_type"`
	CreatureTypeCustom string `json:"creature_type_custom"`
	Race          string `json:"race"`
	Class         string `json:"class"`
	Alignment     string `json:"alignment"`
	Size          string `json:"size"`
	PhotoPath     string `json:"photo_path"`
	Color         string `json:"color"`

	// Core stats
	Level            uint `json:"level"`
	HP               uint `json:"hp"`
	MaxHP            uint `json:"max_hp"`
	AC               uint `json:"ac"`
	ProficiencyBonus uint `json:"proficiency_bonus"`
	HitDice          uint `json:"hit_dice"`
	SpellSlots       uint `json:"spell_slots"`
	RageSlots        uint `json:"rage_slots"`

	// Speeds (ft)
	Speed       uint `json:"speed"`
	BurrowSpeed uint `json:"burrow_speed"`
	ClimbSpeed  uint `json:"climb_speed"`
	FlySpeed    uint `json:"fly_speed"`
	SwimSpeed   uint `json:"swim_speed"`

	// Complex data (JSON columns)
	Abilities       AbilityScoresColumn   `json:"abilities" gorm:"type:TEXT"`
	SavingThrows    SavingThrowsColumn    `json:"saving_throws" gorm:"type:TEXT"`
	Skills          SkillScoresColumn     `json:"skills" gorm:"type:TEXT"`
	Immunities      ImmunitiesColumn      `json:"immunities" gorm:"type:TEXT"`
	DamageRelations DamageRelationsColumn `json:"damage_relations" gorm:"type:TEXT"`
	Languages       LanguagesColumn       `json:"languages" gorm:"type:TEXT"`
	Senses          SensesColumn          `json:"senses" gorm:"type:TEXT"`
	Actions         NamedEntriesColumn    `json:"actions" gorm:"type:TEXT"`
	Reactions       NamedEntriesColumn    `json:"reactions" gorm:"type:TEXT"`
	OtherFeatures   NamedEntriesColumn    `json:"other_features" gorm:"type:TEXT"`

	CustomFields datatypes.JSON `json:"custom_fields"`
}
