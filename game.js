const levels = {1: 2, 2: 3, 3: 4, 4: 6, 5: 8}; // dictionary stores the number of images for each level
let currentLevel = 1;

function loadLevel() {
    const imageContainer = document.getElementById("image-container");
    imageContainer.innerHTML = ""; // clears any previous images
    document.getElementById("level").textContext = currentLevel;

    let numImages = levels[currentLevel]; // gets the corresponding number of images for da level
    let realImageIndex = Math.floor(Math.random() * numImages); // randomizes the location of the real image

    for (let i=0; i<numImages; i++) {
        let img = document.createElement("img");
        img.src = i === realImageIndex ? `level${currentLevel}.real.jpg` : `level${currentLevel}deepfake${i}.jpg`;
        img.onclick = () => checkAnswer(i === realImageIndex);
        imageContainer.appendChild(img);
    }
}

function checkAnswer(isCorrect) {
    document.getElementsById("feedback").textContext = isCorrect ? "Yipppeeeee! YOU DID IT" : "WOMP WOMP!";
    document.getElementById("next-level").style.display = isCorrect ? "block" : "none";
}

document.getElementById("next-level").addEventListener("click", () => {
    if(levels[currentLevel+1]) { // checks if there are still morelevels to play
        currentLevel++;
        loadLevel();
        document.getElementById("next-level").style.display = "none";
        document.getElementById("feedback").textContent = "";
    } else {
        alert("WOOHOOOO YOU DID IT! You beat all 5 levels!");
    }
});

loadLevel();