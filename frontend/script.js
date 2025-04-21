// game state
let currentUser = null;
let score = 0;
let currentQuestionIndex = 0;
let currentLevel = 1;
let currentImages = null;
let nextLevelImages = null;
let isPreloading = false;
let currentOriginalIndex = -1;
let selectedImageIndex = -1;
let levelStartTime = 0;
const MAX_SCORE = 1000;
const TIME_LIMIT = 5000; // 50 seconds to get full points
let correctAnswers = 0;

// leaderboard data cache
let leaderboardCache = null;
let lastLeaderboardUpdate = 0;
const LEADERBOARD_CACHE_DURATION = 30000; // 30 seconds

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const scoreElement = document.getElementById('score');
const questionText = document.getElementById('question-text');
const optionsContainer = document.querySelector('.options-container');
const feedbackElement = document.getElementById('feedback');

// nav functions
function showHome() {
    hideAllSections();
    document.getElementById('home-section').classList.add('active');
    document.getElementById('user-profile').style.display = 'block';
    document.getElementById('home-button').style.display = 'none';
}

function showLogin() {
    hideAllSections();
    document.getElementById('login-section').classList.add('active');
    document.getElementById('user-profile').style.display = 'none';
    document.getElementById('home-button').style.display = 'none';
}

function showRegister() {
    hideAllSections();
    document.getElementById('register-section').classList.add('active');
    document.getElementById('user-profile').style.display = 'none';
    document.getElementById('home-button').style.display = 'flex';
}

function showGame() {
    hideAllSections();
    document.getElementById('game-section').classList.add('active');
    document.getElementById('user-profile').style.display = 'block';
    document.getElementById('home-button').style.display = 'flex';
    
    // Reset game state
    score = 0;
    currentLevel = 1;
    correctAnswers = 0;
    updateScore();
    updateLevelDisplay();
    
    // Ensure game over section is hidden
    document.getElementById('game-over-section').classList.remove('active');
    
    // Start the game   
    startGame();
}

function showEducation() {
    hideAllSections();
    document.getElementById('education-section').classList.add('active');
    // Reset to intro page when entering education section
    currentEducationPage = educationPages.indexOf('intro-page');
    updateEducationPages();
    document.getElementById('user-profile').style.display = 'block';
    document.getElementById('home-button').style.display = 'flex';
}

function showLeaderboard() {
    hideAllSections();
    document.getElementById('leaderboard-section').classList.add('active');
    document.getElementById('user-profile').style.display = 'block';
    document.getElementById('home-button').style.display = 'flex';
    
    // Check if cache is stale or doesn't exist
    const now = Date.now();
    if (!leaderboardCache || (now - lastLeaderboardUpdate) > LEADERBOARD_CACHE_DURATION) {
        preloadLeaderboard();
    } else {
        updateLeaderboardDisplay();
    }
}

function logout() {
    // Clear any user data
    localStorage.removeItem('username');
    // Return to login screen
    showLogin();
}

// education page navigation
const educationPages = [
    'intro-page',
    'overview-page',
    'facial-page',
    'background-page',
    'artifacts-page'
];

let currentEducationPage = 0;

function updateEducationPages() {
    // First hide all education pages
    document.querySelectorAll('.education-page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Then show the current page
    const currentPage = document.getElementById(educationPages[currentEducationPage]);
    if (currentPage) {
        currentPage.classList.add('active');
    }
}

function nextEducationPage() {
    if (currentEducationPage < educationPages.length - 1) {
        currentEducationPage++;
        updateEducationPages();
    } else {
        // If we're at the last page, go back to overview
        currentEducationPage = educationPages.indexOf('overview-page');
        updateEducationPages();
    }
}

function prevEducationPage() {
    if (currentEducationPage > 0) {
        currentEducationPage--;
        updateEducationPages();
    }
}

function goToPage(pageId) {
    const targetIndex = educationPages.indexOf(pageId);
    if (targetIndex !== -1) {
        currentEducationPage = targetIndex;
        updateEducationPages();
    }
}

// user management
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:8000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        // store username and show home screen
        localStorage.setItem('username', username);
        showHome();
        document.getElementById('display-username').textContent = username;
    } catch (error) {
        alert(error.message);
    }
});

// password validation with detailed feedback
function validatePassword(password) {
    const requirements = {
        length: password.length >= 10,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*]/.test(password)
    };

    // update visual indicators with detailed feedback
    const lengthElement = document.getElementById('req-length');
    const uppercaseElement = document.getElementById('req-uppercase');
    const lowercaseElement = document.getElementById('req-lowercase');
    const numberElement = document.getElementById('req-number');
    const specialElement = document.getElementById('req-special');

    // update length requirement
    lengthElement.classList.toggle('valid', requirements.length);
    lengthElement.innerHTML = requirements.length 
        ? '✓ At least 10 characters' 
        : `✗ At least 10 characters (${password.length}/10)`;

    // update uppercase requirement
    uppercaseElement.classList.toggle('valid', requirements.uppercase);
    uppercaseElement.innerHTML = requirements.uppercase 
        ? '✓ One uppercase letter' 
        : '✗ One uppercase letter';

    // update lowercase requirement
    lowercaseElement.classList.toggle('valid', requirements.lowercase);
    lowercaseElement.innerHTML = requirements.lowercase 
        ? '✓ One lowercase letter' 
        : '✗ One lowercase letter';

    // update number requirement
    numberElement.classList.toggle('valid', requirements.number);
    numberElement.innerHTML = requirements.number 
        ? '✓ One number' 
        : '✗ One number';

    // update special character requirement
    specialElement.classList.toggle('valid', requirements.special);
    specialElement.innerHTML = requirements.special 
        ? '✓ One special character (!@#$%^&*)' 
        : '✗ One special character (!@#$%^&*)';

    // add strength indicator
    const strength = Object.values(requirements).filter(req => req).length;
    const strengthText = document.getElementById('password-strength');
    if (strengthText) {
        strengthText.textContent = `Password Strength: ${strength}/5`;
        strengthText.className = `strength-indicator strength-${strength}`;
    }

    return Object.values(requirements).every(req => req);
}

// add password strength indicator to the form
document.addEventListener('DOMContentLoaded', function() {
    const passwordRequirements = document.querySelector('.password-requirements');
    const strengthIndicator = document.createElement('div');
    strengthIndicator.id = 'password-strength';
    strengthIndicator.className = 'strength-indicator';
    passwordRequirements.parentNode.insertBefore(strengthIndicator, passwordRequirements);
});

// captcha generation
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

let currentCaptcha = generateCaptcha();

function updateCaptcha() {
    currentCaptcha = generateCaptcha();
    document.getElementById('captcha-text').textContent = currentCaptcha;
}

// Initialize captcha
document.addEventListener('DOMContentLoaded', function() {
    updateCaptcha();
    document.getElementById('refresh-captcha').addEventListener('click', updateCaptcha);
});

// username validation
function validateUsername(username) {
    return /^[a-zA-Z0-9]{3,20}$/.test(username);
}

// update registration form handler
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const captchaInput = document.getElementById('captcha-input').value;

    // validate username
    if (!validateUsername(username)) {
        alert('Username must be 3-20 characters and contain only letters and numbers');
        return;
    }

    // validate password
    if (!validatePassword(password)) {
        alert('Password does not meet all requirements');
        return;
    }

    // check password match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    // validate captcha
    if (captchaInput.toLowerCase() !== currentCaptcha.toLowerCase()) {
        alert('Incorrect captcha code');
        updateCaptcha();
        return;
    }

    try {
        // send registration request to backend
        const response = await fetch('http://localhost:8000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        // store username and show success screen
        localStorage.setItem('username', username);
        showSuccessScreen(username);
    } catch (error) {
        alert(error.message);
    }
});

// add password matching validation on input
document.getElementById('confirm-password').addEventListener('input', function(e) {
    const password = document.getElementById('new-password').value;
    const confirmPassword = e.target.value;
    
    if (password !== confirmPassword) {
        e.target.setCustomValidity('Passwords do not match');
    } else {
        e.target.setCustomValidity('');
    }
});

// add password validation on input
document.getElementById('new-password').addEventListener('input', function(e) {
    validatePassword(e.target.value);
});

function showSuccessScreen(username) {
    // store username and show home screen directly
    localStorage.setItem('username', username);
    showHome();
    document.getElementById('display-username').textContent = username;
}

function startAsGuest() {
    localStorage.setItem('username', 'Guest');
    showHome();
    document.getElementById('display-username').textContent = 'Guest';
}

document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    if (username) {
        showHome();
        document.getElementById('display-username').textContent = username;
    } else {
        showLogin();
    }
});

// game logic
function showLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    const loadingMessage = document.querySelector('.loading-message');
    const progressContainer = document.querySelector('.progress-container');
    
    // remove stats display if it exists
    const statsDisplay = document.querySelector('.loading-stats');
    if (statsDisplay) {
        statsDisplay.remove();
    }
    
    loadingScreen.classList.remove('hidden');
    loadingMessage.textContent = 'Generating Level...';
    updateProgress(0);
}

function hideLoadingScreen() {
    document.querySelector('.loading-screen').classList.add('hidden');
}

function updateProgress(percent) {
    const fill = document.querySelector('.progress-fill');
    const text = document.querySelector('.progress-text');
    fill.style.width = `${percent}%`;
    text.textContent = `${percent}%`;
}

function updateLevelDisplay() {
    document.getElementById('current-level').textContent = currentLevel;
}

function calculateScore() {
    const timeElapsed = Date.now() - levelStartTime;
    if (timeElapsed >= TIME_LIMIT) return 100; // Minimum score
    
    // calculate the percentage of time remaining
    const timeRemaining = TIME_LIMIT - timeElapsed;
    const timePercentage = timeRemaining / TIME_LIMIT;
    
    // scale score from 1000 to 100 based on time percentage
    // use a more gradual curve for better scoring
    const score = 100 + (Math.pow(timePercentage, 0.4) * 900); // 900 is the range between max and min score
    return Math.round(score);
}

async function loadLevel(level) {
    showLoadingScreen();
    updateProgress(0);
    
    try {
        const response = await fetch(`http://localhost:8000/generate?level=${level}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Simulate progress updates while waiting for response
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress = Math.min(progress + 5, 90);
            updateProgress(progress);
        }, 100);

        const data = await response.json();
        clearInterval(progressInterval);
        
        currentOriginalIndex = data.original_index;
        
        // Initialize the grid with the loaded images
        initializeGameGrid(data.images, data.grid_size);
        
        // Update progress to 100% when level is loaded
        updateProgress(100);
        
        // Start preloading next level
        preloadNextLevel(level + 1);
        
        // wait for images to be visible before starting timer
        await new Promise(resolve => setTimeout(resolve, 1000));
        levelStartTime = Date.now();
        
        return data;
    } catch (error) {
        console.error('Error loading level:', error);
        throw error;
    } finally {
        setTimeout(hideLoadingScreen, 500);
    }
}

async function preloadNextLevel(level) {
    if (isPreloading) return;
    isPreloading = true;
    
    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ level })
        });
        
        if (!response.ok) {
            throw new Error('Failed to preload level');
        }
        
        const data = await response.json();
        nextLevelImages = data.images;
    } catch (error) {
        console.error('Error preloading level:', error);
    } finally {
        isPreloading = false;
    }
}

async function startGame() {
    currentLevel = 1;
    score = 0;
    correctAnswers = 0;
    updateScore();
    updateLevelDisplay();
    
    // Ensure game over section is hidden
    document.getElementById('game-over-section').classList.remove('active');
    document.getElementById('game-section').classList.add('active');
    
    await loadLevel(currentLevel);
}

async function nextLevel() {
    try {
        const response = await fetch(`http://localhost:8000/generate?level=${currentLevel}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Simulate progress updates while waiting for response
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress = Math.min(progress + 5, 90);
            updateProgress(progress);
        }, 100);

        const data = await response.json();
        clearInterval(progressInterval);
        
        currentOriginalIndex = data.original_index;
        
        // Initialize the grid with the loaded images
        initializeGameGrid(data.images, data.grid_size);
        
        // Update progress to 100% when level is loaded
        updateProgress(100);
        
        // Start preloading next level
        preloadNextLevel(currentLevel + 1);
        
        // Record start time for scoring AFTER images are visible
        levelStartTime = Date.now();
        
        return data;
    } catch (error) {
        console.error('Error loading level:', error);
        throw error;
    } finally {
        setTimeout(hideLoadingScreen, 500);
    }
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        endGame();
        return;
    }

    const question = questions[currentQuestionIndex];
    questionText.textContent = question.question;

    // Clear previous clue
    const clueText = document.getElementById('clue-text');
    clueText.textContent = '';
    clueText.classList.remove('show');

    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option.text;
        optionElement.onclick = () => selectOption(index);
        optionsContainer.appendChild(optionElement);
    });
}

function selectOption(optionIndex) {
    const question = questions[currentQuestionIndex];
    const selectedOption = question.options[optionIndex];
    
    feedbackElement.textContent = selectedOption.isCorrect ? 'Correct!' : 'Incorrect!';
    feedbackElement.className = `feedback ${selectedOption.isCorrect ? 'correct' : 'incorrect'}`;
    
    if (selectedOption.isCorrect) {
        score += 10;
        correctAnswers++;
        updateScore();
    }
    
    setTimeout(() => {
        currentQuestionIndex++;
        loadQuestion();
    }, 1500);
}

function updateScore() {
    scoreElement.textContent = score;
}

async function endGame() {
    if (currentUser) {
        await updateLeaderboard();
    }
    showLeaderboard();
}

async function updateLeaderboard() {
    try {
        const username = localStorage.getItem('username');
        const response = await fetch(`http://localhost:8000/leaderboard${username ? `?username=${username}` : ''}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }
        
        leaderboardCache = await response.json();
        lastLeaderboardUpdate = Date.now();
        updateLeaderboardDisplay();
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

function hideAllSections() {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('.typewriter');
  setTimeout(() => {
    title.classList.add('done');
  }, 3000); // match the duration of typing animation
});

function showClue() {
  const clues = [
    "Look for unnatural skin textures or mismatched lighting.",
    "Pay attention to the eyes—they're often inconsistent.",
    "Backgrounds sometimes blur weirdly in deepfakes.",
    "Hair edges or shadows may appear distorted.",
    "Facial symmetry can be off—check for weird proportions."
  ];

  const clue = clues[currentQuestionIndex % clues.length];
  const clueText = document.getElementById('clue-text');
  clueText.textContent = clue;
  clueText.classList.add('show');
}

function initializeGameGrid(images, gridSize) {
    const gridContainer = document.getElementById('gridContainer');
    
    // Clear previous grid
    gridContainer.innerHTML = '';
    
    // Set up grid layout
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    // Create and append images
    images.forEach((base64Image, index) => {
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${base64Image}`;
        img.className = 'grid-item';
        img.alt = `Image ${index + 1}`;
        img.onclick = () => selectImage(index);
        gridContainer.appendChild(img);
    });
}

async function showGameOver() {
    // Hide game section and show game over section
    document.getElementById('game-section').classList.remove('active');
    document.getElementById('game-over-section').classList.add('active');
    
    // Update final stats display
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-level').textContent = currentLevel;
    document.getElementById('correct-answers').textContent = correctAnswers;
    
    // Update database with final stats
    const username = localStorage.getItem('username');
    if (username && username !== 'Guest') {
        try {
            await fetch('http://localhost:8000/update-stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${username}`
                },
                body: JSON.stringify({
                    score: score,
                    level: currentLevel,
                    is_correct: false
                })
            });
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }
}

function showLoadingScreenWithStats(pointsEarned, timeElapsed) {
    const loadingScreen = document.querySelector('.loading-screen');
    const loadingMessage = document.querySelector('.loading-message');
    const progressContainer = document.querySelector('.progress-container');
    
    let statsDisplay = document.querySelector('.loading-stats');
    if (!statsDisplay) {
        statsDisplay = document.createElement('div');
        statsDisplay.className = 'loading-stats';
        progressContainer.appendChild(statsDisplay);
    }
    
    const seconds = Math.floor(timeElapsed / 1000);
    const milliseconds = timeElapsed % 1000;
    const timeString = `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
    
    statsDisplay.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Time:</span>
            <span class="stat-value">${timeString}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Points Earned:</span>
            <span class="stat-value">${pointsEarned}</span>
        </div>
    `;
    
    loadingScreen.classList.remove('hidden');
    loadingMessage.textContent = 'Nice! Generating next level...';
    updateProgress(0);
}

async function selectImage(index) {
    const images = document.querySelectorAll('.grid-item');
    
    if (selectedImageIndex !== -1) {
        images[selectedImageIndex].classList.remove('selected', 'wrong');
    }
    
    selectedImageIndex = index;
    images[index].classList.add('selected');
    
    if (index === currentOriginalIndex) {
        const pointsEarned = calculateScore();
        const timeElapsed = Date.now() - levelStartTime;
        
        // show loading screen with stats immediately
        showLoadingScreenWithStats(pointsEarned, timeElapsed);
        
        // update score and stats
        score += pointsEarned;
        correctAnswers++;
        updateScore();
        
        // update stats in database if user is logged in
        const username = localStorage.getItem('username');
        if (username && username !== 'Guest') {
            try {
                const response = await fetch('http://localhost:8000/update-stats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${username}`
                    },
                    body: JSON.stringify({
                        score: pointsEarned,
                        level: currentLevel,
                        is_correct: true
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 401) {
                        console.error('Authentication error:', errorData.detail);
                        localStorage.removeItem('username');
                    } else {
                        throw new Error(errorData.detail || 'Failed to update stats');
                    }
                }
            } catch (error) {
                console.error('Failed to update stats:', error);
            }
        }
        
        currentLevel++;
        updateLevelDisplay();
        await nextLevel();
    } else {
        images[index].classList.add('wrong');
        images[currentOriginalIndex].classList.add('selected');
        
        showGameOver();
    }
}

// theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    preloadLeaderboard(); // preload leaderboard data
});

// preload leaderboard data
async function preloadLeaderboard() {
    try {
        const username = localStorage.getItem('username');
        const response = await fetch(`http://localhost:8000/leaderboard${username ? `?username=${username}` : ''}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }
        
        leaderboardCache = await response.json();
        lastLeaderboardUpdate = Date.now();
        updateLeaderboardDisplay();
    } catch (error) {
        console.error('Error preloading leaderboard:', error);
    }
}

// update leaderboard display with cached data
function updateLeaderboardDisplay() {
    if (!leaderboardCache) return;

    const tbody = document.querySelector('#leaderboard-body');
    tbody.innerHTML = '';
    
    // add top 10 
    leaderboardCache.top_10.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.username}</td>
            <td>${entry.highest_score}</td>
            <td>${entry.highest_level}</td>
        `;
        tbody.appendChild(row);
    });
    
    // update user rank display if available
    const userRankDisplay = document.getElementById('user-rank-display');
    if (leaderboardCache.user_rank) {
        userRankDisplay.style.display = 'block';
        document.getElementById('user-rank').textContent = leaderboardCache.user_rank.rank;
        document.getElementById('user-score').textContent = leaderboardCache.user_rank.highest_score;
        document.getElementById('user-level').textContent = leaderboardCache.user_rank.highest_level;
    } else {
        userRankDisplay.style.display = 'none';
    }
}
