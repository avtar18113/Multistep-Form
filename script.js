"use strict";

const form = document.getElementById("multi-step-form");
const formNavigation = document.getElementById("form-navigation");

const nextButton = document.getElementById("next-button");
const backButton = document.getElementById("back-button");

const formSteps = Array.from(document.querySelectorAll(".form-step"));
const sidebarSteps = Array.from(document.querySelectorAll(".step-item"));

const personalInputs = Array.from(
  document.querySelectorAll(
    'input[name="userName"], input[name="email"], input[name="phone"]'
  )
);

const planCards = Array.from(document.querySelectorAll(".plan_card"));
const addonCards = Array.from(document.querySelectorAll(".addon_card"));

const billingToggle = document.getElementById("billing-toggle");
const billingLabels = Array.from(
  document.querySelectorAll("[data-billing-label]")
);

const changePlanButton = document.getElementById("change-plan-button");

const summaryPlanName = document.getElementById("summary-plan-name");
const summaryPlanPrice = document.getElementById("summary-plan-price");
const summaryAddons = document.getElementById("summary-addons");

const totalLabel = document.getElementById("total-label");
const totalPrice = document.getElementById("total-price");

let currentStep = 1;
let billingCycle = "monthly";
let selectedPlan = planCards[0];

const formData = {
  userName: "",
  email: "",
  phone: "",
  billingCycle: "monthly",
  plan: {
    name: "Arcade",
    price: 9,
  },
  addons: [],
};

/**
 * Converts a price into the expected UI format.
 *
 * @param {number} price
 * @param {"monthly" | "yearly"} cycle
 * @param {boolean} includePlus
 * @returns {string}
 */
function formatPrice(price, cycle, includePlus = false) {
  const prefix = includePlus ? "+" : "";
  const suffix = cycle === "yearly" ? "yr" : "mo";

  return `${prefix}$${price}/${suffix}`;
}

/**
 * Displays the required form step and updates sidebar progress.
 *
 * @param {number} stepNumber
 */
function showStep(stepNumber) {
  currentStep = stepNumber;

  formSteps.forEach((step) => {
    const stepValue = Number(step.dataset.step);

    step.classList.toggle("active", stepValue === currentStep);
  });

  sidebarSteps.forEach((step) => {
    const sidebarStepNumber = Number(step.dataset.sidebarStep);

    step.classList.toggle(
      "active",
      sidebarStepNumber === Math.min(currentStep, 4)
    );
  });

  updateNavigation();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/**
 * Updates back and next button states.
 */
function updateNavigation() {
  if (currentStep > 1 && currentStep < 5) {
    backButton.classList.add("visible");
  } else {
    backButton.classList.remove("visible");
  }

  if (currentStep === 4) {
    nextButton.textContent = "Confirm";
    nextButton.classList.add("confirm-button");
  } else {
    nextButton.textContent = "Next Step";
    nextButton.classList.remove("confirm-button");
  }

  if (currentStep === 5) {
    formNavigation.style.display = "none";
  } else {
    formNavigation.style.display = "flex";
  }
}

/**
 * Returns a custom validation message for a field.
 *
 * @param {HTMLInputElement} input
 * @returns {string}
 */
function getValidationMessage(input) {
  if (input.validity.valueMissing) {
    return "This field is required";
  }

  if (input.name === "email" && input.validity.typeMismatch) {
    return "Enter a valid email";
  }

  if (input.name === "phone" && input.validity.tooShort) {
    return "Enter a valid phone number";
  }

  return "";
}

/**
 * Updates visual validation state without overriding native browser
 * validationMessage, which is required by the Cypress tests.
 *
 * @param {HTMLInputElement} input
 */
function updateInputValidationState(input) {
  const errorElement = document.getElementById(`${input.name}-error`);
  const message = getValidationMessage(input);

  input.classList.toggle("invalid", !input.validity.valid);

  if (errorElement) {
    errorElement.textContent = message;
  }
}

/**
 * Validates all fields in step one.
 *
 * @returns {boolean}
 */
function validatePersonalInformation() {
  let firstInvalidInput = null;

  personalInputs.forEach((input) => {
    updateInputValidationState(input);

    if (!input.validity.valid && !firstInvalidInput) {
      firstInvalidInput = input;
    }
  });

  if (firstInvalidInput) {
    firstInvalidInput.reportValidity();
    firstInvalidInput.focus();

    return false;
  }

  savePersonalInformation();

  return true;
}

/**
 * Saves personal information to the local form state.
 */
function savePersonalInformation() {
  const userNameInput = document.querySelector(
    'input[name="userName"]'
  );

  const emailInput = document.querySelector('input[name="email"]');
  const phoneInput = document.querySelector('input[name="phone"]');

  formData.userName = userNameInput.value.trim();
  formData.email = emailInput.value.trim();
  formData.phone = phoneInput.value.trim();
}

/**
 * Selects one subscription plan.
 *
 * @param {HTMLElement} card
 */
function selectPlan(card) {
  planCards.forEach((planCard) => {
    const isSelected = planCard === card;

    planCard.classList.toggle("selected", isSelected);
    planCard.setAttribute("aria-checked", String(isSelected));
  });

  selectedPlan = card;
  saveSelectedPlan();
}

/**
 * Saves selected plan into state.
 */
function saveSelectedPlan() {
  const priceKey =
    billingCycle === "yearly"
      ? "yearlyPrice"
      : "monthlyPrice";

  formData.plan = {
    name: selectedPlan.dataset.plan,
    price: Number(selectedPlan.dataset[priceKey]),
  };

  formData.billingCycle = billingCycle;
}

/**
 * Updates plan and add-on prices whenever billing changes.
 */
function updateBillingUI() {
  billingCycle = billingToggle.checked ? "yearly" : "monthly";

  const isYearly = billingCycle === "yearly";

  document.body.classList.toggle("yearly-mode", isYearly);

  billingLabels.forEach((label) => {
    label.classList.toggle(
      "active",
      label.dataset.billingLabel === billingCycle
    );
  });

  planCards.forEach((card) => {
    const price = isYearly
      ? Number(card.dataset.yearlyPrice)
      : Number(card.dataset.monthlyPrice);

    const planPriceElement = card.querySelector(".plan-price");

    planPriceElement.textContent = formatPrice(
      price,
      billingCycle
    );
  });

  addonCards.forEach((card) => {
    const price = isYearly
      ? Number(card.dataset.yearlyPrice)
      : Number(card.dataset.monthlyPrice);

    const addonPriceElement = card.querySelector(".addon-price");

    addonPriceElement.textContent = formatPrice(
      price,
      billingCycle,
      true
    );
  });

  saveSelectedPlan();
}

/**
 * Updates selected visual state of an add-on.
 *
 * @param {HTMLElement} card
 */
function updateAddonSelection(card) {
  const checkbox = card.querySelector('input[type="checkbox"]');

  card.classList.toggle("selected", checkbox.checked);
}

/**
 * Collects selected add-ons.
 */
function saveSelectedAddons() {
  formData.addons = addonCards
    .filter((card) => {
      const checkbox = card.querySelector('input[type="checkbox"]');

      return checkbox.checked;
    })
    .map((card) => {
      const priceKey =
        billingCycle === "yearly"
          ? "yearlyPrice"
          : "monthlyPrice";

      return {
        name: card.dataset.addon,
        price: Number(card.dataset[priceKey]),
      };
    });
}

/**
 * Creates and displays the order summary.
 */
function renderSummary() {
  saveSelectedPlan();
  saveSelectedAddons();

  const cycleName =
    billingCycle === "yearly" ? "Yearly" : "Monthly";

  summaryPlanName.textContent =
    `${formData.plan.name} (${cycleName})`;

  summaryPlanPrice.textContent = formatPrice(
    formData.plan.price,
    billingCycle
  );

  summaryAddons.innerHTML = "";

  if (formData.addons.length === 0) {
    const emptyMessage = document.createElement("p");

    emptyMessage.className = "empty-addons";
    emptyMessage.textContent = "No add-ons selected";

    summaryAddons.appendChild(emptyMessage);
  } else {
    formData.addons.forEach((addon) => {
      const row = document.createElement("div");
      const name = document.createElement("span");
      const price = document.createElement("span");

      row.className = "summary-addon-row";
      name.textContent = addon.name;
      price.textContent = formatPrice(
        addon.price,
        billingCycle,
        true
      );

      row.append(name, price);
      summaryAddons.appendChild(row);
    });
  }

  const addonsTotal = formData.addons.reduce(
    (total, addon) => total + addon.price,
    0
  );

  const finalTotal = formData.plan.price + addonsTotal;

  totalLabel.textContent =
    billingCycle === "yearly"
      ? "Total (per year)"
      : "Total (per month)";

  totalPrice.textContent = formatPrice(
    finalTotal,
    billingCycle,
    true
  );
}

/**
 * Moves to the next step based on the active step.
 */
function goToNextStep() {
  if (currentStep === 1) {
    if (!validatePersonalInformation()) {
      return;
    }

    showStep(2);
    return;
  }

  if (currentStep === 2) {
    saveSelectedPlan();
    showStep(3);
    return;
  }

  if (currentStep === 3) {
    saveSelectedAddons();
    renderSummary();
    showStep(4);
    return;
  }

  if (currentStep === 4) {
    showStep(5);
  }
}

/**
 * Moves to the previous form step.
 */
function goToPreviousStep() {
  if (currentStep <= 1) {
    return;
  }

  showStep(currentStep - 1);
}

/* =========================
   EVENT LISTENERS
========================= */

form.addEventListener("submit", (event) => {
  event.preventDefault();
  goToNextStep();
});

backButton.addEventListener("click", goToPreviousStep);

personalInputs.forEach((input) => {
  input.addEventListener("input", () => {
    if (input.validity.valid) {
      input.classList.remove("invalid");

      const errorElement = document.getElementById(
        `${input.name}-error`
      );

      if (errorElement) {
        errorElement.textContent = "";
      }
    }
  });

  input.addEventListener("blur", () => {
    if (input.value.trim() !== "") {
      updateInputValidationState(input);
    }
  });
});

planCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectPlan(card);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectPlan(card);
    }
  });
});

billingToggle.addEventListener("change", updateBillingUI);

addonCards.forEach((card) => {
  const checkbox = card.querySelector('input[type="checkbox"]');

  checkbox.addEventListener("change", () => {
    updateAddonSelection(card);
    saveSelectedAddons();
  });
});

changePlanButton.addEventListener("click", () => {
  showStep(2);
});

/* =========================
   INITIALIZATION
========================= */

updateBillingUI();
selectPlan(planCards[0]);

addonCards.forEach((card) => {
  updateAddonSelection(card);
});

showStep(1);