package handlers

import (
	"github.com/wicloz/daytick/database"
	"github.com/wicloz/daytick/utils"

	"regexp"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var dateFormat = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

func isValidDate(date string) bool {
	return dateFormat.MatchString(date)
}

func GetTask(c *fiber.Ctx) error {
	taskID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || taskID < 1 {
		return utils.APIerror(c, fiber.StatusBadRequest, "invalid task ID")
	}

	var task database.Task
	if err := database.DB.Where("id = ?", taskID).First(&task).Error; err != nil {
		return utils.APIerror(c, fiber.StatusNotFound, "task does not exist")
	}

	if task.UserID != c.Locals("userID").(uint) {
		return utils.APIerror(c, fiber.StatusForbidden, "task is not yours")
	}

	return c.JSON(task)
}

func CreateTask(c *fiber.Ctx) error {
	var body struct {
		Title     string `json:"title"`
		PlannedAt string `json:"planned_at"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.APIerror(c, fiber.StatusBadRequest, "failed to parse request body")
	}

	if !isValidDate(body.PlannedAt) {
		return utils.APIerror(c, fiber.StatusBadRequest, "invalid date")
	}

	task := database.Task{
		UserID:    c.Locals("userID").(uint),
		Title:     body.Title,
		PlannedAt: body.PlannedAt,
	}

	if err := database.DB.Create(&task).Error; err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "failed to create task")
	}

	return c.JSON(task)
}

func DeleteTask(c *fiber.Ctx) error {
	taskID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || taskID < 1 {
		return utils.APIerror(c, fiber.StatusBadRequest, "invalid task ID")
	}

	var task database.Task
	if err := database.DB.Where("id = ?", taskID).First(&task).Error; err != nil {
		return utils.APIerror(c, fiber.StatusNotFound, "task does not exist")
	}

	if task.UserID != c.Locals("userID").(uint) {
		return utils.APIerror(c, fiber.StatusForbidden, "task is not yours")
	}

	if err := database.DB.Delete(&task).Error; err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "failed to delete task")
	}

	return c.JSON(task)
}

func UpdateTask(c *fiber.Ctx) error {
	taskID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || taskID < 1 {
		return utils.APIerror(c, fiber.StatusBadRequest, "invalid task ID")
	}

	var body struct {
		Title     *string `json:"title"`
		PlannedAt *string `json:"planned_at"`
		Completed *bool   `json:"completed"`
	}
	if err := c.BodyParser(&body); err != nil {
		return utils.APIerror(c, fiber.StatusBadRequest, "failed to parse request body")
	}

	if body.PlannedAt != nil && !isValidDate(*body.PlannedAt) {
		return utils.APIerror(c, fiber.StatusBadRequest, "invalid date")
	}

	var task database.Task
	if err := database.DB.Where("id = ?", taskID).First(&task).Error; err != nil {
		return utils.APIerror(c, fiber.StatusNotFound, "task does not exist")
	}

	if task.UserID != c.Locals("userID").(uint) {
		return utils.APIerror(c, fiber.StatusForbidden, "task is not yours")
	}

	if body.Title != nil {
		task.Title = *body.Title
	}
	if body.PlannedAt != nil {
		task.PlannedAt = *body.PlannedAt
	}
	if body.Completed != nil {
		task.Completed = *body.Completed
	}

	if err := database.DB.Save(&task).Error; err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "failed to update task")
	}

	return c.JSON(task)
}

func buildTaskFilterQuery(c *fiber.Ctx) *gorm.DB {
	query := database.DB.Where("user_id = ?", c.Locals("userID").(uint))

	after := c.Query("after")
	if isValidDate(after) {
		query = query.Where("planned_at > ?", after)
	}

	before := c.Query("before")
	if isValidDate(before) {
		query = query.Where("planned_at < ?", before)
	}

	completed := c.Query("completed")
	if completed == "true" {
		query = query.Where("completed = ?", true)
	}
	if completed == "false" {
		query = query.Where("completed = ?", false)
	}

	return query
}

func CountTasks(c *fiber.Ctx) error {
	query := buildTaskFilterQuery(c)

	var count int64
	if err := query.Model(&database.Task{}).Count(&count).Error; err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "failed to count tasks")
	}

	return c.JSON(fiber.Map{"count": count})
}

func SearchTasks(c *fiber.Ctx) error {
	query := buildTaskFilterQuery(c)

	if limit, err := strconv.ParseUint(c.Query("limit"), 10, 0); err == nil {
		query = query.Limit(int(limit))
	}

	if offset, err := strconv.ParseUint(c.Query("offset"), 10, 0); err == nil {
		query = query.Offset(int(offset))
	}

	orderCol := c.Query("order_col")
	if orderCol != "planned_at" && orderCol != "created_at" {
		orderCol = "id"
	}

	orderDir := c.Query("order_dir")
	if orderCol == "id" {
		orderDir = "desc"
	}

	if orderDir != "asc" && orderDir != "desc" {
		return utils.APIerror(c, fiber.StatusBadRequest, "invalid order direction")
	}

	var tasks []database.Task
	if err := query.Order(orderCol + " " + orderDir).Find(&tasks).Error; err != nil {
		return utils.APIerror(c, fiber.StatusInternalServerError, "failed to retrieve tasks")
	}

	return c.JSON(tasks)
}
