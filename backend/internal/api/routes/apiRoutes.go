package routes

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/handlers/audio"
	"dmd/backend/internal/api/handlers/display"
	"dmd/backend/internal/api/handlers/gameplay/abilities"
	"dmd/backend/internal/api/handlers/gameplay/characters"
	"dmd/backend/internal/api/handlers/gameplay/combat"
	"dmd/backend/internal/api/handlers/gameplay/items"
	"dmd/backend/internal/api/handlers/gameplay/npcs"
	"dmd/backend/internal/api/handlers/gameplay/spells"
	"dmd/backend/internal/api/handlers/healthChecker"
	"dmd/backend/internal/api/handlers/images"
	"dmd/backend/internal/api/handlers/system"
)

type routeDetails struct {
	path    string
	creator common.HandlerCreator
}

func newRouteDetails(path string, hc common.HandlerCreator) routeDetails {
	return routeDetails{
		path:    path,
		creator: hc,
	}
}

var apiRoutes = []routeDetails{
	newRouteDetails("/health", healthChecker.NewHealthCheckerHandler),
	newRouteDetails("/gameplay/characters", characters.NewCharactersHandler),
	newRouteDetails("/gameplay/npcs", npcs.NewNPCsHandler),
	newRouteDetails("/gameplay/abilities", abilities.NewAbilitiesHandler),
	newRouteDetails("/gameplay/items", items.NewItemsHandler),
	newRouteDetails("/gameplay/spells", spells.NewSpellsHandler),
	newRouteDetails("/gameplay/combat", combat.NewCombatHandler),
	newRouteDetails("/audio", audio.NewAudioHandler),
	newRouteDetails("/audio/tracks", audio.NewTracksHandler),
	newRouteDetails("/audio/playlists", audio.NewPlaylistsHandler),
	newRouteDetails("/display", display.NewDisplayHandler),
	newRouteDetails("/images/images", images.NewImagesHandler),
	newRouteDetails("/images/types", images.NewImageTypeHandler),
	newRouteDetails("/system", system.NewSystemHandler),
}
