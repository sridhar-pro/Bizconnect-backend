require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Get all tasks
app.get("/api/tasks", async (req, res) => {
  const result = await pool.query("SELECT * FROM tasks");
  res.json(result.rows);
});

// Get a single task
app.get("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  res.json(result.rows[0]);
});

// Create a new task
app.post("/api/tasks", async (req, res) => {
  const { title, description } = req.body;
  await pool.query("INSERT INTO tasks (title, description) VALUES ($1, $2)", [title, description]);
  res.json({ message: "Task created successfully!" });
});

// Update a task
app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  await pool.query("UPDATE tasks SET title = $1, description = $2 WHERE id = $3", [title, description, id]);
  res.json({ message: "Task updated successfully!" });
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  res.json({ message: "Task deleted successfully!" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
