// Task management functionality
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let editTaskId = null;

// DOM elements
const addTaskBtn = document.getElementById('add-task-btn');
const newTaskBtn = document.getElementById('new-task-btn');
const modal = document.getElementById('taskModal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('task-search');
const filterItems = document.querySelectorAll('.filter-item');

// Initialize the app
function initApp() {
    // Render tasks and update stats
    renderTasks();
    updateStats();

    // Show/hide empty state
    toggleEmptyState();

    // Set up event listeners
    setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
    // Event listeners for opening modal
    [addTaskBtn, newTaskBtn].forEach(btn => {
        btn.addEventListener('click', openModal);
    });


    // Event listeners for closing modal
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Form submission
    taskForm.addEventListener('submit', saveTask);

    // Search functionality
    searchInput.addEventListener('input', handleSearch);

    // Filter functionality
    filterItems.forEach(item => {
        item.addEventListener('click', handleFilter);
    });
}

function openModal(e) {
    // Reset the form
    taskForm.reset();
    document.getElementById('edit-id').value = '';

    // Set modal title and button text
    document.getElementById('modal-title').textContent = 'Add New Task';
    document.getElementById('save-task-btn').textContent = 'Add Task';

    // Show the modal
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    editTaskId = null;
}

function saveTask(e) {
    e.preventDefault();

    const taskId = document.getElementById('edit-id').value;
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value;

    if (taskId) {
        // Update existing task
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = {
                ...tasks[taskIndex],
                title,
                description,
                dueDate,
                priority,
                category
            };
        }
    } else {
        // Add new task
        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            dueDate,
            priority,
            category,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
    }

    // Save to localStorage
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // Update UI
    renderTasks();
    updateStats();
    toggleEmptyState();

    // Close modal
    closeModal();
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        // Find the task element
        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);

        if (taskElement) {
            // Add fade-out animation
            taskElement.classList.add('fade-out');

            // Remove from array after animation completes
            setTimeout(() => {
                tasks = tasks.filter(task => task.id !== taskId);
                localStorage.setItem('tasks', JSON.stringify(tasks));

                // Update UI
                renderTasks();
                updateStats();
                toggleEmptyState();
            }, 300);
        }
    }
}

function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Update UI
        renderTasks();
        updateStats();
    }
}

function renderTasks() {
    // Clear the task list
    taskList.innerHTML = '';

    // Show empty state if no tasks
    if (tasks.length === 0) {
        taskList.appendChild(emptyState.cloneNode(true));
        return;
    }

    // Filter tasks based on current filter and search term
    const filteredTasks = filterTasks(currentFilter, searchInput.value);

    if (filteredTasks.length === 0) {
        // Show no results message
        const noResults = document.createElement('div');
        noResults.className = 'empty-state';
        noResults.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h3>No tasks found</h3>
                    <p>Try changing your search or filter criteria</p>
                `;
        taskList.appendChild(noResults);
        return;
    }

    // Render each task
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`;
    taskElement.dataset.id = task.id;

    // Format date if exists
    let formattedDate = '';
    if (task.dueDate) {
        const date = new Date(task.dueDate);
        formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    taskElement.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                    <i class="fas fa-check"></i>
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-desc">${task.description || ''}</div>
                    <div class="task-meta">
                        ${formattedDate ? `<div class="fas fa-calendar">📅${formattedDate}</div>` : ''}
                        <div><i class="fas fa-tag"></i> ${task.category}</div>
                    </div>
                </div>
                <div class="task-priority priority-${task.priority}">${task.priority}</div>
                <div class="task-actions">
                    <button class="edit-btn"style='font-size: 25px;'>🛠</button>
                    <button class="delete-btn" style='font-size: 25px;'>🗑</button>
                </div>
            `;

    // Add event listeners to the buttons
    const checkbox = taskElement.querySelector('.task-checkbox');
    const editBtn = taskElement.querySelector('.edit-btn');
    const deleteBtn = taskElement.querySelector('.delete-btn');

    checkbox.addEventListener('click', () => toggleTaskComplete(task.id));
    editBtn.addEventListener('click', () => editTask(task.id));
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    return taskElement;
}

function editTask(taskId) {
    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Set modal to edit mode
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('save-task-btn').textContent = 'Save Changes';

    // Populate the form
    document.getElementById('edit-id').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskDueDate').value = task.dueDate || '';
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskCategory').value = task.category || 'work';

    // Show the modal
    modal.style.display = 'flex';
}

function filterTasks(filter, searchTerm = '') {
    let filteredTasks = tasks;

    // Apply filter
    switch (filter) {
        case 'completed':
            filteredTasks = tasks.filter(task => task.completed);
            break;
        case 'important':
            filteredTasks = tasks.filter(task => task.priority === 'high');
            break;
        case 'today':
            const today = new Date().toDateString();
            filteredTasks = tasks.filter(task => {
                if (!task.dueDate) return false;
                return new Date(task.dueDate).toDateString() === today;
            });
            break;
        case 'week':
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
            filteredTasks = tasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate <= oneWeekFromNow && dueDate >= new Date();
            });
            break;
        default:
            // 'all' - no filter
            break;
    }

    // Apply search
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(term) ||
            (task.description && task.description.toLowerCase().includes(term))
        );
    }

    return filteredTasks;
}

function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const inProgressTasks = totalTasks - completedTasks;

    // Calculate due soon tasks (within next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const dueSoonTasks = tasks.filter(task => {
        if (!task.dueDate || task.completed) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate <= threeDaysFromNow && dueDate >= new Date();
    }).length;

    // Update DOM
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('inprogress-tasks').textContent = inProgressTasks;
    document.getElementById('due-tasks').textContent = dueSoonTasks;
}

function toggleEmptyState() {
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
}

function handleSearch() {
    renderTasks();
}

function handleFilter(e) {
    // Remove active class from all filters
    filterItems.forEach(item => item.classList.remove('active'));

    // Add active class to clicked filter
    this.classList.add('active');

    // Apply the filter
    currentFilter = this.dataset.filter;
    renderTasks();
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);