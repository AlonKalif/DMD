package routes

import (
    "dmd/backend/internal/api/common"
    "dmd/backend/internal/api/handlers/audio"
    "dmd/backend/internal/api/handlers/display"
    "dmd/backend/internal/api/handlers/gameplay/characters"
    "dmd/backend/internal/api/handlers/gameplay/combat"
    "dmd/backend/internal/api/handlers/gameplay/npcs"
    "dmd/backend/internal/api/handlers/healthChecker"
    "dmd/backend/internal/api/handlers/system"
    "dmd/backend/internal/api/handlers/websocket"
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
    newRouteDetails("/gameplay/combat", combat.NewCombatHandler),
    newRouteDetails("/audio", audio.NewAudioHandler),
    newRouteDetails("/display", display.NewDisplayHandler),
    newRouteDetails("/system", system.NewSystemHandler),
    newRouteDetails("/ws", websocket.NewWebsocketHandler),
}
