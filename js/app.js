/**
 * WORKSHOP DE MISSÕES - FORA DA PROTEÇÃO DO TEMPLO
 * Igreja Batista Memorial em Magé
 * Logic, State Management, Validations & WhatsApp Integration
 */

// Application Configuration (with localStorage overrides)
const DEFAULT_CONFIG = {
  adminWhatsApp: "5521988110139", 
  adminName: "Coordenação de Missões",
  ticketPrice: 30.00,
  eventDateIso: "2026-10-24T08:00:00",
  eventDateDisplay: "24/10 (Sábado) de 08h às 12h",
  eventLocation: "Igreja Batista Memorial em Magé",
  eventTitle: "Workshop de Missões: Fora da Proteção do Templo"
};

// State
let appConfig = { ...DEFAULT_CONFIG };
let currentQuantity = 1;

// Load persisted config if available
function loadStoredConfig() {
  try {
    const saved = localStorage.getItem("missoes_app_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ignore obsolete dummy phone or outdated date text if previously saved
      if (parsed.adminWhatsApp === "5511999999999") {
        parsed.adminWhatsApp = DEFAULT_CONFIG.adminWhatsApp;
      }
      if (!parsed.eventDateDisplay || parsed.eventDateDisplay.includes("09h") || parsed.eventDateDisplay.includes("a partir das")) {
        parsed.eventDateDisplay = DEFAULT_CONFIG.eventDateDisplay;
      }
      if (parsed.eventDateIso && parsed.eventDateIso.includes("09:00:00")) {
        parsed.eventDateIso = DEFAULT_CONFIG.eventDateIso;
      }
      appConfig = { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error("Erro ao carregar configurações salvas:", e);
  }
}

function saveConfig(newConfig) {
  try {
    appConfig = { ...appConfig, ...newConfig };
    localStorage.setItem("missoes_app_config", JSON.stringify(appConfig));
    updateUiFromConfig();
  } catch (e) {
    console.error("Erro ao salvar configurações:", e);
  }
}

// Update UI elements based on config
function updateUiFromConfig() {
  const dateDisplays = document.querySelectorAll(".dynamic-event-date");
  dateDisplays.forEach(el => el.textContent = appConfig.eventDateDisplay);

  const locationDisplays = document.querySelectorAll(".dynamic-event-location");
  locationDisplays.forEach(el => el.textContent = appConfig.eventLocation);
}

// Phone Masking (21) 99999-9999
function applyPhoneMask(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);

  if (value.length > 6) {
    value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  } else if (value.length > 2) {
    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
  } else if (value.length > 0) {
    value = `(${value}`;
  }
  input.value = value;
}

// Quantity and Total Calculation
function updateQuantity(change) {
  const newQty = currentQuantity + change;
  if (newQty < 1 || newQty > 20) return;

  currentQuantity = newQty;
  document.getElementById("qtyDisplay").textContent = currentQuantity;

  const total = currentQuantity * appConfig.ticketPrice;
  const formattedTotal = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("priceTotalDisplay").textContent = formattedTotal;
  document.getElementById("submitPriceDisplay").textContent = formattedTotal;

  const mobilePeek = document.getElementById("mobilePricePeek");
  if (mobilePeek) mobilePeek.textContent = formattedTotal;

  // Additional participant name fields if quantity > 1
  const extraParticipantsBox = document.getElementById("extraParticipantsBox");
  if (extraParticipantsBox) {
    if (currentQuantity > 1) {
      extraParticipantsBox.style.display = "block";
      let html = `<label class="input-label" style="margin-top: 1rem;">Nomes dos demais participantes (${currentQuantity - 1}):</label>`;
      for (let i = 2; i <= currentQuantity; i++) {
        html += `
          <div style="margin-bottom: 0.5rem;">
            <input type="text" class="form-input extra-participant-name" placeholder="Nome completo do ${i}º participante" />
          </div>
        `;
      }
      extraParticipantsBox.innerHTML = html;
    } else {
      extraParticipantsBox.style.display = "none";
      extraParticipantsBox.innerHTML = "";
    }
  }
}

// Payment Method Switcher
function handlePaymentMethodChange() {
  const selected = document.querySelector('input[name="paymentMethod"]:checked')?.value;
  const pixBox = document.getElementById("pixDetailBox");
  const cardBox = document.getElementById("cardDetailBox");
  const cashBox = document.getElementById("cashDetailBox");

  if (pixBox) pixBox.style.display = selected === "pix" ? "block" : "none";
  if (cardBox) cardBox.style.display = selected === "card" ? "block" : "none";
  if (cashBox) cashBox.style.display = selected === "cash" ? "block" : "none";
}

// Event Countdown Timer
function initCountdown() {
  const targetDate = new Date(appConfig.eventDateIso).getTime();

  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    const daysEl = document.getElementById("countDays");
    const hoursEl = document.getElementById("countHours");
    const minutesEl = document.getElementById("countMins");
    const secondsEl = document.getElementById("countSecs");

    if (!daysEl) return;

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minutesEl.textContent = String(mins).padStart(2, "0");
    secondsEl.textContent = String(secs).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

// FAQ Accordion
function initFaq() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const btn = item.querySelector(".faq-question");
    if (btn) {
      btn.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        faqItems.forEach(i => i.classList.remove("active"));
        if (!isActive) item.classList.add("active");
      });
    }
  });
}

// Form Submission & Clean WhatsApp Message
function handleFormSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("fullName");
  const ageInput = document.getElementById("age");
  const phoneInput = document.getElementById("whatsappPhone");
  const notesInput = document.getElementById("financialNotes");

  const name = nameInput.value.trim();
  const age = ageInput.value.trim();
  const phone = phoneInput.value.trim();
  const notes = notesInput ? notesInput.value.trim() : "";

  if (!name) {
    alert("Por favor, preencha o seu Nome Completo.");
    nameInput.focus();
    return;
  }

  if (!age || isNaN(age) || age < 1 || age > 120) {
    alert("Por favor, informe a sua idade.");
    ageInput.focus();
    return;
  }

  if (!phone || phone.replace(/\D/g, "").length < 10) {
    alert("Por favor, informe um número de WhatsApp válido com DDD.");
    phoneInput.focus();
    return;
  }

  // Payment method
  const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
  const paymentVal = paymentMethodInput ? paymentMethodInput.value : "pix";
  let paymentLabel = "PIX";
  if (paymentVal === "card") paymentLabel = "Cartão (Débito/Crédito)";
  if (paymentVal === "cash") paymentLabel = "Dinheiro (no dia)";

  const total = currentQuantity * appConfig.ticketPrice;
  const formattedTotal = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Additional participants names
  const extraParticipants = [];
  document.querySelectorAll(".extra-participant-name").forEach(input => {
    if (input.value.trim()) extraParticipants.push(input.value.trim());
  });

  // Construct Clean, Direct WhatsApp Message
  let message = `*INSCRIÇÃO - WORKSHOP DE MISSÕES* 📖🔥\n\n`;
  message += `👤 *Nome:* ${name}\n`;
  message += `🎂 *Idade:* ${age} anos\n`;
  message += `📱 *WhatsApp:* ${phone}\n`;
  message += `🎟️ *Vagas:* ${currentQuantity} (${formattedTotal})\n`;
  
  if (extraParticipants.length > 0) {
    message += `👥 *Outros Inscritos:* ${extraParticipants.join(", ")}\n`;
  }

  message += `💳 *Forma de Pagamento:* ${paymentLabel}\n`;

  if (notes) {
    message += `📝 *Observação:* ${notes}\n`;
  }

  message += `\n📍 *Local:* ${appConfig.eventLocation}\n`;
  message += `📅 *Data:* ${appConfig.eventDateDisplay}\n\n`;
  message += `Olá! Fiz minha inscrição no site para o Workshop com o Pr. Marcos Mattos. Seguem meus dados para confirmação da vaga! 🙏`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${appConfig.adminWhatsApp}?text=${encodedMessage}`;

  // Populate Modal Summary
  document.getElementById("modalSummaryName").textContent = name;
  document.getElementById("modalSummaryQty").textContent = `${currentQuantity}x vaga(s)`;
  document.getElementById("modalSummaryTotal").textContent = formattedTotal;
  document.getElementById("modalSummaryPayment").textContent = paymentLabel;
  document.getElementById("btnModalReopen").href = whatsappUrl;

  // Open WhatsApp in a new tab/window
  window.open(whatsappUrl, "_blank");

  // Show Success Modal
  const modal = document.getElementById("successModal");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeModal() {
  const modal = document.getElementById("successModal");
  if (modal) modal.classList.remove("active");
}

// Admin Settings Modal Logic
function openAdminModal() {
  const adminModal = document.getElementById("adminModal");
  if (!adminModal) return;

  document.getElementById("adminWhatsAppInput").value = appConfig.adminWhatsApp;
  document.getElementById("adminDateInput").value = appConfig.eventDateDisplay;
  document.getElementById("adminLocationInput").value = appConfig.eventLocation;
  adminModal.classList.add("active");
}

function closeAdminModal() {
  const adminModal = document.getElementById("adminModal");
  if (adminModal) adminModal.classList.remove("active");
}

function saveAdminSettings(e) {
  e.preventDefault();
  const rawPhone = document.getElementById("adminWhatsAppInput").value.replace(/\D/g, "");
  const dateStr = document.getElementById("adminDateInput").value.trim();
  const locationStr = document.getElementById("adminLocationInput").value.trim();

  if (!rawPhone || rawPhone.length < 10) {
    alert("Por favor, digite um número de WhatsApp válido (com DDD).");
    return;
  }

  saveConfig({
    adminWhatsApp: rawPhone,
    eventDateDisplay: dateStr || appConfig.eventDateDisplay,
    eventLocation: locationStr || appConfig.eventLocation
  });

  closeAdminModal();
  alert("Configurações atualizadas com sucesso!");
}

// Document Ready Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadStoredConfig();
  updateUiFromConfig();
  initCountdown();
  initFaq();

  // Phone mask
  const phoneInput = document.getElementById("whatsappPhone");
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => applyPhoneMask(e.target));
  }

  // Payment method change
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener("change", handlePaymentMethodChange);
  });

  // Quantity controls
  const btnMinus = document.getElementById("btnQtyMinus");
  const btnPlus = document.getElementById("btnQtyPlus");
  if (btnMinus) btnMinus.addEventListener("click", () => updateQuantity(-1));
  if (btnPlus) btnPlus.addEventListener("click", () => updateQuantity(1));

  // Form submit
  const form = document.getElementById("registrationForm");
  if (form) form.addEventListener("submit", handleFormSubmit);

  // Close modals on overlay click
  const successModal = document.getElementById("successModal");
  if (successModal) {
    successModal.addEventListener("click", (e) => {
      if (e.target === successModal) closeModal();
    });
  }

  const adminModal = document.getElementById("adminModal");
  if (adminModal) {
    adminModal.addEventListener("click", (e) => {
      if (e.target === adminModal) closeAdminModal();
    });
  }

  // Initial trigger for payment details
  handlePaymentMethodChange();
});
