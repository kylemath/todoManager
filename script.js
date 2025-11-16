// Modern Todo Manager JavaScript
class TodoManager {
    constructor() {
        this.todos = [];
        this.currentEditId = null;
        this.filters = {
            priority: 'all',
            status: 'all',
            group: 'all'
        };
        this.apiUrl = window.location.origin + '/api';
        
        this.init();
        this.loadTodos();
        this.bindEvents();
    }

    init() {
        this.modal = document.getElementById('todo-modal');
        this.todoForm = document.getElementById('todo-form');
        this.addTodoBtn = document.getElementById('add-todo-btn');
        this.closeModalBtn = document.getElementById('close-modal');
        this.cancelBtn = document.getElementById('cancel-btn');
        
        // Filter elements
        this.priorityFilter = document.getElementById('priority-filter');
        this.statusFilter = document.getElementById('status-filter');
        this.groupFilter = document.getElementById('group-filter');
        
        // Todo lists
        this.highPriorityList = document.getElementById('high-priority-list');
        this.mediumPriorityList = document.getElementById('medium-priority-list');
        this.lowPriorityList = document.getElementById('low-priority-list');
        
        // Stats elements
        this.totalTodosEl = document.getElementById('total-todos');
        this.pendingTodosEl = document.getElementById('pending-todos');
        this.completedTodosEl = document.getElementById('completed-todos');
        this.completionRateEl = document.getElementById('completion-rate');
    }

    bindEvents() {
        this.addTodoBtn.addEventListener('click', () => this.openModal());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.todoForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Filter events
        this.priorityFilter.addEventListener('change', () => this.updateFilters());
        this.statusFilter.addEventListener('change', () => this.updateFilters());
        this.groupFilter.addEventListener('change', () => this.updateFilters());
        
        // Close modal on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
            if (e.key === 'n' && e.ctrlKey) {
                e.preventDefault();
                this.openModal();
            }
        });
    }

    async initializeSampleTodos() {
        const sampleTodos = [
            { title: "Complete project documentation", group: "research", priority: "high", description: "Write comprehensive documentation for the project" },
            { title: "Review code changes", group: "administration", priority: "high", description: "Review and approve pending code changes" },
            { title: "Prepare presentation slides", group: "academic", priority: "high", description: "Create slides for upcoming presentation" },
            { title: "Schedule team meeting", group: "personal", priority: "medium", description: "Coordinate meeting time with team members" },
            { title: "Update project timeline", group: "personal", priority: "medium", description: "Review and update project milestones" },
            { title: "Follow up on email", group: "personal", priority: "medium", description: "Respond to pending email inquiries" },
            { title: "Test new features", group: "research", priority: "low", description: "Perform thorough testing of new functionality" },
            { title: "Code review for pull request", group: "research", priority: "medium", description: "Review submitted pull request" },
            { title: "Update dependencies", group: "research", priority: "medium", description: "Check and update project dependencies" },
            { title: "Write unit tests", group: "research", priority: "high", description: "Add unit tests for new features" },
            { title: "Refactor legacy code", group: "research", priority: "high", description: "Improve code structure and maintainability" },
            { title: "Research best practices", group: "research", priority: "high", description: "Investigate industry best practices" },
            { title: "Mentor junior developer", group: "academic", priority: "medium", description: "Provide guidance and support" },
            { title: "Prepare training materials", group: "academic", priority: "medium", description: "Create educational content" },
            { title: "Review student submissions", group: "academic", priority: "medium", description: "Evaluate and provide feedback" },
            { title: "Attend committee meeting", group: "administration", priority: "low", description: "Participate in scheduled meeting" },
            { title: "Submit required reports", group: "administration", priority: "low", description: "Complete and submit documentation" },
            { title: "Annual review preparation", group: "administration", priority: "high", description: "Prepare materials for annual review" },
            { title: "Submit grant application", group: "administration", priority: "high", description: "Complete and submit grant proposal", dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
            { title: "Organize workspace", group: "renovation", priority: "low", description: "Clean and organize work area" },
            { title: "Update office setup", group: "renovation", priority: "low", description: "Improve office environment" },
            { title: "Install new equipment", group: "renovation", priority: "low", description: "Set up new office equipment" },
            { title: "Plan room improvements", group: "renovation", priority: "medium", description: "Design and plan room updates" },
            { title: "Reorganize storage", group: "renovation", priority: "low", description: "Optimize storage space organization" },
            { title: "Install storage solutions", group: "renovation", priority: "low", description: "Set up new storage system" }
        ];

        try {
            // Prepare todos for bulk insert
            const todosToInsert = sampleTodos.map(todo => ({
                ...todo,
                status: 'pending',
                createdAt: new Date().toISOString(),
                id: this.generateId()
            }));
            
            const response = await fetch(`${this.apiUrl}/todos/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ todos: todosToInsert })
            });
            
            if (response.ok) {
                this.todos = todosToInsert;
                this.renderTodos();
                this.updateStats();
            }
        } catch (error) {
            console.error('Error initializing sample todos:', error);
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    openModal(todo = null) {
        this.currentEditId = todo ? todo.id : null;
        const modalTitle = document.getElementById('modal-title');
        
        if (todo) {
            modalTitle.textContent = 'Edit Todo';
            this.populateForm(todo);
        } else {
            modalTitle.textContent = 'Add New Todo';
            this.todoForm.reset();
        }
        
        this.modal.classList.add('active');
        document.getElementById('todo-title').focus();
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.currentEditId = null;
        this.todoForm.reset();
    }

    populateForm(todo) {
        document.getElementById('todo-title').value = todo.title;
        document.getElementById('todo-description').value = todo.description || '';
        document.getElementById('todo-priority').value = todo.priority;
        document.getElementById('todo-group').value = todo.group;
        document.getElementById('todo-due-date').value = todo.dueDate || '';
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('todo-title').value.trim(),
            description: document.getElementById('todo-description').value.trim(),
            priority: document.getElementById('todo-priority').value,
            group: document.getElementById('todo-group').value,
            dueDate: document.getElementById('todo-due-date').value
        };

        if (!formData.title) {
            alert('Please enter a title for the todo');
            return;
        }

        if (this.currentEditId) {
            this.updateTodo(this.currentEditId, formData);
        } else {
            const newTodo = {
                ...formData,
                id: this.generateId(),
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            this.addTodo(newTodo);
        }

        this.closeModal();
    }

    async addTodo(todo) {
        try {
            const response = await fetch(`${this.apiUrl}/todos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todo)
            });
            
            if (!response.ok) {
                throw new Error('Failed to create todo');
            }
            
            this.todos.push(todo);
            this.renderTodos();
            this.updateStats();
        } catch (error) {
            console.error('Server unavailable, saving to localStorage:', error);
            // Fallback to localStorage
            this.todos.push(todo);
            this.saveToLocalStorage();
            this.renderTodos();
            this.updateStats();
        }
    }

    async updateTodo(id, updates) {
        try {
            const response = await fetch(`${this.apiUrl}/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update todo');
            }
            
            const todoIndex = this.todos.findIndex(t => t.id === id);
            if (todoIndex !== -1) {
                this.todos[todoIndex] = { ...this.todos[todoIndex], ...updates };
                this.renderTodos();
                this.updateStats();
            }
        } catch (error) {
            console.error('Server unavailable, updating localStorage:', error);
            // Fallback to localStorage
            const todoIndex = this.todos.findIndex(t => t.id === id);
            if (todoIndex !== -1) {
                this.todos[todoIndex] = { ...this.todos[todoIndex], ...updates };
                this.saveToLocalStorage();
                this.renderTodos();
                this.updateStats();
            }
        }
    }

    async deleteTodo(id) {
        if (confirm('Are you sure you want to delete this todo?')) {
            try {
                const response = await fetch(`${this.apiUrl}/todos/${id}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to delete todo');
                }
                
                this.todos = this.todos.filter(t => t.id !== id);
                this.renderTodos();
                this.updateStats();
            } catch (error) {
                console.error('Server unavailable, deleting from localStorage:', error);
                // Fallback to localStorage
                this.todos = this.todos.filter(t => t.id !== id);
                this.saveToLocalStorage();
                this.renderTodos();
                this.updateStats();
            }
        }
    }

    async toggleTodoStatus(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
            const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;
            
            await this.updateTodo(id, { 
                status: newStatus, 
                completedAt: completedAt 
            });
        }
    }

    updateFilters() {
        this.filters = {
            priority: this.priorityFilter.value,
            status: this.statusFilter.value,
            group: this.groupFilter.value
        };
        this.renderTodos();
    }

    getFilteredTodos() {
        return this.todos.filter(todo => {
            const priorityMatch = this.filters.priority === 'all' || todo.priority === this.filters.priority;
            const statusMatch = this.filters.status === 'all' || todo.status === this.filters.status;
            const groupMatch = this.filters.group === 'all' || todo.group === this.filters.group;
            
            return priorityMatch && statusMatch && groupMatch;
        });
    }

    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        // Clear all lists
        this.highPriorityList.innerHTML = '';
        this.mediumPriorityList.innerHTML = '';
        this.lowPriorityList.innerHTML = '';

        // Group todos by priority
        const todosByPriority = {
            high: filteredTodos.filter(t => t.priority === 'high'),
            medium: filteredTodos.filter(t => t.priority === 'medium'),
            low: filteredTodos.filter(t => t.priority === 'low')
        };

        // Render todos in each priority group
        Object.entries(todosByPriority).forEach(([priority, todos]) => {
            const listElement = document.getElementById(`${priority}-priority-list`);
            
            if (todos.length === 0) {
                listElement.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No ${priority} priority todos</h3>
                        <p>Add a new todo to get started</p>
                    </div>
                `;
            } else {
                todos.forEach(todo => {
                    const todoElement = this.createTodoElement(todo);
                    listElement.appendChild(todoElement);
                });
            }
        });
    }

    createTodoElement(todo) {
        const todoDiv = document.createElement('div');
        todoDiv.className = `todo-item ${todo.status}`;
        todoDiv.setAttribute('data-priority', todo.priority);
        todoDiv.setAttribute('data-id', todo.id);
        todoDiv.setAttribute('draggable', 'true');

        const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
        const today = new Date();
        const isOverdue = dueDate && dueDate < today && todo.status !== 'completed';

        todoDiv.innerHTML = `
            <div class="todo-content">
                <div class="todo-title">${this.escapeHtml(todo.title)}</div>
                <div class="todo-actions">
                    <button onclick="todoManager.toggleTodoStatus('${todo.id}')" title="${todo.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}">
                        ${todo.status === 'completed' ? '↶' : '✓'}
                    </button>
                    <button onclick="todoManager.openModal(todoManager.getTodo('${todo.id}'))" title="Edit">
                        ⋯
                    </button>
                </div>
            </div>
            ${todo.dueDate && isOverdue ? `<div class="todo-due">Due: ${this.formatDate(todo.dueDate)}</div>` : ''}
        `;

        return todoDiv;
    }

    getTodo(id) {
        return this.todos.find(t => t.id === id);
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.status === 'completed').length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        this.totalTodosEl.textContent = total;
        this.pendingTodosEl.textContent = pending;
        this.completedTodosEl.textContent = completed;
        this.completionRateEl.textContent = `${completionRate}%`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadTodos() {
        try {
            const response = await fetch(`${this.apiUrl}/todos`);
            
            if (!response.ok) {
                throw new Error('Failed to load todos');
            }
            
            this.todos = await response.json();
            
            // If no todos exist, initialize with sample data
            if (this.todos.length === 0) {
                await this.initializeSampleTodos();
            }
            
            this.renderTodos();
            this.updateStats();
        } catch (error) {
            console.error('Server not available, falling back to localStorage:', error);
            // Fallback to localStorage if server is not available
            this.loadFromLocalStorage();
            if (this.todos.length === 0) {
                this.initializeSampleTodosLocal();
            }
        }
    }

    // Fallback localStorage methods
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('todoManager_todos');
            if (saved) {
                this.todos = JSON.parse(saved);
                this.renderTodos();
                this.updateStats();
            }
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            this.todos = [];
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('todoManager_todos', JSON.stringify(this.todos));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    initializeSampleTodosLocal() {
        const sampleTodos = [
            { title: "Complete project documentation", group: "research", priority: "high", description: "Write comprehensive documentation for the project" },
            { title: "Review code changes", group: "administration", priority: "high", description: "Review and approve pending code changes" },
            { title: "Prepare presentation slides", group: "academic", priority: "high", description: "Create slides for upcoming presentation" },
            { title: "Schedule team meeting", group: "personal", priority: "medium", description: "Coordinate meeting time with team members" },
            { title: "Update project timeline", group: "personal", priority: "medium", description: "Review and update project milestones" },
            { title: "Follow up on email", group: "personal", priority: "medium", description: "Respond to pending email inquiries" },
            { title: "Test new features", group: "research", priority: "low", description: "Perform thorough testing of new functionality" },
            { title: "Code review for pull request", group: "research", priority: "medium", description: "Review submitted pull request" },
            { title: "Update dependencies", group: "research", priority: "medium", description: "Check and update project dependencies" },
            { title: "Write unit tests", group: "research", priority: "high", description: "Add unit tests for new features" },
            { title: "Refactor legacy code", group: "research", priority: "high", description: "Improve code structure and maintainability" },
            { title: "Research best practices", group: "research", priority: "high", description: "Investigate industry best practices" },
            { title: "Mentor junior developer", group: "academic", priority: "medium", description: "Provide guidance and support" },
            { title: "Prepare training materials", group: "academic", priority: "medium", description: "Create educational content" },
            { title: "Review student submissions", group: "academic", priority: "medium", description: "Evaluate and provide feedback" },
            { title: "Attend committee meeting", group: "administration", priority: "low", description: "Participate in scheduled meeting" },
            { title: "Submit required reports", group: "administration", priority: "low", description: "Complete and submit documentation" },
            { title: "Annual review preparation", group: "administration", priority: "high", description: "Prepare materials for annual review" },
            { title: "Submit grant application", group: "administration", priority: "high", description: "Complete and submit grant proposal", dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
            { title: "Organize workspace", group: "renovation", priority: "low", description: "Clean and organize work area" },
            { title: "Update office setup", group: "renovation", priority: "low", description: "Improve office environment" },
            { title: "Install new equipment", group: "renovation", priority: "low", description: "Set up new office equipment" },
            { title: "Plan room improvements", group: "renovation", priority: "medium", description: "Design and plan room updates" },
            { title: "Reorganize storage", group: "renovation", priority: "low", description: "Optimize storage space organization" },
            { title: "Install storage solutions", group: "renovation", priority: "low", description: "Set up new storage system" }
        ];

        sampleTodos.forEach(todo => {
            this.todos.push({
                ...todo,
                status: 'pending',
                createdAt: new Date().toISOString(),
                id: this.generateId()
            });
        });
        
        this.saveToLocalStorage();
        this.renderTodos();
        this.updateStats();
    }

    // Drag and drop functionality
    initDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('todo-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('todo-item')) {
                e.target.classList.remove('dragging');
            }
            // Clear all drag-over states
            document.querySelectorAll('.todo-list').forEach(list => {
                list.classList.remove('drag-over');
            });
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const todoList = e.target.closest('.todo-list');
            if (todoList) {
                // Clear other drag-over states
                document.querySelectorAll('.todo-list').forEach(list => {
                    list.classList.remove('drag-over');
                });
                todoList.classList.add('drag-over');
            }
        });

        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const todoList = e.target.closest('.todo-list');
            if (todoList) {
                todoList.classList.remove('drag-over');
                const todoId = e.dataTransfer.getData('text/plain');
                const newPriority = todoList.id.replace('-priority-list', '');
                
                const todo = this.getTodo(todoId);
                if (todo && todo.priority !== newPriority) {
                    this.updateTodo(todoId, { priority: newPriority });
                }
            }
        });
    }

    // Export/Import functionality
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `todos_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    importTodos(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTodos = JSON.parse(e.target.result);
                if (Array.isArray(importedTodos)) {
                    if (confirm('This will replace all existing todos. Are you sure?')) {
                        this.todos = importedTodos;
                        this.saveToStorage();
                        this.renderTodos();
                        this.updateStats();
                    }
                }
            } catch (error) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the todo manager when the page loads
let todoManager;
document.addEventListener('DOMContentLoaded', () => {
    todoManager = new TodoManager();
    todoManager.initDragAndDrop();
});

