package handlers

import "net/http"

type BaseHandler struct {
    Path string
}

func NewBaseHandler(path string) BaseHandler {
    return BaseHandler{Path: path}
}

func (BaseHandler) Get(w http.ResponseWriter, _ *http.Request) {
    http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func (BaseHandler) Put(w http.ResponseWriter, _ *http.Request) {
    http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func (BaseHandler) Post(w http.ResponseWriter, _ *http.Request) {
    http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func (BaseHandler) Delete(w http.ResponseWriter, _ *http.Request) {
    http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func (b BaseHandler) GetPath() string {
    return b.Path
}
