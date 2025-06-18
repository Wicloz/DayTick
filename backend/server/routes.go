package server

import (
	"github.com/wicloz/daytick/handlers"
	"github.com/wicloz/daytick/middleware"

	"github.com/gofiber/fiber/v2"
)

func Register(app *fiber.App) {
	app.Static("/", "./public/")

	api := app.Group("/api")
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Post("/logout", handlers.Logout)

	tasks := api.Group("/tasks", middleware.RequiresAuth)
	tasks.Post("/", handlers.CreateTask)
	tasks.Get("/", handlers.SearchTasks)
	tasks.Get("/count", handlers.CountTasks)
	tasks.Get("/:id", handlers.GetTask)
	tasks.Patch("/:id", handlers.UpdateTask)
	tasks.Delete("/:id", handlers.DeleteTask)
}
