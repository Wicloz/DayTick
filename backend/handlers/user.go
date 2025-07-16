package handlers

import (
	"github.com/wicloz/daytick/database"
	"github.com/wicloz/daytick/utils"

	"regexp"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

var timeFormat = regexp.MustCompile(`^\d{2}:\d{2}$`)

func isValidTime(time string) bool {
	return timeFormat.MatchString(time)
}

func isValidWeekday(weekday uint) bool {
	return weekday >= 1 && weekday <= 7
}

func ChangePassword(c *fiber.Ctx) error {
	var body struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.APIerror(c, fiber.StatusBadRequest, "failed to parse request body")
	}

	var user database.User
	if err := database.DB.Where("id = ?", c.Locals("userID")).First(&user).Error; err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "could not get current user")
	}

	if err := bcrypt.CompareHashAndPassword(user.PasswordHash, []byte(body.OldPassword)); err != nil {
		return utils.APIerror(c, fiber.StatusUnauthorized, "current password is incorrect")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "could not update password")
	}

	if err := database.DB.Model(&user).Update("password_hash", hash).Error; err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "could not update password")
	}

	return utils.APIok(c, fiber.StatusOK)
}

func GetSettings(c *fiber.Ctx) error {
	var user database.User
	if err := database.DB.Where("id = ?", c.Locals("userID")).First(&user).Error; err != nil {
		return utils.APIerror(c, fiber.StatusNotFound, "failed to get user settings")
	}

	return c.JSON(fiber.Map{
		"start_of_week": user.StartOfWeek,
		"rollover_time": user.RolloverTime,
	})
}

func UpdateSettings(c *fiber.Ctx) error {
	var body struct {
		StartOfWeek  *uint   `json:"start_of_week"`
		RolloverTime *string `json:"rollover_time"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.APIerror(c, fiber.StatusBadRequest, "failed to parse request body")
	}

	if body.StartOfWeek != nil && !isValidWeekday(*body.StartOfWeek) {
		return utils.APIerror(c, fiber.StatusBadRequest, "invalid start of week")
	}

	if body.RolloverTime != nil && !isValidTime(*body.RolloverTime) {
		return utils.APIerror(c, fiber.StatusBadRequest, "invalid rollover time")
	}

	var user database.User
	if err := database.DB.Where("id = ?", c.Locals("userID")).First(&user).Error; err != nil {
		return utils.APIerror(c, fiber.StatusNotFound, "failed to update user settings")
	}

	if body.StartOfWeek != nil {
		user.StartOfWeek = *body.StartOfWeek
	}
	if body.RolloverTime != nil {
		user.RolloverTime = *body.RolloverTime
	}

	if err := database.DB.Save(&user).Error; err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "failed to update user settings")
	}

	return c.JSON(user)
}
