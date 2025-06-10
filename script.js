// Proposal configuration
const PROPOSALS = [
    { id: 1, file: '01-elevate-proposal.md', name: 'Elevate - Growth-Focused' },
    { id: 2, file: '02-catalyst-proposal.md', name: 'Catalyst - Innovation-Driven' },
    { id: 3, file: '03-compass-proposal.md', name: 'Compass - Navigation-Focused' },
    { id: 4, file: '04-nexus-proposal.md', name: 'Nexus - Connection-Centered' },
    { id: 5, file: '05-forge-proposal.md', name: 'Forge - Transformation-Focused' },
    { id: 6, file: '06-quantum-proposal.md', name: 'Quantum - Breakthrough-Oriented' },
    { id: 7, file: '07-velocity-proposal.md', name: 'Velocity - Speed-Focused' },
    { id: 8, file: '08-horizon-proposal.md', name: 'Horizon - Future-Focused' },
    { id: 9, file: '09-pulse-proposal.md', name: 'Pulse - Rhythm-Based' },
    { id: 10, file: '10-spark-proposal.md', name: 'Spark - Ignition-Focused' }
];

let proposalsData = {};
let currentSlide = 1;

// Initialize the application
async function init() {
    try {
        await loadAllProposals();
        generateNavigation();
        showSlide(1);
    } catch (error) {
        console.error('Failed to initialize:', error);
        document.getElementById('slides-container').innerHTML = 
            '<div class="error">Failed to load proposals. Please check that the proposal files are available.</div>';
    }
}

// Load all proposal files
async function loadAllProposals() {
    const loadPromises = PROPOSALS.map(async (proposal) => {
        try {
            const response = await fetch(`proposals/${proposal.file}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${proposal.file}: ${response.status}`);
            }
            const content = await response.text();
            proposalsData[proposal.id] = parseMarkdown(content, proposal);
        } catch (error) {
            console.error(`Error loading ${proposal.file}:`, error);
            proposalsData[proposal.id] = {
                title: proposal.name,
                error: `Failed to load proposal: ${error.message}`
            };
        }
    });

    await Promise.all(loadPromises);
}

// Parse markdown content into structured data
function parseMarkdown(content, proposal) {
    const lines = content.split('\n');
    const data = {
        title: proposal.name,
        sections: {}
    };

    let currentSection = null;
    let currentSubsection = null;
    let content_buffer = [];

    for (let line of lines) {
        line = line.trim();
        
        if (line.startsWith('# ')) {
            data.title = line.substring(2).trim();
        } else if (line.startsWith('## ')) {
            // Save previous section
            if (currentSection && content_buffer.length > 0) {
                if (!data.sections[currentSection]) data.sections[currentSection] = {};
                if (currentSubsection) {
                    data.sections[currentSection][currentSubsection] = content_buffer.join('\n');
                } else {
                    data.sections[currentSection].content = content_buffer.join('\n');
                }
            }
            
            currentSection = line.substring(3).trim();
            currentSubsection = null;
            content_buffer = [];
        } else if (line.startsWith('**') && line.endsWith(':**')) {
            // Save previous subsection
            if (currentSubsection && content_buffer.length > 0) {
                if (!data.sections[currentSection]) data.sections[currentSection] = {};
                data.sections[currentSection][currentSubsection] = content_buffer.join('\n');
            }
            
            currentSubsection = line.substring(2, line.length - 3).trim();
            content_buffer = [];
        } else if (line) {
            content_buffer.push(line);
        }
    }

    // Save final section
    if (currentSection && content_buffer.length > 0) {
        if (!data.sections[currentSection]) data.sections[currentSection] = {};
        if (currentSubsection) {
            data.sections[currentSection][currentSubsection] = content_buffer.join('\n');
        } else {
            data.sections[currentSection].content = content_buffer.join('\n');
        }
    }

    return data;
}

// Generate navigation menu
function generateNavigation() {
    const nav = document.getElementById('navigation');
    nav.innerHTML = '';

    PROPOSALS.forEach((proposal, index) => {
        const navItem = document.createElement('button');
        navItem.className = 'nav-item';
        navItem.textContent = proposal.name;
        navItem.onclick = () => showSlide(proposal.id, navItem);
        
        if (index === 0) navItem.classList.add('active');
        nav.appendChild(navItem);
    });
}

// Show specific slide
function showSlide(slideId, clickedElement = null) {
    currentSlide = slideId;
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        const navItems = document.querySelectorAll('.nav-item');
        if (navItems[slideId - 1]) {
            navItems[slideId - 1].classList.add('active');
        }
    }

    // Generate and show slide content
    const container = document.getElementById('slides-container');
    const proposalData = proposalsData[slideId];

    if (!proposalData) {
        container.innerHTML = '<div class="error">Proposal not found</div>';
        return;
    }

    if (proposalData.error) {
        container.innerHTML = `<div class="error">${proposalData.error}</div>`;
        return;
    }

    container.innerHTML = generateSlideHTML(proposalData, slideId);
    
    // Initialize feedback for this slide
    initializeFeedback(slideId);
}

// Generate HTML for a slide
function generateSlideHTML(data, slideId) {
    let html = `<div class="slide active">
        <h1>${data.title}</h1>`;

    // Generate sections
    for (const [sectionName, sectionData] of Object.entries(data.sections)) {
        html += `<h2>${sectionName}</h2>`;
        
        if (typeof sectionData === 'string') {
            html += `<div>${formatContent(sectionData)}</div>`;
        } else if (sectionData.content) {
            html += `<div>${formatContent(sectionData.content)}</div>`;
        } else {
            // Handle subsections
            for (const [subName, subContent] of Object.entries(sectionData)) {
                if (subName !== 'content') {
                    html += `<h3>${subName}</h3>`;
                    html += `<div>${formatContent(subContent)}</div>`;
                }
            }
        }
    }

    // Add feedback section
    html += generateFeedbackSection(slideId);
    html += '</div>';

    return html;
}

// Format markdown-like content to HTML
function formatContent(content) {
    return content
        .split('\n')
        .map(line => {
            line = line.trim();
            if (line.startsWith('- ')) {
                return `<li>${line.substring(2)}</li>`;
            } else if (line) {
                return `<p>${line}</p>`;
            }
            return '';
        })
        .join('')
        .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
        .replace(/<\/ul><ul>/g, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Generate feedback section HTML
function generateFeedbackSection(slideId) {
    return `
        <div class="feedback-section">
            <div class="feedback-header">
                <h3>Feedback & Comments</h3>
                <div class="feedback-controls">
                    <button class="btn btn-primary" onclick="toggleFeedbackForm(${slideId})">Add Feedback</button>
                    <button class="btn btn-secondary" onclick="exportFeedback(${slideId})">Export</button>
                </div>
            </div>
            
            <div id="feedback-form-${slideId}" class="feedback-form" style="display: none;">
                <div class="rating-section">
                    <label>Overall Rating:</label>
                    <div class="stars" id="stars-${slideId}">
                        ${[1,2,3,4,5].map(i => `<span class="star" onclick="setRating(${slideId}, ${i})">★</span>`).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="category-${slideId}">Category:</label>
                    <select id="category-${slideId}">
                        <option value="approval">Approval</option>
                        <option value="suggestion">Suggestion</option>
                        <option value="concern">Concern</option>
                        <option value="question">Question</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="reviewer-${slideId}">Your Name:</label>
                    <input type="text" id="reviewer-${slideId}" placeholder="Enter your name">
                </div>
                
                <div class="form-group">
                    <label for="comment-${slideId}">Comment:</label>
                    <textarea id="comment-${slideId}" placeholder="Enter your feedback..."></textarea>
                </div>
                
                <div class="feedback-controls">
                    <button class="btn btn-primary" onclick="saveFeedback(${slideId})">Save Feedback</button>
                    <button class="btn btn-secondary" onclick="toggleFeedbackForm(${slideId})">Cancel</button>
                </div>
            </div>
            
            <div id="feedback-list-${slideId}" class="feedback-list"></div>
        </div>
    `;
}

// Feedback functionality
let feedbackData = JSON.parse(localStorage.getItem('proposalFeedback') || '{}');

function initializeFeedback(slideId) {
    displayFeedback(slideId);
}

function toggleFeedbackForm(slideId) {
    const form = document.getElementById(`feedback-form-${slideId}`);
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function setRating(slideId, rating) {
    const stars = document.querySelectorAll(`#stars-${slideId} .star`);
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < rating);
    });
    stars[0].dataset.rating = rating;
}

function saveFeedback(slideId) {
    const rating = document.querySelector(`#stars-${slideId} .star`).dataset.rating || 0;
    const category = document.getElementById(`category-${slideId}`).value;
    const reviewer = document.getElementById(`reviewer-${slideId}`).value;
    const comment = document.getElementById(`comment-${slideId}`).value;

    if (!reviewer || !comment) {
        alert('Please fill in all fields');
        return;
    }

    if (!feedbackData[slideId]) feedbackData[slideId] = [];
    
    feedbackData[slideId].push({
        id: Date.now(),
        rating: parseInt(rating),
        category,
        reviewer,
        comment,
        timestamp: new Date().toISOString()
    });

    localStorage.setItem('proposalFeedback', JSON.stringify(feedbackData));
    
    // Reset form
    document.getElementById(`reviewer-${slideId}`).value = '';
    document.getElementById(`comment-${slideId}`).value = '';
    document.querySelectorAll(`#stars-${slideId} .star`).forEach(star => star.classList.remove('active'));
    
    toggleFeedbackForm(slideId);
    displayFeedback(slideId);
}

function displayFeedback(slideId) {
    const container = document.getElementById(`feedback-list-${slideId}`);
    const feedback = feedbackData[slideId] || [];
    
    if (feedback.length === 0) {
        container.innerHTML = '<p style="color: #7f8c8d; font-style: italic;">No feedback yet.</p>';
        return;
    }

    container.innerHTML = feedback.map(item => `
        <div class="feedback-item">
            <div class="feedback-meta">
                <div>
                    <span class="feedback-category category-${item.category}">${item.category.toUpperCase()}</span>
                    <strong>${item.reviewer}</strong> • ${new Date(item.timestamp).toLocaleDateString()}
                </div>
                <div>
                    ${'★'.repeat(item.rating)}${'☆'.repeat(5-item.rating)}
                </div>
            </div>
            <p>${item.comment}</p>
        </div>
    `).join('');
}

function exportFeedback(slideId) {
    const feedback = feedbackData[slideId] || [];
    const proposalName = PROPOSALS.find(p => p.id === slideId)?.name || `Proposal ${slideId}`;
    
    const exportData = {
        proposal: proposalName,
        exportDate: new Date().toISOString(),
        feedback: feedback
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${proposalName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init); 