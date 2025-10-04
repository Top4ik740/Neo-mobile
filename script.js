const API_KEY = "sk-ectUUc1IhSrPk8JPUIE1Vo886HRJvohX5rBL12PRkLwfQLVz";

const chatBox = document.getElementById("chat-box");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatList = document.getElementById("chat-list");
const newChatBtn = document.getElementById("new-chat");
const deleteChatBtn = document.getElementById("delete-chat");
const themeSelect = document.getElementById("theme-select");
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const sidebar = document.querySelector('.sidebar');
const overlay = document.getElementById('overlay');

let chats = {};
let currentChatId = createNewChat("Новый чат");

loadChat(currentChatId);
setTheme("neon");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  chats[currentChatId].push({ role: "user", content: userMessage });
  input.value = "";

  if (chats[currentChatId].length === 1) {
    const topic = userMessage.split(" ").slice(0, 4).join(" ");
    const li = document.querySelector(`#chat-list li[data-chat-id="${currentChatId}"]`);
    if (li) li.textContent = topic || "Новый чат";
  }

  try {
    const response = await fetch("https://api.cometapi.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: chats[currentChatId],
      }),
    });

    const data = await response.json();
    const botMessage = data.choices?.[0]?.message?.content || "⚠️ Нет ответа.";
    appendMessage("bot", botMessage);
    chats[currentChatId].push({ role: "assistant", content: botMessage });
    saveChats();
  } catch (error) {
    appendMessage("bot", "❌ Ошибка подключения.");
    console.error("CometAPI error:", error);
  }
});

newChatBtn.addEventListener("click", () => {
  const id = createNewChat();
  loadChat(id);
});

deleteChatBtn.addEventListener("click", () => {
  if (confirm("Удалить текущий чат?")) {
    delete chats[currentChatId];
    saveChats();
    const chatItem = document.querySelector(`#chat-list li[data-chat-id="${currentChatId}"]`);
    if (chatItem) chatItem.remove();
    const nextId = Object.keys(chats)[0] || createNewChat("Новый чат");
    loadChat(nextId);
  }
});

themeSelect.addEventListener("change", () => {
  setTheme(themeSelect.value);
});

// Mobile menu toggle
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.toggle('open');
    if (isOpen) {
      overlay.classList.add('visible');
      overlay.setAttribute('aria-hidden', 'false');
    } else {
      overlay.classList.remove('visible');
      overlay.setAttribute('aria-hidden', 'true');
    }
  });
}

// Close sidebar when clicking overlay
if (overlay) {
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
  });
}

// 🔧 Вспомогательные функции
function appendMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `message ${role}`;
  msg.textContent = `${role === "user" ? "Вы" : "NEO AI"}: ${text}`;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function loadChat(id) {
  chatBox.innerHTML = "";
  currentChatId = id;
  highlightChat(id);

  if (chats[id].length === 0) {
    showEmptyMessage();
  } else {
    chats[id].forEach(msg => appendMessage(msg.role, msg.content));
  }
}

function createNewChat(title = "Новый чат") {
  const id = "chat-" + Date.now();
  chats[id] = [];
  addChatToList(id, title);
  saveChats();
  return id;
}

function addChatToList(id, title) {
  const li = document.createElement("li");
  li.textContent = title;
  li.setAttribute("data-chat-id", id);
  li.onclick = () => {
    loadChat(id);
    // if on mobile, close sidebar after selecting
    if (window.innerWidth <= 720) {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
      overlay.setAttribute('aria-hidden', 'true');
    }
  };
  chatList.appendChild(li);
}

function highlightChat(id) {
  [...chatList.children].forEach(li => li.classList.remove('active'));
  const chatItem = document.querySelector(`#chat-list li[data-chat-id="${id}"]`);
  if (chatItem) {
    chatItem.classList.add('active');
  }
}

function saveChats() {
  localStorage.setItem("neo-chats", JSON.stringify(chats));
}

function setTheme(theme) {
  let accent;
  switch (theme) {
    case "neon": accent = "#00ff99"; break;
    case "blue": accent = "#00aaff"; break;
    case "purple": accent = "#aa00ff"; break;
    case "red": accent = "#ff4444"; break;
    default: accent = "#00ff99";
  }
  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--glow", `0 0 10px ${accent}, 0 0 20px ${accent}`);
}

function showEmptyMessage() {
  const msg = document.createElement("div");
  msg.className = "message bot";
  msg.textContent = "💬 У тебя пока нет сообщений. Напиши что-нибудь!";
  chatBox.appendChild(msg);
}

// Auto-close sidebar on window resize to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 720) {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
  }
});