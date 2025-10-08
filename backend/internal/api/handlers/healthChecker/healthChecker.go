package healthChecker

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/handlers"
	"encoding/json"
	"net/http"
)

type HealthCheckerHandler struct {
	handlers.BaseHandler
}

func NewHealthCheckerHandler(_ *common.RoutingServices, path string) common.IHandler {
	return &HealthCheckerHandler{
		BaseHandler: handlers.NewBaseHandler(path),
	}
}

func (h *HealthCheckerHandler) Get(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := map[string]string{"status": "ok"}
	json.NewEncoder(w).Encode(response)
}

func (h *HealthCheckerHandler) Post(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := map[string]string{"status": "ok"}
	json.NewEncoder(w).Encode(response)
}

func (h *HealthCheckerHandler) Put(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := map[string]string{"status": "ok"}
	json.NewEncoder(w).Encode(response)
}

func (h *HealthCheckerHandler) Delete(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	response := map[string]string{"status": "ok"}
	json.NewEncoder(w).Encode(response)
}
