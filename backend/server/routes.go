package server

import (
	"github.com/wicloz/daytick/handlers"

	"github.com/gofiber/fiber/v2"
)

func Register(app *fiber.App) {
	app.Static("/", "./public/")

	api := app.Group("/api")

	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Post("/logout", handlers.Logout)
}
