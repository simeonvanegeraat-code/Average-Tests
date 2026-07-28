(() => {
  const board = document.querySelector("#visual-memory-board");
  const instruction = document.querySelector("#visual-memory-instruction");
  const startButton = document.querySelector("#start-visual-memory");
  const submitButton = document.querySelector("#submit-visual-memory");
  const resetButton = document.querySelector("#reset-visual-memory");
  const status = document.querySelector("#visual-memory-status");
  const result = document.querySelector("#visual-memory-result");

  if (!board || !instruction || !startButton || !submitButton || !resetButton || !status || !result) return;

  const totalCells = 16;
  const maximumLevel = 10;
  let level = 3;
  let mistakesAtLevel = 0;
  let best = 0;
  let pattern = new Set();
  let selected = new Set();
  let cells = [];
  let phase = "idle";
  let revealTimer = null;
  let transitionTimer = null;

  const shuffledIndexes = () => {
    const values = Array.from({ length: totalCells }, (_, index) => index);
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }
    return values;
  };

  const setCellsEnabled = (enabled) => {
    cells.forEach((cell) => {
      cell.disabled = !enabled;
    });
  };

  const clearBoard = () => {
    selected = new Set();
    cells.forEach((cell) => {
      cell.dataset.active = "false";
      cell.setAttribute("aria-pressed", "false");
    });
  };

  const buildBoard = () => {
    board.innerHTML = "";
    cells = Array.from({ length: totalCells }, (_, index) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "memory-cell";
      cell.setAttribute("aria-label", `Vakje ${index + 1}`);
      cell.setAttribute("aria-pressed", "false");
      cell.dataset.active = "false";
      cell.disabled = true;
      cell.addEventListener("click", () => {
        if (phase !== "answering") return;
        if (selected.has(index)) selected.delete(index);
        else selected.add(index);
        const isSelected = selected.has(index);
        cell.dataset.active = String(isSelected);
        cell.setAttribute("aria-pressed", String(isSelected));
        instruction.textContent = `${selected.size} van ${level} vakjes geselecteerd`;
      });
      board.append(cell);
      return cell;
    });
  };

  const showPattern = () => {
    phase = "showing";
    clearBoard();
    setCellsEnabled(false);
    startButton.hidden = true;
    submitButton.hidden = true;
    result.hidden = true;
    pattern = new Set(shuffledIndexes().slice(0, level));
    pattern.forEach((index) => {
      cells[index].dataset.active = "true";
    });
    status.textContent = `${level} vakjes · kans ${mistakesAtLevel + 1} van 2`;
    instruction.textContent = "Onthoud de gemarkeerde vakjes";

    const visibleMs = Math.max(1050, 1750 - level * 55);
    revealTimer = window.setTimeout(() => {
      clearBoard();
      phase = "answering";
      setCellsEnabled(true);
      submitButton.hidden = false;
      instruction.textContent = `Selecteer de ${level} vakjes die je zag`;
      cells[0].focus();
    }, visibleMs);
  };

  const finish = (completed = false) => {
    phase = "done";
    setCellsEnabled(false);
    startButton.hidden = false;
    startButton.textContent = "Nog een keer";
    submitButton.hidden = true;
    status.textContent = completed ? "Alle niveaus voltooid" : "Test voltooid";
    instruction.textContent = `Langste exacte patroon: ${best} vakjes`;
    result.hidden = false;
    result.innerHTML =
      `<strong>Je langste exact gereproduceerde patroon bevatte ${best} ${best === 1 ? "vakje" : "vakjes"}.</strong><br>` +
      "Dit is een momentopname van deze rastertaak, geen IQ-score of klinische meting.";
  };

  const patternsMatch = () =>
    selected.size === pattern.size && [...pattern].every((index) => selected.has(index));

  const handleAnswer = () => {
    if (phase !== "answering") return;
    if (selected.size !== level) {
      instruction.textContent = `Selecteer precies ${level} vakjes; je hebt er nu ${selected.size}`;
      return;
    }

    phase = "feedback";
    setCellsEnabled(false);
    submitButton.hidden = true;

    if (patternsMatch()) {
      best = Math.max(best, level);
      result.hidden = false;
      if (level >= maximumLevel) {
        result.innerHTML = "<strong>Correct.</strong> Je hebt het hoogste niveau van deze test voltooid.";
        transitionTimer = window.setTimeout(() => finish(true), 1100);
        return;
      }
      level += 1;
      mistakesAtLevel = 0;
      result.innerHTML = `<strong>Correct.</strong> Het volgende patroon bevat ${level} vakjes.`;
      transitionTimer = window.setTimeout(showPattern, 950);
      return;
    }

    mistakesAtLevel += 1;
    clearBoard();
    pattern.forEach((index) => {
      cells[index].dataset.active = "true";
    });
    result.hidden = false;

    if (mistakesAtLevel >= 2) {
      result.innerHTML = "<strong>Niet exact.</strong> Het juiste patroon is nog even gemarkeerd.";
      transitionTimer = window.setTimeout(finish, 1300);
      return;
    }

    result.innerHTML = `<strong>Niet exact.</strong> Je krijgt nog één poging met een nieuw patroon van ${level} vakjes.`;
    transitionTimer = window.setTimeout(showPattern, 1400);
  };

  const reset = () => {
    window.clearTimeout(revealTimer);
    window.clearTimeout(transitionTimer);
    level = 3;
    mistakesAtLevel = 0;
    best = 0;
    pattern = new Set();
    selected = new Set();
    phase = "idle";
    clearBoard();
    setCellsEnabled(false);
    startButton.hidden = false;
    startButton.textContent = "Start test";
    submitButton.hidden = true;
    result.hidden = true;
    status.textContent = "Startniveau: 3 vakjes";
    instruction.textContent = "Je krijgt twee kansen per patroongrootte.";
  };

  buildBoard();
  startButton.addEventListener("click", () => {
    if (phase === "done") reset();
    showPattern();
  });
  submitButton.addEventListener("click", handleAnswer);
  resetButton.addEventListener("click", reset);
})();
