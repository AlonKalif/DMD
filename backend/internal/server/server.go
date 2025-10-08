// File: /internal/server/server.go
package server

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/routes"
	"dmd/backend/internal/platform/logger"
	"dmd/backend/internal/platform/storage"
	"dmd/backend/internal/services/assets"
	"dmd/backend/internal/services/watcher"
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

type Server struct {
	log            *slog.Logger
	server         *http.Server
	wsManager      *websocket.Manager
	watcherService *watcher.Service
}

// New is the main constructor for our server. It orchestrates the setup.
func New() *Server {
	log := logger.New()
	env := loadEnvVars(log)
	db := initDB(log, env.dbPath)

	// Run database migrations on every startup.
	runMigrations(log, db)

	// Initialize services.
	wsManager := websocket.NewManager(log)
	assetService := initAssetService(log, db, env.assetsPath)
	watcherSvc := watcher.NewService(log, assetService, wsManager, env.assetsPath)

	// Initialize router
	router := routes.NewRouter(&common.RoutingServices{
		Log:          log,
		DbConnection: db,
		WsManager:    wsManager,
		AssetService: assetService})

	// Initialize server
	httpServer := newHttpServer(router, ":"+env.serverPort)

	return &Server{
		log:       log,
		server:    httpServer,
		wsManager: wsManager,
	}
}

// RunServer starts all background services and the main HTTP server.
func (s *Server) RunServer() {
	go s.wsManager.Run()

	s.log.Info("Starting server", "addr", s.server.Addr)
	if err := s.server.ListenAndServe(); err != nil {
		s.log.Error("Server failed to start", "error", err)
		os.Exit(1)
	}
}

// --- Helper Functions for Initialization ---

func loadEnvVars(log *slog.Logger) *environmentVariables {
	if err := godotenv.Load(); err != nil {
		log.Warn("No .env file found, using default environment")
	}

	env := &environmentVariables{}
	env.dbPath = os.Getenv("DB_PATH")
	if env.dbPath == "" {
		env.dbPath = "dmd.db"
	}
	env.serverPort = os.Getenv("SERVER_PORT")
	if env.serverPort == "" {
		env.serverPort = "8080"
	}
	env.assetsPath = os.Getenv("ASSETS_PATH")
	if env.assetsPath == "" {
		env.assetsPath = "public" // Default to "public"
	}
	return env
}

func initDB(log *slog.Logger, dbPath string) *gorm.DB {
	db, err := storage.NewConnection(log, dbPath)
	if err != nil {
		log.Error("Failed to init db connection", "error", err)
		os.Exit(1)
	}
	return db
}

func runMigrations(log *slog.Logger, db *gorm.DB) {
	if err := storage.AutoMigrate(db); err != nil {
		log.Error("Failed to migrate database", "error", err)
		os.Exit(1)
	}
	log.Info("Database migration completed successfully")
}

func initAssetService(log *slog.Logger, db *gorm.DB) *assets.Service {
	mediaAssetRepo := storage.NewMediaAssetRepository(db)
	assetService := assets.NewService(mediaAssetRepo, log)
	assetService.SyncAssetsWithDatabase() // Perform initial sync.
	return assetService
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

// environmentVariables struct can also be defined here.
type environmentVariables struct {
	serverPort string
	dbPath     string
	assetsPath string
}
