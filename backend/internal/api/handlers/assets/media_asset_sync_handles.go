package assets

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	assetsService "dmd/backend/internal/services/assets"
	"net/http"
)

type SyncMediaAssetsHandler struct {
	handlers.BaseHandler
	assetService *assetsService.Service
}

func NewSyncMediaAssetsHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &SyncMediaAssetsHandler{
		BaseHandler:  handlers.NewBaseHandler(path),
		assetService: rs.AssetService,
	}
}

func (sh *SyncMediaAssetsHandler) Get(w http.ResponseWriter, r *http.Request) {
	sh.assetService.SyncAssetsWithDatabase()
	utils.RespondWithJSON(w, http.StatusOK, nil)
}
