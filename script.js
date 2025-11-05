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

const bigPrime1 = 6791
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
let giveUps = 0;

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
    updateElo(true, score, level);
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
  giveUps++;

  msg.style.color = "gray";
  msg.textContent = `😞😞😞😞😞 You gave up, ${userName}! The number was ${answer}. Score: Terrible never play again`;
  score = level; 
  updateElo(false, score, level);

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
  const hints = [];
  hintBtn.classList.add("hint-active");
  setTimeout(() => hintBtn.classList.remove("hint-active"), 400);


  hintBtn.disabled = true;
  setTimeout(() => hintBtn.disabled = false, 750);



  hints.push(answer % 2 === 0 ? "The number is even." : "The number is odd.");
  if (isPrime(answer)) hints.push("The number is prime.");

  if (answer % 3 === 0) hints.push("The number is divisible by 3.");
  if (answer % 5 === 0) hints.push("The number is divisible by 5.");
  if (answer % 7 === 0) hints.push("The number is divisible by 7.");
  if (answer % 11 === 0) hints.push("The number is divisible by 11.");
  if (answer % 13 === 0) hints.push("The number is divisible by 13.");
    
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

  hints.push(`The product of this number multiplied by the numbers above and below it is ${(answer-1)*(answer+1)*answer}`)


  const smallestFactor = getSmallestFactor(answer);
  if (smallestFactor && smallestFactor !== answer) {
    hints.push(`The smallest factor (besides 1) is ${smallestFactor}.`);
  }

  

  const power = Math.ceil(Math.random()*10)+5
  const mod = Math.ceil(Math.random()*10)+2
  hints.push(`This number raised to the ${power}th power is congruent to ${(answer**power)%mod} mod ${mod}`)

  
  const power2 = Math.ceil(Math.random()*50)+25
  const mod2 = Math.ceil(Math.random()*100)
  hints.push(`This number raised to the ${power2}th power is congruent to ${(answer**power2)%mod2} mod ${mod2}`)

  const power3 = Math.ceil(Math.random()*10)+5
  const mod3 = Math.ceil(Math.random()*10)
  hints.push(`This number raised to the ${power}th power is congruent to ${(answer**power3)%mod3} mod ${mod3}`)

 // Lucky number pattern
  if (digitSum === 7) hints.push("Its digits sum to 7 — a 'lucky' number.");

  // Palindrome relation
  const reversed = parseInt(answer.toString().split("").reverse().join(""));
  if (reversed !== answer) {
    if ((answer + reversed) % 11 === 0)
      hints.push("If reversed and added to itself, the result is divisible by 11.");
    if (reversed < answer)
      hints.push("If you flip its digits, the number becomes smaller.");
  }

  // Binary patterns
  const bin = answer.toString(2);
  const ones = bin.split("1").length - 1;
  if (bin.startsWith("1") && bin.endsWith("1"))
    hints.push("Its binary form starts and ends with 1.");
  if (ones % 2 === 0)
    hints.push("Its binary form has an even number of 1s.");

  // Prime gap
  if (isPrime(answer - 2) || isPrime(answer + 2))
    hints.push("It’s 2 away from a prime number.");

  // Factorial nearness
  const factorials = [1, 2, 6, 24, 120, 720];
  const nearFact = factorials.find(f => Math.abs(f - answer) <= 3);
  if (nearFact) hints.push(`It’s close to ${factorials.indexOf(nearFact)}! (${nearFact}).`);

  // Perfect number closeness
  const perfects = [6, 28, 496, 8128,33550336, 8589869056, 137438691328];
  if (perfects.some(p => Math.abs(answer - p) <= 2))
    hints.push("It’s near a perfect number (like 6, 28, 496).");

    hints.push(`This number plus Avogadro's Number is ${answer+6.02214076*10**23}`);
  // Roman numeral pattern
  const roman = toRoman(answer);
  if (roman.startsWith("X"))
    hints.push("In Roman numerals, it starts with X.");

  // Modulo symmetry
  if ((answer % 11) === (digitSum % 11))
    hints.push("Its remainder mod 11 equals its digit sum mod 11.");

  // Digital sum prime
  if (isPrime(digitSum))
    hints.push("The sum of its digits is prime.");

  // Triangular sum
  const triSum = (answer * (answer + 1)) / 2;
  if (triSum % 2 === 0)
    hints.push("The sum of all numbers up to it is even.");

  // Euler totient trick (approximate)
  if (answer % 2 === 0)
    hints.push("It has about half as many coprime numbers below it (φ(n) ≈ n/2).");

  // Leap year tie-in
  if (answer % 4 === 0)
    hints.push("If it were a year, it would be a leap year.");

  // 9-multiplicative pattern
  if ((answer * 9).toString().split("").reduce((a, b) => a + +b, 0) === 9)
    hints.push("When multiplied by 9, its digits sum to 9.");



  // Odd one out
  if (answer % 2 && Math.floor(answer / 2) % 2 === 0)
    hints.push("It’s odd, but its half (rounded down) is even.");

  hints.push(`This number multipled by four different primes is ${answer*bigPrime1*bigPrime2*bigPrime3*2}`)

  function countFactors(n) {
  let count = 0;
  for (let i = 1; i <= n; i++) if (n % i === 0) count++;
  return count;
}

function getDigitalRoot(n) {
  while (n >= 10) {
    n = n
      .toString()
      .split("")
      .reduce((a, b) => a + parseInt(b), 0);
  }
  return n;
}

function toRoman(num) {
  const map = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let result = "";
  for (const [value, symbol] of map) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
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
  wins.textContent = `Total wins: ${scoreArr.length - giveUps}`;
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


let totalGlobalTime = 0; // total seconds across all games

function startGlobalTimer() {
  // Only start if not already running
  if (globalActive) return;

  globalActive = true;
  globalStart = Date.now();

  const tick = () => {
    if (!globalActive) return;
    const elapsed = (Date.now() - globalStart) / 1000;
    const totalElapsed = totalGlobalTime + elapsed;
    globalTimerEl.textContent = `🌍 Total active play time: ${totalElapsed.toFixed(1)}s`;
  };

  tick();
  globalTimer = setInterval(tick, 1000);
}

function stopGlobalTimer() {
  if (globalActive) {

    const elapsed = (Date.now() - globalStart) / 1000;
    totalGlobalTime += elapsed;
  }

  globalActive = false;
  clearInterval(globalTimer);
  globalTimer = null;


  globalTimerEl.textContent = `🌍 Total active play time: ${totalGlobalTime.toFixed(1)}s`;
}

function getScoreQuality(score, level) {
  let expected  = Math.log2(level)
  if (score <= expected - 4) return "🟢 Exceptional score!";
  if (score <= expected - 2) return "🟢 Good score!";
  if (score >= expected + 6) return "🔴 Disastrous score.";
  if (score >= expected + 4) return "🔴 Horrific score.";
  if (score >= expected + 2) return "🔴 Bad score.";

  return "🟡 Okay score.";
}


let elo = 1000;         
const baseK = 20;  

function updateElo(won, score, level) {
  const oldElo = elo;
  const levelRating =
    level <= 3 ? 900 : level <= 10 ? 1100 : level <= 30 ? 1300 : 1500;
  const performance = won ? 1 : 0;
  const expected = 1 / (1 + 10 ** ((levelRating - elo) / 400));

  // --- Base K scaling: harder to gain, easier to lose at high ELO ---
  let kFactor;
    if (elo < 800) kFactor = baseK * 2.5;
  if (elo < 800) kFactor = baseK * 2;
  else if (elo < 1000) kFactor = baseK * 1.5;
  else if (elo < 1300) kFactor = baseK * 1.2;
  else if (elo < 1600) kFactor = baseK * 1;
  else if (elo < 2000) kFactor = baseK * 0.8;
  else if (elo < 2500) kFactor = baseK * 0.6;
  else if (elo < 3000) kFactor = baseK * 0.3;
  else kFactor = baseK * 0.15;

  let delta = kFactor * (performance - expected);


  const expectedGuesses = Math.log2(level);
  if (won) {
    if (score <= expectedGuesses) {
      const efficiencyBonus = 30 * (expectedGuesses / score);
      delta += efficiencyBonus;
    } else {
      const ineffPenalty = -35 * ((score / expectedGuesses) - 1);
      delta += ineffPenalty;
    }
  } else {
    delta -= 80; // harsh penalty for giving up
  }


  const difficultyMultiplier = Math.min(1.2, 0.6 + level / 100);
  delta *= difficultyMultiplier;


  if (delta > 0) {

    const shrink = 1 / (1 + Math.pow(elo / 1500, 1.15));
    delta *= shrink;
  } else {

    const amp = 1 + Math.pow(elo / 1500, 1.1);
    delta *= amp;
  }

delta -= (elo/500)
  delta = Math.min(100, delta)
  elo = Math.max(100, elo + delta);

  // --- Display feedback ---
  const actualChange = elo - oldElo;
  const symbol = actualChange >= 0 ? "🟢+" : "🔴";
  const rank = eloRank();
  document.getElementById(
    "elo"
  ).textContent = `ELO Rating: ${elo.toFixed(
    2
  )} (${symbol}${actualChange.toFixed(2)}) — Rank: ${rank}`;
}

function eloRank() {
  const body = document.body; // or document.getElementById("gameContainer")
  let rank = "";
  let color = "";
  let emoji = "";

  if (elo < 800) {
    rank = "Iron";
    emoji = "⚒️";
    color = "linear-gradient(180deg, #3b3b3b, #1f1f1f)";
  } else if (elo < 1000) {
    rank = "Bronze";
    emoji = "🥉";
    color = "linear-gradient(180deg, #a97142, #5a3b1a)";
  } else if (elo < 1300) {
    rank = "Silver";
    emoji = "🥈";
    color = "linear-gradient(180deg, #b8b8b8, #7d7d7d)";
  } else if (elo < 1600) {
    rank = "Gold";
    emoji = "🥇";
    color = "linear-gradient(180deg, #ffd700, #c8a000)";
  } else if (elo < 2000) {
    rank = "Platinum";
    emoji = "💠";
    color = "linear-gradient(180deg, #6cf5f5, #218b8b)";
  } else if (elo < 2500) {
    rank = "Diamond";
    emoji = "🔷";
    color = "linear-gradient(180deg, #66aaff, #1a2e5a)";
  } else if (elo < 3000) {
    rank = "Emerald";
    emoji = "💚";
    color = "linear-gradient(180deg, #00e676, #006b4e)";
  } else {
    rank = "Grandmaster";
    emoji = "👑";
    color = "linear-gradient(180deg, #ff4c4c, #7a0000)";
  }

  // ✨ Animate background color change
  body.style.transition = "background 1s ease-in-out";
  body.style.background = color;

  return `${rank} ${emoji}`;
}