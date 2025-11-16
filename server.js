const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database setup
const dbPath = path.join(__dirname, 'todos.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        group_name TEXT DEFAULT 'personal',
        status TEXT DEFAULT 'pending',
        due_date TEXT,
        created_at TEXT,
        completed_at TEXT
    )`);
});

// API Routes

// Get all todos
app.get('/api/todos', (req, res) => {
    db.all('SELECT * FROM todos ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Error fetching todos:', err);
            return res.status(500).json({ error: 'Failed to fetch todos' });
        }
        
        // Convert database rows to frontend format
        const todos = rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            priority: row.priority,
            group: row.group_name,
            status: row.status,
            dueDate: row.due_date,
            createdAt: row.created_at,
            completedAt: row.completed_at
        }));
        
        res.json(todos);
    });
});

// Create new todo
app.post('/api/todos', (req, res) => {
    const { id, title, description, priority, group, status, dueDate, createdAt } = req.body;
    
    if (!title || !id) {
        return res.status(400).json({ error: 'Title and ID are required' });
    }
    
    const stmt = db.prepare(`INSERT INTO todos 
        (id, title, description, priority, group_name, status, due_date, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    
    stmt.run([
        id,
        title,
        description || null,
        priority || 'medium',
        group || 'personal',
        status || 'pending',
        dueDate || null,
        createdAt || new Date().toISOString()
    ], function(err) {
        if (err) {
            console.error('Error creating todo:', err);
            return res.status(500).json({ error: 'Failed to create todo' });
        }
        
        res.status(201).json({ 
            message: 'Todo created successfully',
            id: id
        });
    });
    
    stmt.finalize();
});

// Update todo
app.put('/api/todos/:id', (req, res) => {
    const todoId = req.params.id;
    const { title, description, priority, group, status, dueDate, completedAt } = req.body;
    
    const stmt = db.prepare(`UPDATE todos SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        group_name = COALESCE(?, group_name),
        status = COALESCE(?, status),
        due_date = COALESCE(?, due_date),
        completed_at = COALESCE(?, completed_at)
        WHERE id = ?`);
    
    stmt.run([
        title,
        description,
        priority,
        group,
        status,
        dueDate,
        completedAt,
        todoId
    ], function(err) {
        if (err) {
            console.error('Error updating todo:', err);
            return res.status(500).json({ error: 'Failed to update todo' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        res.json({ message: 'Todo updated successfully' });
    });
    
    stmt.finalize();
});

// Delete todo
app.delete('/api/todos/:id', (req, res) => {
    const todoId = req.params.id;
    
    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    
    stmt.run([todoId], function(err) {
        if (err) {
            console.error('Error deleting todo:', err);
            return res.status(500).json({ error: 'Failed to delete todo' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        
        res.json({ message: 'Todo deleted successfully' });
    });
    
    stmt.finalize();
});

// Bulk operations for initial data seeding
app.post('/api/todos/bulk', (req, res) => {
    const { todos } = req.body;
    
    if (!Array.isArray(todos)) {
        return res.status(400).json({ error: 'Todos must be an array' });
    }
    
    db.serialize(() => {
        const stmt = db.prepare(`INSERT OR REPLACE INTO todos 
            (id, title, description, priority, group_name, status, due_date, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        
        todos.forEach(todo => {
            stmt.run([
                todo.id,
                todo.title,
                todo.description || null,
                todo.priority || 'medium',
                todo.group || 'personal',
                todo.status || 'pending',
                todo.dueDate || null,
                todo.createdAt || new Date().toISOString()
            ]);
        });
        
        stmt.finalize((err) => {
            if (err) {
                console.error('Error bulk inserting todos:', err);
                return res.status(500).json({ error: 'Failed to bulk insert todos' });
            }
            
            res.json({ 
                message: `Successfully inserted/updated ${todos.length} todos`
            });
        });
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Todo server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});


