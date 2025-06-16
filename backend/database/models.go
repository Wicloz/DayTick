package database

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Email        string `gorm:"unique;not null" json:"email"`
	PasswordHash []byte `gorm:"not null" json:"-"`

	StartOfWeek  string `gorm:"default:'monday'" json:"start_of_week"`
	RolloverTime string `gorm:"default:'00:00'" json:"rollover_time"`
}

type Task struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"-"`
	Title     string    `gorm:"not null" json:"title"`
	PlannedAt time.Time `gorm:"not null" json:"planned_at"`
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	Completed bool      `gorm:"default:false" json:"completed"`
}

type AuthToken struct {
	ID      uint      `gorm:"primaryKey" json:"id"`
	UserID  uint      `gorm:"index;not null" json:"-"`
	Token   uuid.UUID `gorm:"not null" json:"token"`
	Expires time.Time `gorm:"not null" json:"expires"`
}
