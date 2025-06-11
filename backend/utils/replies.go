package utils

import (
	"github.com/gofiber/fiber/v2"
)

func APIreply(c *fiber.Ctx, data fiber.Map) error {
	return c.JSON(data)
}

func APIok(c *fiber.Ctx, status int) error {
	return c.Status(status).SendString("{}")
}

func APIerror(c *fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(fiber.Map{"error": message})
}
