package database

import (
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	driver := os.Getenv("DB_DRIVER")
	dsn := os.Getenv("DB_DSN")

	var dialector gorm.Dialector
	var err error

	switch driver {
	case "postgres":
		dialector = postgres.Open(dsn)
	case "mysql":
		dialector = mysql.Open(dsn)
	case "sqlite":
		dialector = sqlite.Open(dsn)
	default:
		log.Fatalf("Unsupported DB_DRIVER: %s", driver)
	}

	DB, err = gorm.Open(dialector)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(&User{}, &Task{}, &AuthToken{})
	if err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	log.Println("Database connected and migrated successfully")
}
