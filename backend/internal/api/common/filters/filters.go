package filters

// Filters define the available query parameters for filtering database models.
type CharacterFilters struct {
	Name     string
	Class    string
	Page     int
	PageSize int
}

type NPCFilters struct {
	Name     string
	Type     string
	Race     string
	Page     int
	PageSize int
}

type ItemFilters struct {
	Name     string
	Type     string
	Rarity   string
	Page     int
	PageSize int
}

type SpellFilters struct {
	Name            string
	Level           *int // Use a pointer to distinguish between 0 and not provided
	School          string
	IsConcentration *bool // Use a pointer for boolean filtering
	Page            int
	PageSize        int
}

type TrackFilters struct {
	Title    string
	Artist   string
	Source   string
	Page     int
	PageSize int
}

type PlaylistFilters struct {
	Name     string
	Page     int
	PageSize int
}

type MediaAssetFilters struct {
	Name     string
	Type     string
	Page     int
	PageSize int
}
