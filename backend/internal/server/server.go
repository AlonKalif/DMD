// File: /internal/server/server.go
package server

import (
	"dmd/backend/internal/api/common"
	"dmd/backend/internal/api/routes"
	"dmd/backend/internal/platform/logger"
	"dmd/backend/internal/platform/storage"
	"dmd/backend/internal/services/images"
	"dmd/backend/internal/services/websocket"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type Server struct {
	log        *slog.Logger
	server     *http.Server
	wsManager  *websocket.Manager
	imgService *images.Service
}

// New is the main constructor for our server. It orchestrates the setup.
func New() *Server {
	log := logger.New()
	configs := loadConfiguration(log, "./internal/server/server_config.json")
	db := initDB(log, configs.DBPath)

	// Run database migrations on every startup.
	runMigrations(log, db)

	// Initialize services.
	wsManager := websocket.NewManager(log)
	imgService := initImagesService(log, db, wsManager, configs.ImagesPath)

	// Initialize router
	router := routes.NewRouter(&common.RoutingServices{
		Log:          log,
		DbConnection: db,
		WsManager:    wsManager,
		ImageService: imgService}, configs.AssetsPath)

	// Initialize server
	httpServer := newHttpServer(router, ":"+configs.ServerPort)

	return &Server{
		log:        log,
		server:     httpServer,
		wsManager:  wsManager,
		imgService: imgService,
	}
}

// RunServer starts all background services and the main HTTP server.
func (s *Server) RunServer() {
	go s.wsManager.Run()
	s.imgService.RunImagesDirWatcher()

	s.log.Info("Starting server", "addr", s.server.Addr)
	if err := s.server.ListenAndServe(); err != nil {
		s.log.Error("Server failed to start", "error", err)
		os.Exit(1)
	}
}

// --- Helper Functions for Initialization ---

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

func initImagesService(log *slog.Logger, db *gorm.DB, wsManager *websocket.Manager, imagesPath string) *images.Service {
	imgRepo := storage.NewImagesRepository(db)
	imgService := images.NewService(log, imgRepo, wsManager, imagesPath)
	return imgService
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

func loadConfiguration(log *slog.Logger, filename string) ServerConfig {
	var config ServerConfig

	configFile, err := os.Open(filename)
	if err != nil {
		log.Error("Failed to open configuration file. Using default configurations.", "filename", filename, "error", err)
		return newDefaultConfigs()
	}
	defer configFile.Close()

	jsonParser := json.NewDecoder(configFile)
	err = jsonParser.Decode(&config)
	if err != nil {
		log.Error("Failed to decode configuration file. Using default configurations.", "filename", filename, "error", err)
		return newDefaultConfigs()
	}

	return config
}

func newDefaultConfigs() ServerConfig {
	return ServerConfig{
		ServerPort: "8080",
		DBPath:     "dmd.db",
		AssetsPath: "public",
		ImagesPath: "public/images",
		AudioPath:  "public/audio",
	}
}

type ServerConfig struct {
	ServerPort string `json:"server_port"`
	DBPath     string `json:"db_path"`
	AssetsPath string `json:"assets_path"`
	ImagesPath string `json:"images_path"`
	AudioPath  string `json:"audios_path"`
}
