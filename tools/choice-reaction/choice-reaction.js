(() => {
  const test = document.querySelector("#choice-test");
  if (!test) return;

  const totalTrials = 12;
  const targets = [
    { id: "red", key: "d", symbol: "●", label: "rode cirkel" },
    { id: "blue", key: "f", symbol: "■", label: "blauw vierkant" },
    { id: "green", key: "j", symbol: "▲", label: "groene driehoek" },
    { id: "orange", key: "k", symbol: "◆", label: "oranje ruit" }
  ];

  const stimulus = document.querySelector("#choice-stimulus");
  const title = document.querySelector("#choice-title");
  const instruction = document.querySelector("#choice-instruction");
  const count = document.querySelector("#choice-count");
  const announcement = document.querySelector("#choice-announcement");
  const startButton = document.querySelector("#start-choice-test");
  const resetButton = document.querySelector("#reset-choice-test");
  const choiceButtons = [...document.querySelectorAll("[data-choice]")];
  const resultsPanel = document.querySelector("#choice-results");
  const medianResult = document.querySelector("#choice-median");
  const accuracyResult = document.querySelector("#choice-accuracy");
  const falseStartResult = document.querySelector("#choice-false-starts");
  const chart = document.querySelector("#choice-chart");
  const summary = document.querySelector("#choice-summary");

  let state = "idle";
  let sequence = [];
  let trialIndex = 0;
  let currentTarget = null;
  let startedAt = 0;
  let timerId = null;
  let correctTimes = [];
  let correctAnswers = 0;
  let falseStarts = 0;

  const announce = (message) => {
    announcement.textContent = "";
    window.setTimeout(() => {
      announcement.textContent = message;
    }, 20);
  };

  const median = (values) => {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  };

  const shuffle = (values) => {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
    }
    return shuffled;
  };

  const setStatus = (nextState, nextTitle, nextInstruction, symbol = "?") => {
    state = nextState;
    test.dataset.state = nextState;
    title.textContent = nextTitle;
    instruction.textContent = nextInstruction;
    stimulus.textContent = symbol;
    stimulus.className = "choice-stimulus";
  };

  const updateResults = () => {
    resultsPanel.classList.add("visible");
    const completed = trialIndex;
    const currentMedian = median(correctTimes);
    medianResult.textContent = currentMedian === null ? "—" : `${currentMedian} ms`;
    accuracyResult.textContent = completed ? `${Math.round((correctAnswers / completed) * 100)}%` : "—";
    falseStartResult.textContent = String(falseStarts);
    count.textContent = `${completed} van ${totalTrials} signalen`;

    chart.replaceChildren();
    const chartMax = Math.max(...correctTimes, 650);
    correctTimes.forEach((value, index) => {
      const bar = document.createElement("div");
      bar.className = "trial-bar";
      bar.style.height = `${Math.max(18, Math.round((value / chartMax) * 70))}px`;
      bar.title = `Correcte reactie ${index + 1}: ${value} ms`;
      const accessibleText = document.createElement("span");
      accessibleText.textContent = `Correcte reactie ${index + 1}: ${value} milliseconden`;
      bar.append(accessibleText);
      chart.append(bar);
    });
  };

  const finish = () => {
    window.clearTimeout(timerId);
    state = "complete";
    test.dataset.state = "complete";
    startButton.disabled = false;
    startButton.textContent = "Test nog een keer";
    count.textContent = `${totalTrials} van ${totalTrials} signalen`;
    stimulus.textContent = "✓";
    stimulus.className = "choice-stimulus";

    const currentMedian = median(correctTimes);
    const accuracy = Math.round((correctAnswers / totalTrials) * 100);
    title.textContent = currentMedian === null ? "Geen correcte reacties" : `${currentMedian} ms mediaan`;
    instruction.textContent = `${correctAnswers} van de ${totalTrials} keuzes waren correct.`;
    summary.innerHTML = currentMedian === null
      ? "<strong>Er is nog geen snelheidsscore.</strong><br>De mediaan gebruikt alleen correcte reacties. Probeer de vaste koppelingen eerst rustig te leren."
      : `<strong>Je mediaan over ${correctTimes.length} correcte reacties is ${currentMedian} ms.</strong><br>Je nauwkeurigheid is ${accuracy}%. Vergelijk dit alleen met dezelfde taak op hetzelfde apparaat.`;
    announce(`Test voltooid. ${correctAnswers} van de ${totalTrials} keuzes correct${currentMedian === null ? "." : `, met een mediaan van ${currentMedian} milliseconden.`}`);
  };

  const scheduleTrial = () => {
    if (trialIndex >= totalTrials) {
      finish();
      return;
    }

    currentTarget = sequence[trialIndex];
    setStatus("waiting", "Wacht op het signaal…", "Nog geen keuze maken.", "…");
    startButton.disabled = true;
    const delay = 1000 + Math.random() * 1500;
    timerId = window.setTimeout(() => {
      state = "arming";
      test.dataset.state = "ready";
      stimulus.textContent = currentTarget.symbol;
      stimulus.className = `choice-stimulus tone-${currentTarget.id}`;
      title.textContent = "Kies nu";
      instruction.textContent = "Gebruik de juiste toets of tik op de bijbehorende knop.";
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          startedAt = performance.now();
          state = "ready";
          announce(`${currentTarget.label}. Kies nu.`);
        });
      });
    }, delay);
  };

  const recordChoice = (choice) => {
    if (state === "idle" || state === "complete" || state === "feedback") return;

    if (state === "waiting" || state === "arming") {
      window.clearTimeout(timerId);
      falseStarts += 1;
      falseStartResult.textContent = String(falseStarts);
      setStatus("feedback", "Te vroeg", "Deze valse start telt niet als signaal. We proberen dezelfde ronde opnieuw.", "×");
      announce("Te vroeg. Dezelfde ronde wordt opnieuw gestart.");
      timerId = window.setTimeout(scheduleTrial, 850);
      return;
    }

    if (state !== "ready") return;

    const elapsed = Math.max(1, Math.round(performance.now() - startedAt));
    const isCorrect = choice === currentTarget.id;
    trialIndex += 1;

    if (isCorrect) {
      correctAnswers += 1;
      correctTimes.push(elapsed);
      setStatus("feedback", `${elapsed} ms`, "Correct. Het volgende signaal komt zo.", "✓");
      announce(`Correct, ${elapsed} milliseconden.`);
    } else {
      setStatus("feedback", "Niet de juiste keuze", `Dit was de ${currentTarget.label}. Snelheid telt alleen bij een correct antwoord.`, "×");
      announce(`Onjuist. Dit was de ${currentTarget.label}.`);
    }

    updateResults();
    timerId = window.setTimeout(scheduleTrial, 850);
  };

  const start = () => {
    window.clearTimeout(timerId);
    sequence = shuffle(targets.flatMap((target) => [target, target, target]));
    trialIndex = 0;
    currentTarget = null;
    correctTimes = [];
    correctAnswers = 0;
    falseStarts = 0;
    chart.replaceChildren();
    resultsPanel.classList.remove("visible");
    medianResult.textContent = "—";
    accuracyResult.textContent = "—";
    falseStartResult.textContent = "0";
    summary.textContent = "Alleen correcte reacties tellen mee voor de mediaan. Een fout antwoord telt wel mee voor je nauwkeurigheid.";
    count.textContent = `0 van ${totalTrials} signalen`;
    startButton.textContent = "Test loopt";
    announce("De test begint. Wacht op het eerste signaal.");
    scheduleTrial();
  };

  const reset = () => {
    window.clearTimeout(timerId);
    state = "idle";
    sequence = [];
    trialIndex = 0;
    currentTarget = null;
    correctTimes = [];
    correctAnswers = 0;
    falseStarts = 0;
    test.dataset.state = "idle";
    count.textContent = `0 van ${totalTrials} signalen`;
    stimulus.textContent = "?";
    stimulus.className = "choice-stimulus";
    title.textContent = "Leer eerst de vier keuzes";
    instruction.textContent = "Gebruik D, F, J en K op een toetsenbord, of tik op de juiste knop.";
    startButton.disabled = false;
    startButton.textContent = "Start de 12 rondes";
    resultsPanel.classList.remove("visible");
    chart.replaceChildren();
    medianResult.textContent = "—";
    accuracyResult.textContent = "—";
    falseStartResult.textContent = "0";
    announce("De keuzereactietest is opnieuw ingesteld.");
  };

  choiceButtons.forEach((button) => {
    button.addEventListener("click", () => recordChoice(button.dataset.choice));
  });

  startButton.addEventListener("click", start);
  resetButton.addEventListener("click", reset);

  window.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement?.tagName;
    if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
    const target = targets.find((item) => item.key === event.key.toLowerCase());
    if (!target || event.repeat) return;
    event.preventDefault();
    recordChoice(target.id);
  });
})();
