package images

import (
	"dmd/backend/internal/api/common"
	errors2 "dmd/backend/internal/api/common/errors"
	"dmd/backend/internal/api/common/utils"
	"dmd/backend/internal/api/handlers"
	"dmd/backend/internal/services/images"
	"dmd/backend/internal/services/pdf"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type UploadHandler struct {
	handlers.BaseHandler
	imageService *images.Service
	pdfService   *pdf.Service
	log          *slog.Logger
}

func NewUploadHandler(rs *common.RoutingServices, path string) common.IHandler {
	return &UploadHandler{
		BaseHandler:  handlers.NewBaseHandler(path),
		imageService: rs.ImageService,
		pdfService:   rs.PdfService,
		log:          rs.Log,
	}
}

func (h *UploadHandler) Post(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form with 10MB max size
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("File too large or invalid form data", err))
		return
	}

	// Get the file from the form
	file, header, err := r.FormFile("file")
	if err != nil {
		utils.RespondWithError(w, errors2.NewBadRequestError("Failed to get file from request", err))
		return
	}
	defer file.Close()

	// Validate file type by checking content type
	contentType := header.Header.Get("Content-Type")
	validImageTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}
	isPdf := contentType == "application/pdf"

	if !validImageTypes[contentType] && !isPdf {
		utils.RespondWithError(w, errors2.NewBadRequestError("Invalid file type. Only images (jpg, jpeg, png, gif, webp) and PDF files are allowed", nil))
		return
	}

	// Route to the correct destination directory
	var destDir string
	if isPdf {
		destDir = h.pdfService.GetPdfPath()
	} else {
		destDir = h.imageService.GetImagesPath()
	}

	// Generate unique filename if file already exists
	originalFilename := header.Filename
	uniqueFilename := h.generateUniqueFilename(originalFilename, destDir)

	// Construct the full save path
	savePath := filepath.Join(destDir, uniqueFilename)

	// Create the destination file
	dst, err := os.Create(savePath)
	if err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to create file", err))
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	if _, err := io.Copy(dst, file); err != nil {
		utils.RespondWithError(w, errors2.NewInternalError("Failed to save file", err))
		return
	}

	h.log.Info("File uploaded successfully", "filename", uniqueFilename)

	// Return success response
	response := map[string]string{
		"message":  "File uploaded successfully",
		"filename": uniqueFilename,
	}
	utils.RespondWithJSON(w, http.StatusCreated, response)
}

func (h *UploadHandler) Get(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusMethodNotAllowed)
}

func (h *UploadHandler) Put(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusMethodNotAllowed)
}

func (h *UploadHandler) Delete(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusMethodNotAllowed)
}

// generateUniqueFilename generates a unique filename if the file already exists
// Example: image.jpg -> image_1.jpg -> image_2.jpg
func (h *UploadHandler) generateUniqueFilename(filename string, destDir string) string {
	ext := filepath.Ext(filename)
	baseName := strings.TrimSuffix(filename, ext)

	testPath := filepath.Join(destDir, filename)
	if _, err := os.Stat(testPath); os.IsNotExist(err) {
		return filename
	}

	counter := 1
	for {
		newFilename := fmt.Sprintf("%s_%d%s", baseName, counter, ext)
		testPath := filepath.Join(destDir, newFilename)
		if _, err := os.Stat(testPath); os.IsNotExist(err) {
			return newFilename
		}
		counter++
	}
}

