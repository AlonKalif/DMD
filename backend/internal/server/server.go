package server

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/routes"
	"dmd/backend/internal/platform/logger"
	"dmd/backend/internal/platform/storage"
	"dmd/backend/internal/services/assets"
	"dmd/backend/internal/services/websocket"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

type environmentVariables struct {
	serverPort string
	dbPath     string
}

type Server struct {
	log              *slog.Logger
	dbConnection     *gorm.DB
	websocketManager *websocket.Manager
	router           *mux.Router
	server           *http.Server
	envVars          *environmentVariables
}

func New() *Server {
	s := &Server{}
	s.log = logger.New()
	s.envVars = &environmentVariables{}
	loadEnvVars(s.log, s.envVars)
	var err error
	if s.dbConnection, err = storage.NewConnection(s.log, s.envVars.dbPath); err != nil {
		s.log.Error("Failed to init db connection. Error: ", err)
		os.Exit(1)
	}

	mediaAssetRepo := storage.NewMediaAssetRepository(s.dbConnection)
	assetService := assets.NewService(mediaAssetRepo, s.log)
	assetService.SyncAssetsWithDatabase()

	s.websocketManager = websocket.NewManager(s.log)

	s.router = routes.NewRouter(&common.RoutingServices{
		Log:          s.log,
		DbConnection: s.dbConnection,
		WsManager:    s.websocketManager,
		AssetService: assetService})

	s.server = newHttpServer(s.router, ":"+s.envVars.serverPort)

	return s
}

func (s *Server) RunServer() {
	go s.websocketManager.Run()
	s.log.Info("Starting server", "addr", s.server.Addr)

	if err := s.server.ListenAndServe(); err != nil {
		s.log.Error("Server failed to start", "error", err)
		os.Exit(1)
	}
}

func loadEnvVars(log *slog.Logger, envVars *environmentVariables) {
	if err := godotenv.Load(); err != nil {
		log.Warn("No .env file found, using default environment")
	}

	envVars.dbPath = os.Getenv("DB_PATH")
	if envVars.dbPath == "" {
		log.Warn("DB_PATH not defined in .env file. Using default 'dmd.db'.")
		envVars.dbPath = "dmd.db"
	}

	envVars.serverPort = os.Getenv("SERVER_PORT")
	if envVars.serverPort == "" {
		log.Warn("SERVER_PORT not defined in .env file. Using default '8080'")
		envVars.serverPort = "8080"
	}
}

func newHttpServer(router *mux.Router, port string) *http.Server {
	allowedOrigins := handlers.AllowedOrigins([]string{"http://localhost:3000"})
	allowedMethods := handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE"})
	allowedHeaders := handlers.AllowedHeaders([]string{"Content-Type", "Authorization"})

	return &http.Server{
		Addr: port,
		// Wrap the main router with the CORS middleware.
		Handler:      handlers.CORS(allowedOrigins, allowedMethods, allowedHeaders)(router),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
}
