// Centralized Notifications & Reminders Module
// Usage: notifications.add({ id, caseTitle, type, message })

const notifications = {
    list: [],
    add: function(notification) {
        // Prevent duplicate notifications by id
        if (!this.list.some(n => n.id === notification.id)) {
            this.list.push(notification);
            this.render();
        }
    },
    render: function() {
        const panel = document.getElementById('notificationsPanel');
        const badge = document.getElementById('notificationBadge');
        const listDiv = document.getElementById('notificationsList');
        if (!panel || !badge || !listDiv) return;
        if (this.list.length > 0) {
            badge.textContent = this.list.length;
            badge.classList.remove('hidden');
            listDiv.innerHTML = this.list.map(n => {
                const color = n.type === 'critical' ? 'bg-red-100 border-red-500 text-red-800' :
                              n.type === 'urgent' ? 'bg-orange-100 border-orange-500 text-orange-800' :
                              n.type === 'info' ? 'bg-blue-100 border-blue-500 text-blue-800' :
                              'bg-yellow-100 border-yellow-500 text-yellow-800';
                return `<div class="p-3 border-l-4 rounded ${color}"><p class="font-medium">${n.caseTitle}</p><p class="text-sm">${n.message}</p></div>`;
            }).join('');
        } else {
            badge.classList.add('hidden');
            listDiv.innerHTML = '<p class="text-gray-500 text-sm">No active notifications</p>';
        }
    },
    clear: function() {
        this.list = [];
        this.render();
    }
};

window.notifications = notifications;
