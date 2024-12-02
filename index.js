const express = require("express");
const app = express();
const PORT = 3000;
const { Pool } = require("pg");

const pool = new Pool({
  user: "username",
  host: "localhost",
  database: "QAP3",
  password: "juicewrld",
  port: 5432,
});

// Function to get a table if it dont exist
const createTasksTable = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
          CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            description TEXT NOT NULL,
            status TEXT NOT NULL
          );
        `);
  } catch (err) {
    console.error("Error creating tasks table:", err);
  } finally {
    await client.release();
  }
};

app.use(express.json());

let tasks = [
  { id: 1, description: "Buy groceries", status: "incomplete" },
  { id: 2, description: "Read a book", status: "complete" },
];

// GET /tasks - Get all tasks
app.get("/tasks", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM tasks");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.release();
  }
});

// POST /tasks - Add a new task
app.post("/tasks", async (req, res) => {
  const { description, status } = req.body;
  if (!description || !status) {
    return res
      .status(400)
      .json({ error: "All fields (description, status) are required" });
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      "INSERT INTO tasks (description, status) VALUES ($1, $2) RETURNING *",
      [description, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding task:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.release();
  }
});

// PUT /tasks/:id - Update a task's status
app.put("/tasks/:id", async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const { status } = req.body;

  const client = await pool.connect();
  try {
    const result = await client.query(
      "UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *",
      [status, taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task updated successfully", task: result.rows[0] });
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.release();
  }
});

// DELETE /tasks/:id - Delete a task
app.delete("/tasks/:id", async (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  const client = await pool.connect();
  try {
    const result = await client.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.release();
  }
});

app.listen(PORT, async () => {
  await createTasksTable();
  console.log(`Server is running on http://localhost:${PORT}`);
});
