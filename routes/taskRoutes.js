const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Create a new task
router.post("/", async (req, res) => {
  try {
    const { title, description } = req.body;
    const newTask = await pool.query(
      "INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *",
      [title, description]
    );
    res.json(newTask.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
    res.json(tasks.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single task
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (task.rows.length === 0) return res.status(404).json({ message: "Task not found" });
    res.json(task.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a task
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const updatedTask = await pool.query(
      "UPDATE tasks SET title = $1, description = $2, status = $3 WHERE id = $4 RETURNING *",
      [title, description, status, id]
    );
    res.json(updatedTask.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
