// Real-Time Polling Application
class PollApp {
    constructor() {
        this.polls = [];
        this.currentPollId = null;
        this.currentView = 'dashboard';
        this.updateInterval = null;
        this.votedPolls = new Set();
        this.chart = null;
        
        // Configuration
        this.config = {
            maxPollOptions: 6,
            minPollOptions: 2,
            updateInterval: 3000,
            simulateVoting: true,
            animationDuration: 500
        };
        
        this.init();
    }

    init() {
        this.loadSampleData();
        this.bindEvents();
        this.showDashboard();
        this.startRealTimeUpdates();
    }

    loadSampleData() {
        this.polls = [
            {
                "id": "poll_1",
                "question": "What's your favorite programming language?",
                "options": [
                    {"text": "JavaScript", "votes": 45},
                    {"text": "Python", "votes": 38},
                    {"text": "Java", "votes": 25},
                    {"text": "C++", "votes": 19}
                ],
                "createdAt": "2025-08-11T10:30:00Z",
                "status": "active"
            },
            {
                "id": "poll_2", 
                "question": "Best time for coffee?",
                "options": [
                    {"text": "Early Morning", "votes": 32},
                    {"text": "Mid Morning", "votes": 28},
                    {"text": "Afternoon", "votes": 15},
                    {"text": "Evening", "votes": 8}
                ],
                "createdAt": "2025-08-11T09:15:00Z",
                "status": "active"
            },
            {
                "id": "poll_3",
                "question": "Preferred work environment?",
                "options": [
                    {"text": "Remote", "votes": 67},
                    {"text": "Office", "votes": 23},
                    {"text": "Hybrid", "votes": 41}
                ],
                "createdAt": "2025-08-11T08:45:00Z", 
                "status": "active"
            }
        ];
    }

    bindEvents() {
        // Navigation events
        document.getElementById('createPollBtn').addEventListener('click', () => this.showCreatePoll());
        document.getElementById('dashboardBtn').addEventListener('click', () => this.showDashboard());
        
        // Form events
        document.getElementById('createPollForm').addEventListener('submit', (e) => this.handleCreatePoll(e));
        document.getElementById('votingForm').addEventListener('submit', (e) => this.handleVote(e));
        document.getElementById('addOptionBtn').addEventListener('click', () => this.addOption());
        
        // Results events
        document.getElementById('resetPollBtn').addEventListener('click', () => this.resetPoll());
        document.getElementById('deletePollBtn').addEventListener('click', () => this.deletePoll());
        
        // Voting option selection
        document.addEventListener('change', (e) => {
            if (e.target.name === 'voteOption') {
                this.updateVotingSelection();
            }
        });
    }

    showDashboard() {
        this.hideAllSections();
        document.getElementById('dashboardSection').classList.add('active');
        this.currentView = 'dashboard';
        this.renderPolls();
    }

    showCreatePoll() {
        this.hideAllSections();
        document.getElementById('createPollSection').classList.add('active');
        this.currentView = 'create';
        this.resetCreateForm();
    }

    showVoting(pollId) {
        const poll = this.getPollById(pollId);
        if (!poll) return;

        this.hideAllSections();
        document.getElementById('votingSection').classList.add('active');
        this.currentView = 'voting';
        this.currentPollId = pollId;
        
        document.getElementById('votingQuestion').textContent = poll.question;
        this.renderVotingOptions(poll);
    }

    showResults(pollId) {
        const poll = this.getPollById(pollId);
        if (!poll) return;

        this.hideAllSections();
        document.getElementById('resultsSection').classList.add('active');
        this.currentView = 'results';
        this.currentPollId = pollId;
        
        document.getElementById('resultsQuestion').textContent = poll.question;
        this.renderResults(poll);
    }

    hideAllSections() {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
    }

    renderPolls() {
        const grid = document.getElementById('pollsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (this.polls.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        const pollsHtml = this.polls.map(poll => {
            const totalVotes = this.getTotalVotes(poll);
            const topOption = this.getTopOption(poll);
            
            return `
                <div class="poll-card fade-in" onclick="pollApp.showVoting('${poll.id}')">
                    <h3 class="poll-question">${poll.question}</h3>
                    <div class="poll-stats">
                        <span class="poll-votes">${totalVotes} votes</span>
                        <span class="status status--success">${poll.status}</span>
                    </div>
                    <div class="poll-preview">
                        ${poll.options.slice(0, 3).map(option => `
                            <div class="preview-option">
                                <span>${option.text}</span>
                                <span class="preview-votes">${option.votes}</span>
                            </div>
                        `).join('')}
                        ${poll.options.length > 3 ? `<div class="preview-option"><span>+${poll.options.length - 3} more...</span></div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        grid.innerHTML = pollsHtml;
    }

    renderVotingOptions(poll) {
        const container = document.getElementById('votingOptions');
        
        const optionsHtml = poll.options.map((option, index) => `
            <div class="voting-option">
                <input type="radio" id="option${index}" name="voteOption" value="${index}">
                <label for="option${index}">${option.text}</label>
            </div>
        `).join('');
        
        container.innerHTML = optionsHtml;
    }

    renderResults(poll) {
        const totalVotes = this.getTotalVotes(poll);
        const topOption = this.getTopOption(poll);
        
        // Update stats
        document.getElementById('totalVotes').textContent = totalVotes;
        document.getElementById('leadingOption').textContent = topOption ? topOption.text : '-';
        document.getElementById('lastUpdate').textContent = `Updated ${new Date().toLocaleTimeString()}`;
        
        // Update breakdown
        this.renderResultsBreakdown(poll);
        
        // Update chart
        this.renderChart(poll);
    }

    renderResultsBreakdown(poll) {
        const container = document.getElementById('resultsBreakdown');
        const totalVotes = this.getTotalVotes(poll);
        
        const breakdownHtml = poll.options.map(option => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes * 100).toFixed(1) : 0;
            
            return `
                <div class="breakdown-item">
                    <div class="breakdown-header">
                        <span class="breakdown-label">${option.text}</span>
                        <div>
                            <span class="breakdown-votes">${option.votes} votes</span>
                            <span class="breakdown-percentage">${percentage}%</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = breakdownHtml;
    }

    renderChart(poll) {
        const ctx = document.getElementById('resultsChart');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        const labels = poll.options.map(option => option.text);
        const data = poll.options.map(option => option.votes);
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545'];
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Votes',
                    data: data,
                    backgroundColor: colors.slice(0, poll.options.length),
                    borderColor: colors.slice(0, poll.options.length),
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                animation: {
                    duration: this.config.animationDuration,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    handleCreatePoll(e) {
        e.preventDefault();
        
        const question = document.getElementById('pollQuestion').value.trim();
        const optionInputs = document.querySelectorAll('#pollOptions input');
        const options = Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(text => text.length > 0)
            .map(text => ({ text, votes: 0 }));
        
        if (options.length < this.config.minPollOptions) {
            alert(`Please add at least ${this.config.minPollOptions} options.`);
            return;
        }
        
        const poll = {
            id: `poll_${Date.now()}`,
            question,
            options,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        this.polls.push(poll);
        this.showDashboard();
        
        // Add some animation
        setTimeout(() => {
            const newCard = document.querySelector(`[onclick="pollApp.showVoting('${poll.id}')"]`);
            if (newCard) newCard.classList.add('slide-up');
        }, 100);
    }

    handleVote(e) {
        e.preventDefault();
        
        const selectedOption = document.querySelector('input[name="voteOption"]:checked');
        if (!selectedOption) {
            alert('Please select an option to vote.');
            return;
        }
        
        if (this.votedPolls.has(this.currentPollId)) {
            alert('You have already voted on this poll.');
            return;
        }
        
        const poll = this.getPollById(this.currentPollId);
        const optionIndex = parseInt(selectedOption.value);
        
        poll.options[optionIndex].votes++;
        this.votedPolls.add(this.currentPollId);
        
        this.showResults(this.currentPollId);
    }

    resetPoll() {
        if (confirm('Are you sure you want to reset all votes for this poll?')) {
            const poll = this.getPollById(this.currentPollId);
            poll.options.forEach(option => option.votes = 0);
            this.votedPolls.delete(this.currentPollId);
            this.renderResults(poll);
        }
    }

    deletePoll() {
        if (confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
            this.polls = this.polls.filter(poll => poll.id !== this.currentPollId);
            this.votedPolls.delete(this.currentPollId);
            this.showDashboard();
        }
    }

    addOption() {
        const container = document.getElementById('pollOptions');
        const optionCount = container.children.length;
        
        if (optionCount >= this.config.maxPollOptions) {
            alert(`Maximum ${this.config.maxPollOptions} options allowed.`);
            return;
        }
        
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-input fade-in';
        optionDiv.innerHTML = `
            <input type="text" class="form-control" placeholder="Option ${optionCount + 1}" required>
            <button type="button" class="btn-remove" onclick="pollApp.removeOption(this)">×</button>
        `;
        
        container.appendChild(optionDiv);
        this.updateRemoveButtons();
    }

    removeOption(button) {
        const container = document.getElementById('pollOptions');
        if (container.children.length <= this.config.minPollOptions) {
            alert(`Minimum ${this.config.minPollOptions} options required.`);
            return;
        }
        
        button.parentElement.remove();
        this.updateRemoveButtons();
        this.updatePlaceholders();
    }

    updateRemoveButtons() {
        const container = document.getElementById('pollOptions');
        const removeButtons = container.querySelectorAll('.btn-remove');
        
        removeButtons.forEach(button => {
            if (container.children.length > this.config.minPollOptions) {
                button.classList.remove('hidden');
            } else {
                button.classList.add('hidden');
            }
        });
    }

    updatePlaceholders() {
        const inputs = document.querySelectorAll('#pollOptions input');
        inputs.forEach((input, index) => {
            input.placeholder = `Option ${index + 1}`;
        });
    }

    updateVotingSelection() {
        document.querySelectorAll('.voting-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selected = document.querySelector('input[name="voteOption"]:checked');
        if (selected) {
            selected.closest('.voting-option').classList.add('selected');
        }
    }

    resetCreateForm() {
        document.getElementById('createPollForm').reset();
        const container = document.getElementById('pollOptions');
        
        // Keep only 2 options
        while (container.children.length > this.config.minPollOptions) {
            container.lastElementChild.remove();
        }
        
        this.updateRemoveButtons();
        this.updatePlaceholders();
    }

    startRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            if (this.config.simulateVoting && this.polls.length > 0) {
                this.simulateVote();
            }
            
            if (this.currentView === 'results' && this.currentPollId) {
                const poll = this.getPollById(this.currentPollId);
                if (poll) {
                    this.renderResults(poll);
                }
            } else if (this.currentView === 'dashboard') {
                this.renderPolls();
            }
        }, this.config.updateInterval);
    }

    simulateVote() {
        // Randomly select a poll and option to add votes
        const activePoll = this.polls[Math.floor(Math.random() * this.polls.length)];
        if (activePoll && Math.random() < 0.3) { // 30% chance of simulated vote
            const randomOption = activePoll.options[Math.floor(Math.random() * activePoll.options.length)];
            randomOption.votes++;
            
            // Add animation class if viewing results for this poll
            if (this.currentView === 'results' && this.currentPollId === activePoll.id) {
                const voteElements = document.querySelectorAll('.stat-value, .breakdown-votes, .preview-votes');
                voteElements.forEach(el => {
                    el.classList.add('vote-count-update');
                    setTimeout(() => el.classList.remove('vote-count-update'), 500);
                });
            }
        }
    }

    getPollById(id) {
        return this.polls.find(poll => poll.id === id);
    }

    getTotalVotes(poll) {
        return poll.options.reduce((sum, option) => sum + option.votes, 0);
    }

    getTopOption(poll) {
        return poll.options.reduce((max, option) => 
            option.votes > max.votes ? option : max
        );
    }
}

// Global functions for HTML onclick handlers
function showCreatePoll() {
    pollApp.showCreatePoll();
}

function showDashboard() {
    pollApp.showDashboard();
}

function removeOption(button) {
    pollApp.removeOption(button);
}

// Initialize the app
const pollApp = new PollApp();