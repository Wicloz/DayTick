package main

import (
	"github.com/wicloz/daytick/database"
	"github.com/wicloz/daytick/server"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.Connect()

	app := fiber.New()
	server.Register(app)
	app.Listen(":3000")
}
