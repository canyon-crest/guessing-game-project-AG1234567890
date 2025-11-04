const dateEl = document.getElementById("date");
const playBtn = document.getElementById("playBtn");
const guessBtn = document.getElementById("guessBtn");
const giveUpBtn = document.getElementById("giveUpBtn");
const hintBtn = document.getElementById("hintBtn");
const msg = document.getElementById("msg");
const guess = document.getElementById("guess");
const wins = document.getElementById("wins");
const avgScore = document.getElementById("avgScore");
const levelArr = document.getElementsByName("level");

const fastestEl = document.getElementById("fastest");
const avgTimeEl = document.getElementById("avgTime");
const currentTimerEl = document.getElementById("currentTime");
const globalTimerEl = document.getElementById("globalTimer");

const bigPrime1 = 	6791
const bigPrime2 = 5471
const bigPrime3 = 6011

let answer, level, score;
let scoreArr = [];
let userName = "";
let startTime, totalTime = 0, gamesPlayed = 0;
let fastestTime = Infinity;
let leaderboard = [100, 100, 100];
let roundTimer, globalTimer;
let globalActive = false;
let globalStart = 0;


while (!userName) {
  userName = prompt("Enter your name:");
  if (userName) {
    userName = userName.trim();
    userName = userName.charAt(0).toUpperCase() + userName.slice(1).toLowerCase();
  }
}
msg.textContent = `Welcome, ${userName}! Select a level to start.`;


function time() {
  const d = new Date();
  const day = d.getDate();
  const monthName = d.toLocaleString("default", { month: "long" });
  const suffix = (n) => {
    if (n >= 11 && n <= 13) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };
  return `${monthName} ${day}${suffix(day)}, ${d.getFullYear()}, ${d.toLocaleTimeString()}`;
}

function updateDateTime() {
  dateEl.textContent = time();
}
setInterval(updateDateTime, 1000);
updateDateTime();


playBtn.addEventListener("click", play);
guessBtn.addEventListener("click", makeGuess);
giveUpBtn.addEventListener("click", giveUp);
hintBtn.addEventListener("click", giveHint);


function play() {
  playBtn.disabled = true;
  guessBtn.disabled = false;
  giveUpBtn.disabled = false;
  hintBtn.disabled = false;
  guess.disabled = false;

  for (let i = 0; i < levelArr.length; i++) {
    levelArr[i].disabled = true;
    if (levelArr[i].checked) level = parseInt(levelArr[i].value);
  }
  if (document.getElementById("customMax").value)
  level = parseInt(document.getElementById("customMax").value);


  answer = Math.floor(Math.random() * level) + 1;
  score = 0;
  startTime = Date.now();
  msg.style.color = "black";
  msg.textContent = `${userName}, guess a number between 1 and ${level}.`;
  guess.value = "";
  guess.focus();

  startLiveTimer();
  startGlobalTimer();
}

function makeGuess() {
  const userGuess = parseInt(guess.value);
  if (isNaN(userGuess) || userGuess < 1 || userGuess > level) {
    msg.textContent = "❌ Invalid input! Enter a number within range.";
    return;
  }

  score++;
  const diff = Math.abs(answer - userGuess);
  let feedback = "";

  if (diff === 0) {
    const endMs = Date.now();
    stopLiveTimer();
    stopGlobalTimer();

    const optimalGuesses = Math.ceil(Math.log2(level) - 1);
    msg.style.color = "green";
    msg.textContent = `Correct, ${userName}! You won in ${score} tries — ${getScoreQuality(score, level)}
     An optimal AI would have needed ~${optimalGuesses} guesses.`;

    updateScore(score);
    updateLeaderboard(score);
    updateTimers(endMs);
    reset();
    return;
  }

  if (diff <= 2) {
    feedback = "🔥 Hot!";
    msg.style.color = "red";
  } else if (diff <= 5) {
    feedback = "Warm";
    msg.style.color = "orange";
  } else {
    feedback = "❄️ Cold";
    msg.style.color = "blue";
  }

  if (userGuess > answer) msg.textContent = `${feedback} Too high!`;
  else msg.textContent = `${feedback} Too low!`;
}

function giveUp() {
  const endMs = Date.now();
  stopLiveTimer();
  stopGlobalTimer();

  msg.style.color = "gray";
  msg.textContent = `😞😞😞😞😞 You gave up, ${userName}! The number was ${answer}. Score: Terrible never play again`;
  score = level; 
  updateScore(score);
  updateLeaderboard(score);
  updateTimers(endMs);
  reset();
}

function reset() {
  guessBtn.disabled = true;
  giveUpBtn.disabled = true;
  hintBtn.disabled = true;
  playBtn.disabled = false;
  guess.disabled = true;
  guess.value = "";
  for (let i = 0; i < levelArr.length; i++) levelArr[i].disabled = false;
  stopLiveTimer();
}


let lastHint = "";

function giveHint() {

  hintBtn.classList.add("hint-active");
  setTimeout(() => hintBtn.classList.remove("hint-active"), 400);


  hintBtn.disabled = true;
  setTimeout(() => hintBtn.disabled = false, 750);

  const hints = [];


  hints.push(answer % 2 === 0 ? "The number is even." : "The number is odd.");
  if (isPrime(answer)) hints.push("The number is prime.");

  if (answer % 3 === 0) hints.push("The number is divisible by 3.");
  if (answer % 5 === 0) hints.push("The number is divisible by 5.");
  if (answer % 7 === 0) hints.push("The number is divisible by 7.");
    
  if (answer > level / 2) hints.push("The number is greater than half the range.");
  if (answer < level / 2) hints.push("The number is less than half the range.");


  hints.push(`The number ends with ${answer % 10}.`);


  const rangeWidth = Math.floor(level / 4);
  const low = Math.max(1, answer - Math.floor(rangeWidth / 2));
  const high = Math.min(level, answer + Math.floor(rangeWidth / 2));
 // hints.push(`The number is between ${low} and ${high}.`);


  if (Number.isInteger(Math.sqrt(answer))) hints.push("The number is a perfect square.");
  if (Number.isInteger(Math.cbrt(answer))) hints.push("The number is a perfect cube.");


  if (answer <= Math.floor(level * 0.25)) hints.push("The number is in the lower 25% of the range.");
  if (answer >= Math.floor(level * 0.75)) hints.push("The number is in the upper 25% of the range.");

  const digitSum = answer
    .toString()
    .split("")
    .reduce((a, b) => a + parseInt(b), 0);
  hints.push(`The sum of its digits is ${digitSum}.`);

  if (digitSum % 2 === 0 && answer % 2 !== 0)
    hints.push("It’s odd, but its digit sum is even.");
  if (digitSum % 2 !== 0 && answer % 2 === 0)
    hints.push("It’s even, but its digit sum is odd.");

  // mod remainder pattern
  const modN = [4, 6, 8, 9, 11][Math.floor(Math.random() * 5)];
  hints.push(`When divided by ${modN}, it leaves a remainder of ${answer % modN}.`);

  // factor-count hint
  const numFactors = countFactors(answer);
  hints.push(`It has exactly ${numFactors} factors.`);

  // palindrome hint
  if (answer.toString() === answer.toString().split("").reverse().join(""))
    hints.push("It’s a palindrome number ");

  // triangular number test
  if (isTriangular(answer))
    hints.push("The number is triangular");

  // fibonacci hint
  if (isFibonacci(answer))
    hints.push("The number appears in the Fibonacci sequence.");

  // binary hint
  const binaryForm = answer.toString(2);
  const onesCount = binaryForm.split("1").length - 1;
  hints.push(`Its binary form contains ${onesCount} ones.`);

  // square relation
  const sq = answer * answer;
  hints.push(`Its square ends with ${sq % 100}.`);

  // prime neighbor
  const nextP = nextPrime(answer);
  if (nextP)
    hints.push(`The next prime greater than this number is ${nextP}.`);


  const smallestFactor = getSmallestFactor(answer);
  if (smallestFactor && smallestFactor !== answer) {
    hints.push(`The smallest factor (besides 1) is ${smallestFactor}.`);
  }

  const power = Math.ceil(Math.random())*10+5
  const mod = Math.ceil(Math.random())*10
  hints.push(`This number raised to the ${power}th power is congruent to ${(answer**power)%mod} mod ${mod}`)

  
  const power2 = Math.ceil(Math.random())*50+25
  const mod2 = Math.ceil(Math.random())*100
  hints.push(`This number raised to the ${power2}th power is congruent to ${(answer**power2)%mod2} mod ${mod2}`)

  const power3 = Math.ceil(Math.random())*10+5
  const mod3 = Math.ceil(Math.random())*10
  hints.push(`This number raised to the ${power}th power is congruent to ${(answer**power)%mod3} mod ${mod3}`)

  hints.push(`This number multipled by three four digit primes is ${answer*bigPrime1*bigPrime2*bigPrime3}`)

  function countFactors(n) {
  let count = 0;
  for (let i = 1; i <= n; i++) if (n % i === 0) count++;
  return count;
}

function isTriangular(n) {
  // Solve n = k(k+1)/2 for integer k
  const k = Math.floor((Math.sqrt(8 * n + 1) - 1) / 2);
  return (k * (k + 1)) / 2 === n;
}

function isFibonacci(n) {
  // A number is Fibonacci if (5n^2 + 4) or (5n^2 - 4) is a perfect square
  const isSquare = (x) => Number.isInteger(Math.sqrt(x));
  return isSquare(5 * n * n + 4) || isSquare(5 * n * n - 4);
}

function nextPrime(n) {
  let x = n + 1;
  while (x < n + 1000) { // safety cap
    if (isPrime(x)) return x;
    x++;
  }
  return null;
}


  let randomHint = hints[Math.floor(Math.random() * hints.length)];
  let safetyCounter = 0;
  while (randomHint === lastHint && safetyCounter < 10) {
    randomHint = hints[Math.floor(Math.random() * hints.length)];
    safetyCounter++;
  }
  lastHint = randomHint;

  msg.textContent = `💡 Hint: ${randomHint}`;
  msg.classList.add("msg-flash");
  setTimeout(() => msg.classList.remove("msg-flash"), 600);
}
//

function getSmallestFactor(n) {
  if (n < 2) return null;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return i;
  }
  return null;
}

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}


function updateScore(newScore) {
  scoreArr.push(newScore);
  wins.textContent = `Total wins: ${scoreArr.length}`;
  const sum = scoreArr.reduce((a, b) => a + b, 0);
  const avg = sum / scoreArr.length;
  avgScore.textContent = `Average Score: ${avg.toFixed(2)}`;
}

function updateLeaderboard(newScore) {
  leaderboard.push(newScore);
  leaderboard.sort((a, b) => a - b);
  leaderboard = leaderboard.slice(0, 3);
  const items = document.getElementsByName("leaderboard");
  items.forEach((li, i) => (li.textContent = leaderboard[i]));
}

function updateTimers(endMs) {
  const roundTime = (endMs - startTime) / 1000;
  totalTime += roundTime;
  gamesPlayed++;
  if (roundTime < fastestTime) fastestTime = roundTime;
  if (fastestEl) fastestEl.textContent = `Fastest game: ${fastestTime.toFixed(2)}s`;
  if (avgTimeEl) avgTimeEl.textContent = `Average time per game: ${(totalTime / gamesPlayed).toFixed(2)}s`;
}


function startLiveTimer() {
  if (!currentTimerEl) return;
  const tick = () => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    currentTimerEl.textContent = `⏱ Round time: ${elapsed}s`;
  };
  tick();
  roundTimer = setInterval(tick, 1000);
}

function stopLiveTimer() {
  if (roundTimer) clearInterval(roundTimer);
  if (currentTimerEl) currentTimerEl.textContent = "";
}


function startGlobalTimer() {
  if (globalActive) return;
  globalStart = Date.now();
  globalActive = true;
  const tick = () => {
    if (!globalActive) return;
    const elapsed = ((Date.now() - globalStart) / 1000).toFixed(1);
    globalTimerEl.textContent = `🌍 Total active play time: ${elapsed}s`;
  };
  tick();
  globalTimer = setInterval(tick, 1000);
}

function stopGlobalTimer() {
  if (globalTimer) clearInterval(globalTimer);
  globalActive = false;
  globalTimerEl.textContent = "";
}


function getScoreQuality(score, level) {
  if (score <= level / 4) return "🟢 Good score!";
  if (score <= level / 2) return "🟡 Okay score.";
  return "🔴 Bad score.";
}
