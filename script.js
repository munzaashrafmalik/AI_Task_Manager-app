// ===== AI Task Manager Pro - JavaScript =====

// ===== State Management =====
const state = {
    tasks: [],
    categories: [
        { id: 'personal', name: 'Personal', color: '#667eea' },
        { id: 'work', name: 'Work', color: '#f093fb' },
        { id: 'urgent', name: 'Urgent', color: '#fa709a' },
        { id: 'shopping', name: 'Shopping', color: '#43e97b' },
        { id: 'health', name: 'Health', color: '#4facfe' },
        { id: 'finance', name: 'Finance', color: '#fee140' }
    ],
    currentView: 'dashboard',
    currentFilter: {
        category: null,
        priority: 'all'
    },
    aiSettings: {
        apiKey: '',
        autoSuggest: true,
        autoCategorize: true
    },
    editingTaskId: null,
    selectedTaskId: null
};

// ===== DOM Elements =====
const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    menuToggle: document.getElementById('menuToggle'),
    navItems: document.querySelectorAll('.nav-item'),
    categoriesList: document.getElementById('categoriesList'),
    addCategoryBtn: document.getElementById('addCategoryBtn'),
    priorityFilters: document.querySelectorAll('.priority-filter'),
    themeToggle: document.getElementById('themeToggle'),
    aiSettingsBtn: document.getElementById('aiSettingsBtn'),
    searchInput: document.getElementById('searchInput'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    pendingTasksCount: document.getElementById('pendingTasksCount'),
    views: {
        dashboard: document.getElementById('dashboardView'),
        tasks: document.getElementById('tasksView'),
        today: document.getElementById('todayView'),
        upcoming: document.getElementById('upcomingView'),
        completed: document.getElementById('completedView')
    },
    taskLists: {
        today: document.getElementById('todayTasksList'),
        all: document.getElementById('allTasksList'),
        todayView: document.getElementById('todayViewList'),
        upcoming: document.getElementById('upcomingViewList'),
        completed: document.getElementById('completedViewList')
    },
    modals: {
        task: document.getElementById('taskModal'),
        aiSettings: document.getElementById('aiSettingsModal'),
        category: document.getElementById('categoryModal'),
        taskDetails: document.getElementById('taskDetailsModal')
    },
    forms: {
        task: document.getElementById('taskForm'),
        aiSettings: document.getElementById('aiSettingsForm'),
        category: document.getElementById('categoryForm')
    },
    dashboard: {
        greeting: document.getElementById('greeting'),
        date: document.getElementById('currentDate'),
        stats: {
            total: document.getElementById('totalTasks'),
            pending: document.getElementById('pendingTasks'),
            completed: document.getElementById('completedTasks'),
            overdue: document.getElementById('overdueTasks')
        },
        progress: {
            fill: document.getElementById('progressFill'),
            rate: document.getElementById('completionRate'),
            weekCompleted: document.getElementById('weekCompleted'),
            weekTotal: document.getElementById('weekTotal')
        },
        aiSuggestions: document.getElementById('aiSuggestionsList'),
        refreshAiBtn: document.getElementById('refreshAiBtn')
    }
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    initializeEventListeners();
    updateDashboard();
    renderAllViews();
    updateGreeting();
});

// ===== Event Listeners =====
function initializeEventListeners() {
    // Sidebar toggle
    elements.sidebarToggle?.addEventListener('click', toggleSidebar);
    elements.menuToggle?.addEventListener('click', toggleSidebar);

    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // Category
    elements.addCategoryBtn?.addEventListener('click', () => openModal('category'));

    // Priority filters
    elements.priorityFilters.forEach(filter => {
        filter.addEventListener('click', () => setPriorityFilter(filter.dataset.priority));
    });

    // Theme toggle
    elements.themeToggle?.addEventListener('click', toggleTheme);

    // AI Settings
    elements.aiSettingsBtn?.addEventListener('click', () => openModal('aiSettings'));

    // Search
    elements.searchInput?.addEventListener('input', handleSearch);

    // Add task button
    elements.addTaskBtn?.addEventListener('click', () => openTaskModal());

    // Modal closes
    setupModalListeners();

    // Forms
    elements.forms.task?.addEventListener('submit', handleTaskSubmit);
    elements.forms.aiSettings?.addEventListener('submit', handleAiSettingsSubmit);
    elements.forms.category?.addEventListener('submit', handleCategorySubmit);

    // AI refresh
    elements.dashboard.refreshAiBtn?.addEventListener('click', generateAiSuggestions);

    // Color presets
    document.querySelectorAll('.color-preset').forEach(preset => {
        preset.addEventListener('click', () => selectColorPreset(preset));
    });

    // Subtask
    document.getElementById('addSubtaskBtn')?.addEventListener('click', addSubtaskField);

    // Task details actions
    document.getElementById('editTaskBtn')?.addEventListener('click', editSelectedTask);
    document.getElementById('deleteTaskBtn')?.addEventListener('click', deleteSelectedTask);

    // View all buttons
    document.querySelectorAll('.view-all-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Sort
    document.getElementById('sortBy')?.addEventListener('change', handleSort);
}

function setupModalListeners() {
    Object.values(elements.modals).forEach(modal => {
        if (!modal) return;
        
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        const cancelBtn = modal.querySelector('.btn-cancel, #cancelBtn, #categoryCancel, #aiSettingsCancel');

        closeBtn?.addEventListener('click', () => closeModal(modal.id));
        overlay?.addEventListener('click', () => closeModal(modal.id));
        cancelBtn?.addEventListener('click', () => closeModal(modal.id));
    });
}

// ===== Storage Functions =====
function loadFromStorage() {
    const savedTasks = localStorage.getItem('aiTasks');
    const savedCategories = localStorage.getItem('aiCategories');
    const savedAiSettings = localStorage.getItem('aiAiSettings');
    const savedTheme = localStorage.getItem('aiTheme');

    if (savedTasks) state.tasks = JSON.parse(savedTasks);
    if (savedCategories) state.categories = JSON.parse(savedCategories);
    if (savedAiSettings) state.aiSettings = JSON.parse(savedAiSettings);
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }
}

function saveToStorage() {
    localStorage.setItem('aiTasks', JSON.stringify(state.tasks));
    localStorage.setItem('aiCategories', JSON.stringify(state.categories));
    localStorage.setItem('aiAiSettings', JSON.stringify(state.aiSettings));
}

// ===== View Management =====
function switchView(viewName) {
    state.currentView = viewName;

    // Update nav items
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update views
    Object.values(elements.views).forEach(view => view?.classList.remove('active'));
    elements.views[viewName]?.classList.add('active');

    // Clear filters
    state.currentFilter.category = null;
    state.currentFilter.priority = 'all';
    elements.priorityFilters.forEach(f => f.classList.toggle('active', f.dataset.priority === 'all'));

    renderView(viewName);
}

function renderView(viewName) {
    switch(viewName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'tasks':
            renderAllTasks();
            break;
        case 'today':
            renderTodayTasks();
            break;
        case 'upcoming':
            renderUpcomingTasks();
            break;
        case 'completed':
            renderCompletedTasks();
            break;
    }
}

function renderAllViews() {
    renderCategories();
    renderAllTasks();
    renderTodayTasks();
    renderUpcomingTasks();
    renderCompletedTasks();
    updateDashboard();
}

// ===== Dashboard =====
function updateDashboard() {
    // Stats
    const total = state.tasks.length;
    const pending = state.tasks.filter(t => !t.completed).length;
    const completed = state.tasks.filter(t => t.completed).length;
    const overdue = state.tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length;

    elements.dashboard.stats.total.textContent = total;
    elements.dashboard.stats.pending.textContent = pending;
    elements.dashboard.stats.completed.textContent = completed;
    elements.dashboard.stats.overdue.textContent = overdue;
    elements.pendingTasksCount.textContent = pending;

    // Progress
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    elements.dashboard.progress.fill.style.width = `${completionRate}%`;
    elements.dashboard.progress.rate.textContent = `${completionRate}%`;

    // Weekly stats
    const weekTasks = getWeekTasks();
    elements.dashboard.progress.weekCompleted.textContent = weekTasks.completed;
    elements.dashboard.progress.weekTotal.textContent = weekTasks.total;

    // Today's tasks
    renderTodayTasksList();

    // AI Suggestions
    if (state.aiSettings.autoSuggest) {
        generateAiSuggestions();
    }
}

function getWeekTasks() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekTasks = state.tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= weekAgo;
    });

    return {
        total: weekTasks.length,
        completed: weekTasks.filter(t => t.completed).length
    };
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Evening! 🌙';
    
    if (hour < 12) greeting = 'Good Morning! ☀️';
    else if (hour < 17) greeting = 'Good Afternoon! 🌤️';
    
    elements.dashboard.greeting.textContent = greeting;
    
    // Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.dashboard.date.textContent = new Date().toLocaleDateString('en-US', options);
}

// ===== Task Rendering =====
function renderTodayTasksList() {
    const today = new Date().toDateString();
    const todayTasks = state.tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        return new Date(t.dueDate).toDateString() === today;
    }).slice(0, 5);

    const container = elements.taskLists.today;
    if (!container) return;

    if (todayTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sun"></i>
                <h3>No tasks for today</h3>
                <p>Enjoy your free time or add some tasks!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = todayTasks.map(task => createTaskCard(task)).join('');
    attachTaskCardListeners(container);
}

function renderAllTasks() {
    const container = elements.taskLists.all;
    if (!container) return;

    let filteredTasks = [...state.tasks];

    // Apply filters
    if (state.currentFilter.category) {
        filteredTasks = filteredTasks.filter(t => t.category === state.currentFilter.category);
    }
    if (state.currentFilter.priority !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.priority === state.currentFilter.priority);
    }

    // Search filter
    const searchTerm = elements.searchInput?.value.toLowerCase();
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(t => 
            t.title.toLowerCase().includes(searchTerm) ||
            t.description?.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No tasks found</h3>
                <p>Create your first task to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');
    attachTaskCardListeners(container);
}

function renderTodayTasks() {
    const container = elements.taskLists.todayView;
    if (!container) return;

    const today = new Date().toDateString();
    const todayTasks = state.tasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate).toDateString() === today;
    });

    if (todayTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-day"></i>
                <h3>No tasks for today</h3>
                <p>Enjoy your free time!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = todayTasks.map(task => createTaskCard(task)).join('');
    attachTaskCardListeners(container);
}

function renderUpcomingTasks() {
    const container = elements.taskLists.upcoming;
    if (!container) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTasks = state.tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate > today;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    if (upcomingTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-week"></i>
                <h3>No upcoming tasks</h3>
                <p>All clear ahead!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = upcomingTasks.map(task => createTaskCard(task)).join('');
    attachTaskCardListeners(container);
}

function renderCompletedTasks() {
    const container = elements.taskLists.completed;
    if (!container) return;

    const completedTasks = state.tasks.filter(t => t.completed);

    if (completedTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>No completed tasks yet</h3>
                <p>Complete some tasks to see them here!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = completedTasks.map(task => createTaskCard(task)).join('');
    attachTaskCardListeners(container);
}

function createTaskCard(task) {
    const category = state.categories.find(c => c.id === task.category);
    const isTaskOverdue = !task.completed && isOverdue(task.dueDate);
    
    return `
        <div class="task-card ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskComplete('${task.id}')">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    ${task.dueDate ? `
                        <span class="${isTaskOverdue ? 'overdue' : ''}">
                            <i class="fas fa-calendar"></i>
                            ${formatDate(task.dueDate)}
                        </span>
                    ` : ''}
                    ${task.dueTime ? `
                        <span>
                            <i class="fas fa-clock"></i>
                            ${task.dueTime}
                        </span>
                    ` : ''}
                    <span class="task-priority ${task.priority}">
                        ${task.priority}
                    </span>
                    ${category ? `
                        <span class="task-category">
                            <span class="category-badge" style="background: ${category.color}"></span>
                            ${category.name}
                        </span>
                    ` : ''}
                    ${task.subtasks?.length > 0 ? `
                        <span>
                            <i class="fas fa-list-check"></i>
                            ${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn" onclick="openTaskDetails('${task.id}')" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="task-action-btn" onclick="openTaskModal('${task.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn delete" onclick="deleteTask('${task.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function attachTaskCardListeners(container) {
    container.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.task-actions')) {
                const taskId = card.dataset.taskId;
                openTaskDetails(taskId);
            }
        });
    });
}

// ===== Task Operations =====
function toggleTaskComplete(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            task.completedAt = new Date().toISOString();
            showToast('Task completed! 🎉', 'success');
        }
        saveToStorage();
        renderAllViews();
    }
}

function openTaskModal(taskId = null) {
    state.editingTaskId = taskId;
    const modal = elements.modals.task;
    const title = document.getElementById('modalTitle');
    const form = elements.forms.task;

    form.reset();
    document.getElementById('taskId').value = '';
    document.getElementById('subtasksList').innerHTML = '';

    if (taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskCategory').value = task.category;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskDueDate').value = task.dueDate || '';
            document.getElementById('taskDueTime').value = task.dueTime || '';
            document.getElementById('taskRecurring').checked = task.recurring || false;

            // Subtasks
            if (task.subtasks?.length > 0) {
                task.subtasks.forEach(subtask => {
                    addSubtaskField(subtask.title, subtask.completed);
                });
            }
        }
    } else {
        title.textContent = 'Add New Task';
        // Set default due date to today
        document.getElementById('taskDueDate').value = new Date().toISOString().split('T')[0];
    }

    modal.classList.add('active');
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const category = document.getElementById('taskCategory').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const dueTime = document.getElementById('taskDueTime').value;
    const recurring = document.getElementById('taskRecurring').checked;

    // Get subtasks
    const subtasks = [];
    document.querySelectorAll('.subtask-item').forEach(item => {
        const input = item.querySelector('input');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (input?.value.trim()) {
            subtasks.push({
                id: generateId(),
                title: input.value.trim(),
                completed: checkbox?.checked || false
            });
        }
    });

    // AI Auto-categorize
    if (!taskId && state.aiSettings.autoCategorize && state.aiSettings.apiKey) {
        const aiCategory = suggestCategoryWithAI(title);
        if (aiCategory) {
            console.log('AI suggested category:', aiCategory);
        }
    }

    if (taskId) {
        // Update existing task
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            task.title = title;
            task.description = description;
            task.category = category;
            task.priority = priority;
            task.dueDate = dueDate;
            task.dueTime = dueTime;
            task.recurring = recurring;
            task.subtasks = subtasks;
            task.updatedAt = new Date().toISOString();
            showToast('Task updated successfully!', 'success');
        }
    } else {
        // Create new task
        const newTask = {
            id: generateId(),
            title,
            description,
            category,
            priority,
            dueDate,
            dueTime,
            recurring,
            subtasks,
            completed: false,
            createdAt: new Date().toISOString()
        };
        state.tasks.push(newTask);
        showToast('Task created successfully!', 'success');
    }

    saveToStorage();
    closeModal('taskModal');
    renderAllViews();
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveToStorage();
        renderAllViews();
        showToast('Task deleted!', 'info');
    }
}

function openTaskDetails(taskId) {
    state.selectedTaskId = taskId;
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const content = document.getElementById('taskDetailsContent');
    const category = state.categories.find(c => c.category === task.category) || 
                     state.categories.find(c => c.id === task.category);
    const isTaskOverdue = !task.completed && isOverdue(task.dueDate);

    let subtasksHtml = '';
    if (task.subtasks?.length > 0) {
        const completed = task.subtasks.filter(s => s.completed).length;
        subtasksHtml = `
            <div class="detail-item">
                <label>Subtasks</label>
                <span>${completed}/${task.subtasks.length} completed</span>
                <div style="margin-top: 10px;">
                    ${task.subtasks.map(s => `
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 5px;">
                            <i class="fas ${s.completed ? 'fa-check-circle' : 'fa-circle'}" 
                               style="color: ${s.completed ? 'var(--success)' : 'var(--text-muted)'}"></i>
                            <span style="${s.completed ? 'text-decoration: line-through; opacity: 0.6' : ''}">
                                ${escapeHtml(s.title)}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    content.innerHTML = `
        <h2 style="margin-bottom: 20px;">${escapeHtml(task.title)}</h2>
        <div class="detail-row">
            <div class="detail-item">
                <label>Category</label>
                <span style="display: flex; align-items: center; gap: 8px;">
                    <span class="category-badge" style="background: ${category?.color}"></span>
                    ${category?.name || task.category}
                </span>
            </div>
            <div class="detail-item">
                <label>Priority</label>
                <span class="task-priority ${task.priority}">${task.priority}</span>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-item">
                <label>Due Date</label>
                <span class="${isTaskOverdue ? 'overdue' : ''}">
                    ${task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                </span>
            </div>
            <div class="detail-item">
                <label>Due Time</label>
                <span>${task.dueTime || 'No time set'}</span>
            </div>
        </div>
        ${task.description ? `
            <div class="detail-description">
                <label>Description</label>
                <p>${escapeHtml(task.description)}</p>
            </div>
        ` : ''}
        ${subtasksHtml}
        <div class="detail-row">
            <div class="detail-item">
                <label>Status</label>
                <span style="color: ${task.completed ? 'var(--success)' : 'var(--warning)'}">
                    ${task.completed ? '✓ Completed' : '○ Pending'}
                </span>
            </div>
            <div class="detail-item">
                <label>Created</label>
                <span>${formatDate(task.createdAt)}</span>
            </div>
        </div>
    `;

    elements.modals.taskDetails.classList.add('active');
}

function editSelectedTask() {
    closeModal('taskDetailsModal');
    openTaskModal(state.selectedTaskId);
}

function deleteSelectedTask() {
    deleteTask(state.selectedTaskId);
    closeModal('taskDetailsModal');
}

// ===== Category Management =====
function renderCategories() {
    const container = elements.categoriesList;
    if (!container) return;

    container.innerHTML = state.categories.map(cat => {
        const count = state.tasks.filter(t => t.category === cat.id && !t.completed).length;
        return `
            <button class="category-item ${state.currentFilter.category === cat.id ? 'active' : ''}" 
                    onclick="filterByCategory('${cat.id}')">
                <span class="category-dot" style="background: ${cat.color}"></span>
                <span>${cat.name}</span>
                <span class="category-count">${count}</span>
            </button>
        `;
    }).join('');
}

function filterByCategory(categoryId) {
    state.currentFilter.category = state.currentFilter.category === categoryId ? null : categoryId;
    renderCategories();
    renderAllTasks();
}

function openCategoryModal() {
    elements.modals.category.classList.add('active');
}

function handleCategorySubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('categoryName').value.trim();
    const color = document.getElementById('categoryColor').value;

    const newCategory = {
        id: generateId(),
        name,
        color
    };

    state.categories.push(newCategory);
    saveToStorage();
    closeModal('categoryModal');
    renderCategories();
    showToast('Category added!', 'success');
    
    document.getElementById('categoryForm').reset();
}

// ===== Priority Filter =====
function setPriorityFilter(priority) {
    state.currentFilter.priority = priority;
    
    elements.priorityFilters.forEach(f => {
        f.classList.toggle('active', f.dataset.priority === priority);
    });

    renderAllTasks();
}

// ===== Search =====
function handleSearch() {
    if (state.currentView === 'tasks') {
        renderAllTasks();
    }
}

// ===== Sort =====
function handleSort() {
    const sortBy = document.getElementById('sortBy').value;
    
    switch(sortBy) {
        case 'date':
            state.tasks.sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
            break;
        case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            state.tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            break;
        case 'name':
            state.tasks.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'category':
            state.tasks.sort((a, b) => a.category.localeCompare(b.category));
            break;
    }

    saveToStorage();
    renderAllTasks();
}

// ===== AI Features =====
function generateAiSuggestions() {
    const container = document.getElementById('aiSuggestionsList');
    if (!container) return;

    // Get pending tasks
    const pendingTasks = state.tasks.filter(t => !t.completed);
    const highPriority = pendingTasks.filter(t => t.priority === 'high');
    const overdue = pendingTasks.filter(t => isOverdue(t.dueDate));

    let suggestions = [];

    // Overdue tasks suggestion
    if (overdue.length > 0) {
        suggestions.push({
            icon: 'fa-exclamation-triangle',
            title: 'Complete Overdue Tasks',
            description: `You have ${overdue.length} overdue task(s) pending`,
            action: 'View Overdue'
        });
    }

    // High priority suggestion
    if (highPriority.length > 0) {
        suggestions.push({
            icon: 'fa-fire',
            title: 'Focus on High Priority',
            description: `${highPriority.length} high priority tasks need attention`,
            action: 'View High Priority'
        });
    }

    // Today's tasks
    const today = new Date().toDateString();
    const todayTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today);
    if (todayTasks.length > 0) {
        suggestions.push({
            icon: 'fa-sun',
            title: "Today's Focus",
            description: `You have ${todayTasks.length} tasks scheduled for today`,
            action: 'View Today'
        });
    }

    // Productivity tip
    if (pendingTasks.length > 5) {
        suggestions.push({
            icon: 'fa-lightbulb',
            title: 'Productivity Tip',
            description: 'Break down large tasks into smaller subtasks for better focus',
            action: 'Add Subtask'
        });
    }

    // AI-powered suggestions (if API key is set)
    if (state.aiSettings.apiKey && pendingTasks.length > 0) {
        const aiSuggestion = generateAiPoweredSuggestion(pendingTasks);
        if (aiSuggestion) {
            suggestions.unshift(aiSuggestion);
        }
    }

    if (suggestions.length === 0) {
        suggestions.push({
            icon: 'fa-check-circle',
            title: 'All Caught Up!',
            description: 'Great job! No pending tasks. Time to relax or plan ahead.',
            action: null
        });
    }

    container.innerHTML = suggestions.map(s => `
        <div class="ai-suggestion-card">
            <i class="fas ${s.icon}"></i>
            <div class="ai-suggestion-content">
                <h4>${s.title}</h4>
                <p>${s.description}</p>
            </div>
            ${s.action ? `<button class="ai-suggestion-action">${s.action}</button>` : ''}
        </div>
    `).join('');
}

function generateAiPoweredSuggestion(tasks) {
    // Simple AI-like suggestion based on task patterns
    const workTasks = tasks.filter(t => t.category === 'work');
    const personalTasks = tasks.filter(t => t.category === 'personal');

    if (workTasks.length > personalTasks.length * 2) {
        return {
            icon: 'fa-robot',
            title: 'AI Insight',
            description: 'Your workload seems heavy. Consider delegating or postponing some tasks.',
            action: 'Review Tasks'
        };
    }

    const morningTasks = tasks.filter(t => t.dueTime && parseInt(t.dueTime) < 12);
    if (morningTasks.length > 3) {
        return {
            icon: 'fa-robot',
            title: 'AI Insight',
            description: 'You have many morning tasks. Consider spreading them throughout the day.',
            action: 'Reschedule'
        };
    }

    return null;
}

function suggestCategoryWithAI(title) {
    // Simple keyword-based categorization (simulating AI)
    const titleLower = title.toLowerCase();
    
    const keywords = {
        work: ['meeting', 'presentation', 'report', 'email', 'project', 'deadline', 'client'],
        personal: ['home', 'family', 'friend', 'personal', 'hobby'],
        shopping: ['buy', 'purchase', 'grocery', 'shop', 'order'],
        health: ['doctor', 'exercise', 'gym', 'workout', 'medicine', 'health'],
        finance: ['bill', 'payment', 'tax', 'invoice', 'budget', 'money']
    };

    for (const [category, words] of Object.entries(keywords)) {
        if (words.some(word => titleLower.includes(word))) {
            return category;
        }
    }

    return null;
}

// ===== Modal Functions =====
function openModal(modalName) {
    elements.modals[modalName]?.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

// ===== Theme Functions =====
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('aiTheme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = elements.themeToggle?.querySelector('i');
    const text = elements.themeToggle?.querySelector('span');
    
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
    if (text) {
        text.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }
}

function handleAiSettingsSubmit(e) {
    e.preventDefault();
    
    state.aiSettings.apiKey = document.getElementById('aiApiKey').value.trim();
    state.aiSettings.autoSuggest = document.getElementById('aiAutoSuggest').checked;
    state.aiSettings.autoCategorize = document.getElementById('aiAutoCategorize').checked;
    
    saveToStorage();
    closeModal('aiSettingsModal');
    showToast('AI settings saved!', 'success');
}

// ===== Subtasks =====
function addSubtaskField(title = '', completed = false) {
    const container = document.getElementById('subtasksList');
    if (!container) return;

    const subtaskHtml = `
        <div class="subtask-item">
            <input type="checkbox" ${completed ? 'checked' : ''}>
            <input type="text" value="${escapeHtml(title)}" placeholder="Enter subtask...">
            <button type="button" class="subtask-remove" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', subtaskHtml);
}

// ===== Color Picker =====
function selectColorPreset(preset) {
    const colorInput = document.getElementById('categoryColor');
    colorInput.value = preset.dataset.color;
    
    document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
    preset.classList.add('selected');
}

// ===== Utility Functions =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isOverdue(dueDate) {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function toggleSidebar() {
    elements.sidebar?.classList.toggle('open');
    elements.sidebar?.classList.toggle('collapsed');
    elements.mainContent?.classList.toggle('expanded');
}

// ===== Expose Functions Globally =====
window.toggleTaskComplete = toggleTaskComplete;
window.openTaskModal = openTaskModal;
window.openTaskDetails = openTaskDetails;
window.deleteTask = deleteTask;
window.filterByCategory = filterByCategory;
