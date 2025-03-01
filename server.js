require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "https://yourfrontend.com", methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Database connection error:", err));

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("newTask", (task) => {
    io.emit("newTask", task);
  });

  socket.on("updateTask", (task) => {
    io.emit("updateTask", task);
  });

  socket.on("deleteTask", (taskId) => {
    io.emit("deleteTask", taskId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/api/tasks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await pool.query(
      "INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *",
      [title, description]
    );
    const newTask = result.rows[0];
    io.emit("newTask", newTask);
    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const result = await pool.query(
      "UPDATE tasks SET title = $1, description = $2 WHERE id = $3 RETURNING *",
      [title, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    const updatedTask = result.rows[0];
    io.emit("updateTask", updatedTask);
    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    io.emit("deleteTask", id);
    res.json({ message: "Task deleted successfully!" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));