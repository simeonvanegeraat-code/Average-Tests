(() => {
  const display = document.querySelector("#digit-display");
  const instruction = document.querySelector("#memory-instruction");
  const form = document.querySelector("#memory-form");
  const input = document.querySelector("#memory-input");
  const startButton = document.querySelector("#start-memory");
  const resetButton = document.querySelector("#reset-memory");
  const status = document.querySelector("#memory-status");
  const result = document.querySelector("#memory-result");

  if (!display || !form || !input || !startButton || !resetButton) return;

  let level = 3;
  let mistakesAtLevel = 0;
  let best = 0;
  let sequence = "";
  let phase = "idle";
  let revealTimer = null;
  let transitionTimer = null;

  const randomDigit = () => {
    if (window.crypto?.getRandomValues) {
      const number = new Uint32Array(1);
      window.crypto.getRandomValues(number);
      return String(number[0] % 10);
    }
    return String(Math.floor(Math.random() * 10));
  };

  const makeSequence = (length) => {
    let value = "";
    while (value.length < length) value += randomDigit();
    return value;
  };

  const reveal = () => {
    phase = "showing";
    sequence = makeSequence(level);
    input.value = "";
    input.disabled = false;
    form.hidden = true;
    startButton.hidden = true;
    result.hidden = true;
    display.textContent = sequence;
    instruction.textContent = "Onthoud de volgorde";
    status.textContent = `${level} cijfers · kans ${mistakesAtLevel + 1} van 2`;
    const visibleMs = Math.max(1200, level * 450);
    revealTimer = window.setTimeout(() => {
      phase = "answering";
      display.textContent = "•••";
      instruction.textContent = "Voer de reeks nu in";
      form.hidden = false;
      input.focus();
    }, visibleMs);
  };

  const finish = () => {
    phase = "done";
    form.hidden = true;
    startButton.hidden = false;
    startButton.textContent = "Nog een keer";
    display.textContent = String(best);
    instruction.textContent = "langste correcte reeks";
    status.textContent = "Test voltooid";
    result.hidden = false;
    result.innerHTML =
      `<strong>Je langste correcte reeks was ${best} ${best === 1 ? "cijfer" : "cijfers"}.</strong><br>` +
      "Dit is een momentopname van deze ene taak, geen IQ-score of klinische meting.";
  };

  const handleAnswer = () => {
    if (phase !== "answering") return;
    const answer = input.value.replace(/\D/g, "");
    if (!answer) {
      instruction.textContent = "Voer eerst de cijfers in";
      input.focus();
      return;
    }

    phase = "feedback";
    form.hidden = true;
    input.disabled = true;

    if (answer === sequence) {
      best = Math.max(best, level);
      level += 1;
      mistakesAtLevel = 0;
      result.hidden = false;
      result.innerHTML = `<strong>Correct.</strong> De volgende reeks heeft ${level} cijfers.`;
      transitionTimer = window.setTimeout(reveal, 900);
      return;
    }

    mistakesAtLevel += 1;
    if (mistakesAtLevel >= 2) {
      result.hidden = false;
      result.innerHTML = `<strong>Niet correct.</strong> De reeks was ${sequence}.`;
      transitionTimer = window.setTimeout(finish, 1100);
      return;
    }

    result.hidden = false;
    result.innerHTML = `<strong>Niet correct.</strong> De reeks was ${sequence}. Je krijgt nog één poging met ${level} cijfers.`;
    transitionTimer = window.setTimeout(reveal, 1300);
  };

  const reset = () => {
    window.clearTimeout(revealTimer);
    window.clearTimeout(transitionTimer);
    level = 3;
    mistakesAtLevel = 0;
    best = 0;
    sequence = "";
    phase = "idle";
    form.hidden = true;
    input.disabled = false;
    result.hidden = true;
    startButton.hidden = false;
    startButton.textContent = "Start test";
    display.textContent = "Klaar?";
    instruction.textContent = "Je krijgt twee kansen per lengte.";
    status.textContent = "Startniveau: 3 cijfers";
  };

  startButton.addEventListener("click", () => {
    if (phase === "done") reset();
    reveal();
  });
  resetButton.addEventListener("click", reset);
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, level);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleAnswer();
  });
})();
