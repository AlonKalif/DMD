package main

import (
    "dmd/backend/internal/server"
)

func main() {
    sm := server.New()

    sm.RunServer() // Blocking
}
