package handlers

import (
	"test/database"
	"test/middleware"
	"test/utils"

	"net/mail"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func isValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

func Register(c *fiber.Ctx) error {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.APIerror(c, fiber.StatusBadRequest, "failed to parse request body")
	}

	if !isValidEmail(body.Email) {
		return utils.APIerror(c, fiber.StatusBadRequest, "invalid email")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "invalid password")
	}

	user := database.User{
		Email:        strings.ToLower(body.Email),
		PasswordHash: string(hash),
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return utils.APIerror(c, fiber.StatusConflict, "invalid email")
	}

	session, err := middleware.CreateSession(user.ID)
	if err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "failed to create auth session")
	}

	c.Cookie(&fiber.Cookie{
		Name:    "session_token",
		Value:   session.Token.String(),
		Expires: session.Expires,
	})

	return utils.APIok(c, fiber.StatusCreated)
}

func Login(c *fiber.Ctx) error {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.APIerror(c, fiber.StatusBadRequest, "failed to parse request body")
	}

	var user database.User
	if err := database.DB.Where("email = ?", strings.ToLower(body.Email)).First(&user).Error; err != nil {
		return utils.APIerror(c, fiber.StatusUnauthorized, "invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(body.Password)); err != nil {
		return utils.APIerror(c, fiber.StatusUnauthorized, "invalid email or password")
	}

	session, err := middleware.CreateSession(user.ID)
	if err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "failed to create auth session")
	}

	c.Cookie(&fiber.Cookie{
		Name:    "session_token",
		Value:   session.Token.String(),
		Expires: session.Expires,
	})

	return utils.APIok(c, fiber.StatusOK)
}

func Logout(c *fiber.Ctx) error {
	token := c.Cookies("session_token")
	if token == "" {
		return utils.APIerror(c, fiber.StatusUnauthorized, "missing or invalid session token")
	}

	tokenUUID, err := uuid.Parse(token)
	if err != nil {
		return utils.APIerror(c, fiber.StatusUnauthorized, "missing or invalid session token")
	}

	if err := middleware.InvalidateSession(tokenUUID); err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "failed to invalidate auth session")
	}

	c.ClearCookie("session_token")
	return utils.APIok(c, fiber.StatusOK)
}
