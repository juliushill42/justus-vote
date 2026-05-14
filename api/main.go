package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

var db *sql.DB

type District struct {
	ID              int       `json:"id"`
	State           string    `json:"state"`
	District        string    `json:"district"`
	OldRep          string    `json:"old_rep"`
	NewRep          string    `json:"new_rep"`
	BlackPct        float64   `json:"black_pct"`
	ChangeType      string    `json:"change_type"`
	Status          string    `json:"status"`
	Details         string    `json:"details"`
	AffectedVoters  int       `json:"affected_voters"`
	CreatedAt       time.Time `json:"created_at"`
}

type Lawsuit struct {
	ID         int    `json:"id"`
	Title      string `json:"title"`
	State      string `json:"state"`
	Plaintiff  string `json:"plaintiff"`
	Defendant  string `json:"defendant"`
	Status     string `json:"status"`
	Court      string `json:"court"`
	FiledDate  string `json:"filed_date"`
	Summary    string `json:"summary"`
	ActionURL  string `json:"action_url"`
}

type Incident struct {
	ID           int       `json:"id"`
	State        string    `json:"state"`
	City         string    `json:"city"`
	IncidentType string    `json:"incident_type"`
	Description  string    `json:"description"`
	Verified     bool      `json:"verified"`
	CreatedAt    time.Time `json:"created_at"`
}

type Action struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	ActionURL   string `json:"action_url"`
	ActionType  string `json:"action_type"`
	Urgency     string `json:"urgency"`
	State       string `json:"state"`
}

type ReportInput struct {
	State        string `json:"state" binding:"required"`
	City         string `json:"city" binding:"required"`
	IncidentType string `json:"incident_type" binding:"required"`
	Description  string `json:"description" binding:"required"`
}

type Stats struct {
	TotalDistricts     int     `json:"total_districts"`
	TotalAffected      int     `json:"total_affected_voters"`
	ActiveLawsuits     int     `json:"active_lawsuits"`
	TotalIncidents     int     `json:"total_incidents"`
	StatesUnderAttack  int     `json:"states_under_attack"`
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://justus:justus_vote@db:5432/justus_vote?sslmode=disable"
	}

	var err error
	for i := 0; i < 10; i++ {
		db, err = sql.Open("postgres", dsn)
		if err == nil {
			if err = db.Ping(); err == nil {
				break
			}
		}
		log.Printf("DB not ready, retry %d/10...", i+1)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatal("DB connection failed:", err)
	}
	log.Println("✓ JustUs Vote API connected to database")

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "justus-vote", "ip": "JCH-2026"})
	})

	api := r.Group("/api")
	{
		api.GET("/stats", getStats)
		api.GET("/districts", getDistricts)
		api.GET("/districts/:id", getDistrict)
		api.GET("/lawsuits", getLawsuits)
		api.GET("/incidents", getIncidents)
		api.POST("/incidents", reportIncident)
		api.GET("/actions", getActions)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8091"
	}
	log.Printf("JustUs Vote API running on :%s", port)
	r.Run(":" + port)
}

func getStats(c *gin.Context) {
	var s Stats
	db.QueryRow(`SELECT COUNT(*), COALESCE(SUM(affected_voters),0), COUNT(DISTINCT state) FROM districts`).Scan(&s.TotalDistricts, &s.TotalAffected, &s.StatesUnderAttack)
	db.QueryRow(`SELECT COUNT(*) FROM lawsuits WHERE status NOT IN ('won','lost')`).Scan(&s.ActiveLawsuits)
	db.QueryRow(`SELECT COUNT(*) FROM incidents`).Scan(&s.TotalIncidents)
	c.JSON(http.StatusOK, s)
}

func getDistricts(c *gin.Context) {
	state := c.Query("state")
	query := `SELECT id, state, district, old_rep, new_rep, black_pct, change_type, status, details, affected_voters, created_at FROM districts`
	args := []interface{}{}
	if state != "" {
		query += ` WHERE state = $1`
		args = append(args, state)
	}
	query += ` ORDER BY created_at DESC`
	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var districts []District
	for rows.Next() {
		var d District
		rows.Scan(&d.ID, &d.State, &d.District, &d.OldRep, &d.NewRep, &d.BlackPct, &d.ChangeType, &d.Status, &d.Details, &d.AffectedVoters, &d.CreatedAt)
		districts = append(districts, d)
	}
	c.JSON(http.StatusOK, districts)
}

func getDistrict(c *gin.Context) {
	var d District
	err := db.QueryRow(`SELECT id, state, district, old_rep, new_rep, black_pct, change_type, status, details, affected_voters, created_at FROM districts WHERE id = $1`, c.Param("id")).
		Scan(&d.ID, &d.State, &d.District, &d.OldRep, &d.NewRep, &d.BlackPct, &d.ChangeType, &d.Status, &d.Details, &d.AffectedVoters, &d.CreatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, d)
}

func getLawsuits(c *gin.Context) {
	state := c.Query("state")
	query := `SELECT id, title, state, plaintiff, defendant, status, court, filed_date::text, summary, action_url FROM lawsuits`
	args := []interface{}{}
	if state != "" {
		query += ` WHERE state = $1`
		args = append(args, state)
	}
	query += ` ORDER BY filed_date DESC`
	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var lawsuits []Lawsuit
	for rows.Next() {
		var l Lawsuit
		rows.Scan(&l.ID, &l.Title, &l.State, &l.Plaintiff, &l.Defendant, &l.Status, &l.Court, &l.FiledDate, &l.Summary, &l.ActionURL)
		lawsuits = append(lawsuits, l)
	}
	c.JSON(http.StatusOK, lawsuits)
}

func getIncidents(c *gin.Context) {
	rows, err := db.Query(`SELECT id, state, city, incident_type, description, verified, created_at FROM incidents ORDER BY created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var incidents []Incident
	for rows.Next() {
		var i Incident
		rows.Scan(&i.ID, &i.State, &i.City, &i.IncidentType, &i.Description, &i.Verified, &i.CreatedAt)
		incidents = append(incidents, i)
	}
	c.JSON(http.StatusOK, incidents)
}

func reportIncident(c *gin.Context) {
	var input ReportInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var id int
	err := db.QueryRow(
		`INSERT INTO incidents (state, city, incident_type, description) VALUES ($1,$2,$3,$4) RETURNING id`,
		input.State, input.City, input.IncidentType, input.Description,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Incident reported. Thank you for fighting back."})
}

func getActions(c *gin.Context) {
	rows, err := db.Query(`SELECT id, title, description, action_url, action_type, urgency, COALESCE(state,'') FROM actions ORDER BY CASE urgency WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, id`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var actions []Action
	for rows.Next() {
		var a Action
		rows.Scan(&a.ID, &a.Title, &a.Description, &a.ActionURL, &a.ActionType, &a.Urgency, &a.State)
		actions = append(actions, a)
	}
	c.JSON(http.StatusOK, actions)
}
