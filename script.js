// game state
let currentUser = null;
let score = 0;
let currentQuestionIndex = 0;

// sample questions
const questions = [
    {
        question: "Which image shows signs of being a deepfake?",
        options: [
            { text: "Image A", isCorrect: true },
            { text: "Image B", isCorrect: false },
            { text: "Image C", isCorrect: false },
            { text: "Image D", isCorrect: false }
        ]
    },
    // Add more questions here
];

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
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    // Store username
    localStorage.setItem('username', username);
    // Show home screen instead of game
    showHome();
    // Update username display
    document.getElementById('display-username').textContent = username;
});

// Password validation with detailed feedback
function validatePassword(password) {
    const requirements = {
        length: password.length >= 10,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*]/.test(password)
    };

    // Update visual indicators with detailed feedback
    const lengthElement = document.getElementById('req-length');
    const uppercaseElement = document.getElementById('req-uppercase');
    const lowercaseElement = document.getElementById('req-lowercase');
    const numberElement = document.getElementById('req-number');
    const specialElement = document.getElementById('req-special');

    // Update length requirement
    lengthElement.classList.toggle('valid', requirements.length);
    lengthElement.innerHTML = requirements.length 
        ? '✓ At least 10 characters' 
        : `✗ At least 10 characters (${password.length}/10)`;

    // Update uppercase requirement
    uppercaseElement.classList.toggle('valid', requirements.uppercase);
    uppercaseElement.innerHTML = requirements.uppercase 
        ? '✓ One uppercase letter' 
        : '✗ One uppercase letter';

    // Update lowercase requirement
    lowercaseElement.classList.toggle('valid', requirements.lowercase);
    lowercaseElement.innerHTML = requirements.lowercase 
        ? '✓ One lowercase letter' 
        : '✗ One lowercase letter';

    // Update number requirement
    numberElement.classList.toggle('valid', requirements.number);
    numberElement.innerHTML = requirements.number 
        ? '✓ One number' 
        : '✗ One number';

    // Update special character requirement
    specialElement.classList.toggle('valid', requirements.special);
    specialElement.innerHTML = requirements.special 
        ? '✓ One special character (!@#$%^&*)' 
        : '✗ One special character (!@#$%^&*)';

    // Add strength indicator
    const strength = Object.values(requirements).filter(req => req).length;
    const strengthText = document.getElementById('password-strength');
    if (strengthText) {
        strengthText.textContent = `Password Strength: ${strength}/5`;
        strengthText.className = `strength-indicator strength-${strength}`;
    }

    return Object.values(requirements).every(req => req);
}

// Add password strength indicator to the form
document.addEventListener('DOMContentLoaded', function() {
    const passwordRequirements = document.querySelector('.password-requirements');
    const strengthIndicator = document.createElement('div');
    strengthIndicator.id = 'password-strength';
    strengthIndicator.className = 'strength-indicator';
    passwordRequirements.parentNode.insertBefore(strengthIndicator, passwordRequirements);
});

// Captcha generation
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

// Username validation
function validateUsername(username) {
    return /^[a-zA-Z0-9]{3,20}$/.test(username);
}

// Update registration form handler
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const captchaInput = document.getElementById('captcha-input').value;

    // Validate username
    if (!validateUsername(username)) {
        alert('Username must be 3-20 characters and contain only letters and numbers');
        return;
    }

    // Validate password
    if (!validatePassword(password)) {
        alert('Password does not meet all requirements');
        return;
    }

    // Check password match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    // Validate captcha
    if (captchaInput.toLowerCase() !== currentCaptcha.toLowerCase()) {
        alert('Incorrect captcha code');
        updateCaptcha();
        return;
    }

    // Show success screen
    showSuccessScreen(username);
});

// Add password matching validation on input
document.getElementById('confirm-password').addEventListener('input', function(e) {
    const password = document.getElementById('new-password').value;
    const confirmPassword = e.target.value;
    
    if (password !== confirmPassword) {
        e.target.setCustomValidity('Passwords do not match');
    } else {
        e.target.setCustomValidity('');
    }
});

// Add password validation on input
document.getElementById('new-password').addEventListener('input', function(e) {
    validatePassword(e.target.value);
});

function showSuccessScreen(username) {
    // Create success screen if it doesn't exist
    if (!document.getElementById('success-section')) {
        const successSection = document.createElement('div');
        successSection.id = 'success-section';
        successSection.className = 'section';
        successSection.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <h2>Detective Profile Created!</h2>
                <p>Welcome to the investigation, ${username}!</p>
                <button class="btn" onclick="showHome()">Start Playing</button>
            </div>
        `;
        document.querySelector('main').appendChild(successSection);
    }

    // Show success screen
    hideAllSections();
    document.getElementById('success-section').classList.add('active');
    document.getElementById('home-button').style.display = 'flex';
}

function startAsGuest() {
    localStorage.setItem('username', 'Guest');
    showHome();
    document.getElementById('display-username').textContent = 'Guest';
}

// Check if user is logged in on page load
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
function startGame() {
    score = 0;
    currentQuestionIndex = 0;
    updateScore();
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        endGame();
        return;
    }

    const question = questions[currentQuestionIndex];
    questionText.textContent = question.question;
    
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

function endGame() {
    if (currentUser) {
        // save score to da backend
        updateLeaderboard();
    }
    showLeaderboard();
}

function updateLeaderboard() {
    // fetch leaderboard from da backend
    const leaderboard = [
        { username: 'Player1', score: 100 },
        { username: 'Player2', score: 90 },
        { username: 'Player3', score: 80 }
    ];

    const tbody = document.querySelector('#leaderboard tbody');
    tbody.innerHTML = '';
    
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.username}</td>
            <td>${entry.score}</td>
        `;
        tbody.appendChild(row);
    });
}

function hideAllSections() {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
} 