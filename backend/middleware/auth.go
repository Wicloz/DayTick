package middleware

import (
	"github.com/wicloz/daytick/database"
	"github.com/wicloz/daytick/utils"

	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var authTokenCache = make(map[uuid.UUID]uint)

func RequiresAuth(c *fiber.Ctx) error {
	token := c.Cookies("session_token")
	if token == "" {
		return utils.APIerror(c, fiber.StatusUnauthorized, "missing or invalid session token")
	}

	tokenUUID, err := uuid.Parse(token)
	if err != nil {
		return utils.APIerror(c, fiber.StatusUnauthorized, "missing or invalid session token")
	}

	userID, exists := authTokenCache[tokenUUID]
	if exists {
		c.Locals("userID", userID)
		return c.Next()
	}

	var expiredTokens []database.AuthToken
	if err := database.DB.Where("expires < ?", time.Now()).Find(&expiredTokens).Error; err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "failed to invalidate expired tokens")
	}

	for _, token := range expiredTokens {
		if err := InvalidateSession(token.Token); err != nil {
			return utils.APIerror(c, fiber.StatusInternalServerError, "failed to invalidate expired tokens")
		}
	}

	var authToken database.AuthToken
	if err := database.DB.Where("token = ?", tokenUUID).First(&authToken).Error; err != nil {
		return utils.APIerror(c, fiber.StatusUnauthorized, "missing or invalid session token")
	}

	authTokenCache[tokenUUID] = authToken.UserID
	c.Locals("userID", authToken.UserID)
	return c.Next()
}

func InvalidateSession(token uuid.UUID) error {
	delete(authTokenCache, token)
	return database.DB.Where("token = ?", token).Delete(&database.AuthToken{}).Error
}

func CreateSession(userID uint) (*database.AuthToken, error) {
	token := uuid.New()

	session := database.AuthToken{
		UserID:  userID,
		Token:   token,
		Expires: time.Now().AddDate(1, 0, 0),
	}

	if err := database.DB.Create(&session).Error; err != nil {
		return nil, err
	}

	authTokenCache[token] = userID
	return &session, nil
}
