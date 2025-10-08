package routes

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/middleware"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"
)

func NewRouter(rs *common.RoutingServices) *mux.Router {
	newRouter := mux.NewRouter()
	applyMiddleware(newRouter, rs.Log)

	// Register the static file server on the MAIN router.
	fs := http.FileServer(http.Dir("./public/"))
	newRouter.PathPrefix("/static/").Handler(http.StripPrefix("/static/", fs))

	// Register the API subrouter.
	apiV1 := newRouter.PathPrefix("/api/v1").Subrouter()
	registerRoutes(apiV1, rs)

	return newRouter
}

func registerRoutes(router *mux.Router, rs *common.RoutingServices) {

	for _, handlerDetails := range apiRoutes {
		handler := handlerDetails.creator(rs, handlerDetails.path)
		subRouter := router.Path(handler.GetPath()).Subrouter()

		subRouter.Methods(http.MethodGet).HandlerFunc(handler.Get)
		subRouter.Methods(http.MethodPost).HandlerFunc(handler.Post)
		subRouter.Methods(http.MethodPut).HandlerFunc(handler.Put)
		subRouter.Methods(http.MethodDelete).HandlerFunc(handler.Delete)
	}
}

func applyMiddleware(r *mux.Router, log *slog.Logger) {
	r.Use(middleware.Recovery(log))
	r.Use(middleware.Logging(log))
}
