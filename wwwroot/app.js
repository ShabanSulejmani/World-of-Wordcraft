// Globala variabler
let scrambledLetters = ""; // Blandade bokstäver
let guessedWord = ""; // Det spelaren gissar
let wordToGuess = ""; // Rätt ord
let score = 0; // Poäng
let totalScore = 0;
let timeLeft = 45; // Total tid
let timer; // Timer-instans
let currentRound = 1;
let guessedWordsThisRound = 0;
const totalRounds = 3;
const requiredCorrectWords = 3;
let hintUsed = false;
document.getElementById("useHintBtn").addEventListener("click", hint);


// Hämta ett ord och visa scrambled letters
async function getOneWord() {
    let round = currentRound;
    
    const response = await fetch(`/api/getrandomword/${round}`);
    const data = await response.json();
    wordToGuess = data.word.toUpperCase(); // Spara det rätta ordet
    scrambledLetters = shuffleWord(wordToGuess).toUpperCase(); // Shufflade bokstäver
    console.log(`Rätt ord är: ${wordToGuess}`); // Logga ordet i konsolen

    // Uppdatera gränssnittet
    document.querySelector(".underscore").textContent = generateUnderlines(wordToGuess);
    
    populateLetterButtons(scrambledLetters);
}

// Shuffla bokstäverna
function shuffleWord(word) {
    let letters = word.split("");
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join("");
}

// Skapa understreck för ordet
function generateUnderlines(word) {
    return word.split("").map(() => "_").join(" ");
}

// Skapa dynamiska bokstavsknappar
function populateLetterButtons(letters) {
    const lettersContainer = document.getElementById("letters");
    lettersContainer.innerHTML = ""; // Töm tidigare bokstäver
    letters.split("").forEach(letter => {
        const button = document.createElement("button");
        button.textContent = letter;
        button.classList.add("letter");
        button.addEventListener("click", () => handleLetterClick(button));
        lettersContainer.appendChild(button);
    });
}
// Hantera klick på en bokstav
function handleLetterClick(button) {
    const letter = button.textContent;

    // Om bokstaven redan är vald, ta bort den
    if (button.classList.contains("selected")) {
        guessedWord = guessedWord.slice(0, guessedWord.lastIndexOf(letter))
            + guessedWord.slice(guessedWord.lastIndexOf(letter) + 1);
        button.disabled = false; // Aktivera knappen igen
        button.classList.remove("selected");
        updateUnderscoreDisplay(); // Uppdatera understrecken
        return; // Avsluta funktionen
    }

    // Lägg till bokstaven om plats finns
    if (guessedWord.length < wordToGuess.length) {
        guessedWord += letter; // Lägg till bokstaven i spelarens gissning
        updateUnderscoreDisplay();
        button.disabled = true; // Inaktivera knappen
        button.classList.add("selected"); // Markera knappen som vald
        updateUnderscoreDisplay(); // Uppdatera understrecken
    }

    if (guessedWord.length === wordToGuess.length) {
        checkWord();
    }
}

// Uppdatera visningen av understreck
function updateUnderscoreDisplay() {
    const underscores = wordToGuess
        .split("")
        .map((char, index) => (guessedWord[index] || (index === 0 && hintLetter) || "_")) // Visa första bokstaven om hint används
        .join(" ");
    document.querySelector(".underscore").textContent = underscores;
}


// Kontrollera om gissningen är korrekt
function checkWord() {
    const reversedWord = wordToGuess.split("").reverse().join(""); // Skapa baklängesversion av ordet

    if (guessedWord === wordToGuess && timeLeft > 0) {
        let roundScore = guessedWord.length;
        if (!hintUsed) {
            roundScore += 10; // Lägg till 10 poäng om ingen hint användes
        }
        score += roundScore; // Lägg till poäng för rundan
        totalScore += score; // Uppdatera totalpoängen
        localStorage.setItem("totalScore", totalScore);
        guessedWordsThisRound++; // Öka antal gissade ord för denna runda
        updateScoreDisplay();

        hintUsed = false; // Återställ flaggan för nästa ord
        guessedWord = ""; // Återställ spelarens gissning

        if (guessedWordsThisRound === requiredCorrectWords) {
            alert("Du har klarat 3 ord. Fortsätt gissa tills tiden tar slut!");
        }
        continueGame();
    } else if (guessedWord === reversedWord && timeLeft > 0) {
        // Extra twist: Om gissningen är baklänges
        score += 50; // Ge 50 extra poäng
        totalScore += score; // Uppdatera totalpoängen
        guessedWordsThisRound++; // Öka antal gissade ord för denna runda
        updateScoreDisplay();
        showEasterEgg(); // Visa "easter egg"-animation eller text

        hintUsed = false; // Återställ flaggan för nästa ord
        guessedWord = ""; // Återställ spelarens gissning

        if (guessedWordsThisRound === requiredCorrectWords) {
            alert("Du har klarat 3 ord. Fortsätt gissa tills tiden tar slut!");
        }
        continueGame();
    } else if (guessedWord !== wordToGuess && guessedWord.length === wordToGuess.length) {
        alert("Fel ord!");
        resetGame(); // Återställ gissningen för att försöka igen
    }
}

// Funktion för att visa "easter egg" visuellt
function showEasterEgg() {
    const easterEggElement = document.getElementById("easter-egg");
    easterEggElement.style.display = "block"; // Visa "easter egg"
    easterEggElement.textContent = "Easter Egg! Du gissade ordet baklänges!";

    // Gör så att det försvinner efter några sekunder
    setTimeout(() => {
        easterEggElement.style.display = "none"; // Göm efter 3 sekunder
    }, 3000);
}

// avsluta en runda
function endRound() {
    clearInterval(timer);
    totalScore += score; // lägg till rundans poäng till totalpoäng
    localStorage.setItem("totalScore", totalScore);
    updateScoreDisplay(); // uppdatera visning av poäng
    
    if (guessedWordsThisRound >= requiredCorrectWords){
        if (currentRound < totalRounds){
            alert(`Runda ${currentRound} klar! Du går vidare till nästa runda.`)
            currentRound++;
            guessedWordsThisRound = 0;
            startGame();
        }else{
            endGame(true); // Alla rundor klara, vinst
        }
    }else{
        endGame(false); // förlust om spelaren inte klarar 3 ord
    }
}

// Uppdatera visningen av rundan
function updateRoundDisplay() {
    document.getElementById("round").textContent = `Runda: ${currentRound}`;
}

// Starta spelet
async function startGame() {
    guessedWord = ""; // Töm spelarens gissning
    guessedWordsThisRound = 0; // nollställ gissade ord
    updateRoundDisplay();
    updateScoreDisplay(); // visa poäng som 0
    await getOneWord(); // Hämta ett ord från API
    startTimer(); // Starta timern
}

async function continueGame() {
    guessedWord = ""; // Töm spelarens gissning
    score = 0;
    await getOneWord(); // Hämta ett ord från API
    document.querySelector(".underscore").textContent = generateUnderlines(wordToGuess); // Visa understreck
    updateScoreDisplay();
}

// Starta timern
function startTimer() {
    const timerElement = document.getElementById("epic-time-left");
    clearInterval(timer); // Rensa eventuell tidigare timer
    timeLeft = 45; // Återställ tiden
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            timerElement.textContent = timeLeft;

            // Ändra färg och animera när tiden är låg
            if (timeLeft <= 10) {
                timerElement.style.color = "red";
                timerElement.style.animation = "flash 1s infinite";
            }
        } else {
            clearInterval(timer);
            alert("Tiden är slut!");
            alert(`Rätt ord var: ${wordToGuess}`)
            endRound();
            //endGame(true);
        }
    }, 1000);
}

async function saveHighscore() {
    const playerName = localStorage.getItem("playerName");
    const faction = localStorage.getItem("faction");
    totalScore = parseInt(localStorage.getItem("totalScore"));
    
    if (!playerName || !faction) {
        alert("Spelarnamn eller faction saknas. Kan inte spara highscore");
        return;
    }
    
    try {
        const response = await fetch("api/savehighscore", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                playerName: playerName,
                faction: faction,
                score: totalScore,
            }),
        });

        if (!response.ok) {
            throw new Error("Misslyckades med att spara highscore");
        }

        const result = await response.text();
        console.log(result);
        alert("Highscore sparat");
    }catch(error) {
        console.error("Fel vid sparande av highscore:", error);
        alert("Ett fel uppstod när highscore skulle sparas.");
    }
}

function updateScoreDisplay() {
    document.getElementById("score").textContent = `Poäng: ${totalScore}`;
}

// Avsluta spelet
function endGame(won) {
    localStorage.setItem("totalScore", totalScore);
    clearInterval(timer);
    
    if (won) {
        alert(`Grattis! Du fick ${totalScore} poäng!`);
        saveHighscore(totalScore);
    } else {
        alert(`Du kom till runda ${currentRound} och fick ${totalScore} poäng`);
        saveHighscore(totalScore);
    }
    guessedWord = "";
    currentRound = 1;
    guessedWordsThisRound = 0;
    totalScore = 0;
    updateScoreDisplay();
    localStorage.setItem("totalScore", totalScore);
    document.getElementById("startEpicTimerBtn").style.display = "block";
}

// Återställ spelet
function resetGame() {
    guessedWord = "";
    document.querySelector(".underscore").textContent = generateUnderlines(wordToGuess);
    populateLetterButtons(scrambledLetters);
}

// Hantera tangentbordsinmatning
document.addEventListener("keydown", (event) => {
    const guessedLetter = event.key.toUpperCase();
    if (scrambledLetters.includes(guessedLetter) && guessedWord.length < wordToGuess.length) {
        const button = Array.from(document.querySelectorAll(".letter")).find(
            el => el.textContent === guessedLetter && !el.disabled
        );
        if (button) handleLetterClick(button);
    }
});

// Hantera namn och fraktion
function saveName(faction) {
    const nameInput = faction === 'alliance'
        ? document.getElementById('player-name-alliance').value
        : document.getElementById('player-name-horde').value;

    if (nameInput.trim() === "") {
        alert("Vänligen ange ett namn.");
        return;
    }

    localStorage.setItem("playerName", nameInput);
    localStorage.setItem("faction", faction);
    window.location.href = "gameplay.html";
}

document.getElementById("startEpicTimerBtn").addEventListener("click", function() {
    const blurOverlay = document.getElementById("blur-overlay");

    // Ta bort blur-effekten och starta spelet
    blurOverlay.style.opacity = "0";
    setTimeout(() => {
        blurOverlay.style.display = "none";
        startGame();  // OBS: Kallar den korrekta startGame()-funktionen
    }, 500);
});


function hint() {
    const hintLetter = wordToGuess[0]; // Första bokstaven i ordet

    // Kolla om bokstaven redan används i gissningen
    if (!guessedWord.includes(hintLetter)) {
        guessedWord = hintLetter + guessedWord.slice(1); // Sätt första bokstaven som en ledtråd
        hintUsed = true;

        // Hitta och ta bort den första knappen med hintLetter
        const button = Array.from(document.querySelectorAll(".letter")).find(
            el => el.textContent === hintLetter && !el.disabled
        );
        if (button) {
            button.disabled = true; // Inaktivera knappen
            button.classList.add("selected"); // Markera som vald
            button.style.backgroundColor = "gray"; // Ändra färg så att den ser inaktiverad ut
        }
    }
    updateUnderscoreDisplay(); // Uppdatera displayen med ledtråden
}

document.addEventListener("keydown", (event) => {
    // Om Backspace trycks ner, ångra senaste bokstaven
    if (event.key === "Backspace") {
        if (guessedWord.length > 0) {
            // Ta bort senaste bokstaven från gissningen
            const lastLetter = guessedWord[guessedWord.length - 1];
            guessedWord = guessedWord.slice(0, -1);

            // Hitta den tillhörande knappen och återaktivera den
            const button = Array.from(document.querySelectorAll(".letter")).find(
                el => el.textContent === lastLetter && el.disabled
            );
            if (button) {
                button.disabled = false; // Aktivera knappen igen
                button.classList.remove("selected"); // Ta bort markeringsklass
            }

            // Uppdatera visningen av understreck
            updateUnderscoreDisplay();
        }
        event.preventDefault(); // Förhindra standardfunktion för Backspace
        return;
    }
    
});

 // Hantera klick på en bokstav och markera korrekt gissad bokstav som grön
function handleLetterClick(button) {
    const letter = button.textContent;

    // Om bokstaven redan är vald, ta bort den
    if (button.classList.contains("selected")) {
        guessedWord = guessedWord.slice(0, guessedWord.lastIndexOf(letter))
            + guessedWord.slice(guessedWord.lastIndexOf(letter) + 1);
        button.disabled = false; // Aktivera knappen igen
        button.classList.remove("selected");
        button.style.backgroundColor = ""; // Återställ färgen
        updateUnderscoreDisplay(); // Uppdatera understrecken
        return; // Avsluta funktionen
    }

    // Lägg till bokstaven om plats finns
    if (guessedWord.length < wordToGuess.length) {
        guessedWord += letter; // Lägg till bokstaven i spelarens gissning
        updateUnderscoreDisplay();
        button.disabled = true; // Inaktivera knappen
        button.classList.add("selected"); // Markera knappen som vald

        // Kontrollera om bokstaven är på rätt plats
        if (wordToGuess[guessedWord.length - 1] === letter) {
            button.style.backgroundColor = "green"; // Markera korrekt bokstav med grönt
        }

        if (guessedWord.length === wordToGuess.length) {
            checkWord();
        }
    }
}

