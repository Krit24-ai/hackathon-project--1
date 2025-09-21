/* -------------------------
   /* -------------------------
   Configuration & constants
 ------------------------- */

const API_KEY = "AIzaSyBhGnO2Rn3134IQjL12SVUBfFYdPGf5Vig";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
const BG_FADE_INTERVAL = 9000;


/* -------------------------
  Background fade logic
------------------------- */
const bg1 = document.getElementById('bg1');
const bg2 = document.getElementById('bg2');
let bgToggle = true;
setInterval(() => {
    bgToggle = !bgToggle;
    bg1.classList.toggle('active', bgToggle);
    bg2.classList.toggle('active', !bgToggle);
}, BG_FADE_INTERVAL);

/* -------------------------
  Tab navigation
------------------------- */
function showTab(id, btn) {
    document.querySelectorAll('.tab').forEach(t => t.style.display = 'none');
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';

    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

/* -------------------------
  Chatbot & LLM integration
------------------------- */
function toggleChat() {
    const w = document.getElementById('chatWindow');
    if (w.style.display === 'flex' || w.style.display === 'block') {
        w.style.display = 'none';
    } else {
        w.style.display = 'flex';
        w.style.flexDirection = 'column';
        document.getElementById('chatInput').focus();
    }
}

function appendMessage(text, who = 'bot') {
    const container = document.getElementById('chatMessages');
    const p = document.createElement('div');
    p.className = who === 'bot' ? 'bot-message' : 'user-message';
    p.innerHTML = text;
    container.appendChild(p);
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    appendMessage(`<b>You:</b> ${escapeHtml(text)}`, 'user');
    input.value = '';
    appendMessage('Bot is typing...', 'bot');

    if (!API_KEY) {
        setTimeout(() => {
            const msgs = document.querySelectorAll('#chatMessages .bot-message');
            msgs[msgs.length - 1].remove();
            appendMessage(`<b>Bot:</b> (demo) For "${escapeHtml(text)}" — try: check soil pH, upload leaf image for detection, and avoid spraying before rain.`, 'bot');
        }, 900);
        return;
    }

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });
        const data = await res.json();
        const msgs = document.querySelectorAll('#chatMessages .bot-message');
        msgs[msgs.length - 1].remove();
        appendMessage(`<b>Bot:</b> ${escapeHtml(data.reply)}`, 'bot');
    } catch (e) {
        console.error(e);
        const msgs = document.querySelectorAll('#chatMessages .bot-message');
        if (msgs.length) msgs[msgs.length - 1].remove();
        appendMessage(`<b>Bot:</b> Error contacting AI. Showing demo reply: Check weather forecast & soil pH.`, 'bot');
    }
}

/* -------------------------
  Voice recognition (Chat + Queries)
------------------------- */
let recognition;

// init if supported
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    // generic handler (we’ll set active target before start)
    let activeTarget = null;
    let submitFn = null;

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (activeTarget) activeTarget.value = transcript;
        if (submitFn) submitFn();
    };
    recognition.onend = () => {
        if (activeTarget && activeTarget.id === "chatInput") {
            document.getElementById('startVoiceBtn').textContent = '🎙';
        }
        if (activeTarget && activeTarget.id === "queryText") {
            document.getElementById('voiceBtn').textContent = '🎙 Start voice';
        }
    };

    // Chatbot mic
    const startVoiceBtn = document.getElementById('startVoiceBtn');
    startVoiceBtn.onclick = () => {
        try {
            activeTarget = document.getElementById('chatInput');
            submitFn = sendMessage;
            recognition.start();
            startVoiceBtn.textContent = '⏺';
        } catch (err) {
            console.warn(err);
        }
    };

    // Queries mic
    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.onclick = () => {
        try {
            activeTarget = document.getElementById('queryText');
            submitFn = submitQuery;
            recognition.start();
            voiceBtn.textContent = '⏺ Listening...';
        } catch (err) {
            console.warn(err);
        }
    };

} else {
    // hide buttons if not supported
    document.getElementById('startVoiceBtn').style.display = 'none';
    document.getElementById('voiceBtn').style.display = 'none';
}


/* -------------------------
  Chat image upload
------------------------- */
function handleChatImage(ev) {
    const f = ev.target.files[0];
    if (!f) return;
    appendMessage(`<b>You sent an image:</b> ${escapeHtml(f.name)}`, 'user');
    appendMessage(`<b>Bot:</b> Processing image...`, 'bot');

    setTimeout(() => {
        const msgs = document.querySelectorAll('#chatMessages .bot-message');
        msgs[msgs.length - 1].remove();
        appendMessage(`<b>Bot:</b> (demo) Detected Early Blight. Recommendation: remove infected leaves, apply copper spray.`, 'bot');
    }, 1200);
}

/* -------------------------
  Fertilizer recommendation
------------------------- */
function recommendFertilizer() {
    const ph = parseFloat(document.getElementById('soilPH').value || '0');
    const npk = document.getElementById('soilNPK').value || '';
    const out = document.getElementById('fertResult');
    if (!ph || !npk) { out.innerText = 'Please enter pH and NPK values.'; return; }
    let rec = '';
    if (ph < 5.5) rec = 'Soil acidic: apply lime and organic compost; reduce urea.';
    else if (ph > 7.5) rec = 'Soil alkaline: consider elemental sulphur and zinc if deficient.';
    else rec = `pH OK: For NPK ${npk} — apply split nitrogen dose and basal P & K.`;
    out.innerHTML = `<b>Recommendation:</b> ${rec}`;
}

/* -------------------------
  Util
------------------------- */
function escapeHtml(s) {
    return ('' + s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* -------------------------
  Language Translations
------------------------- */
const translations = {
    en: {
        dashboard: "Dashboard",
        queries: "Queries",
        solutions: "Solutions",
        community: "Community",
        expert: "Expert Connect",
        profile: "Profile",
        settings: "Settings",
        chatbot: "AI Chatbot — Voice & Image",
        hello: "Hello! How can I help with your farming today?",
        soil: "🌾 Soil Health & Fertilizer",
        govt: "💰 Govt Schemes & Subsidies",
        weather: "🌦 Live Weather Advisory"
    },
    hi: {
        dashboard: "डैशबोर्ड",
        queries: "प्रश्न",
        solutions: "समाधान",
        community: "समुदाय",
        expert: "विशेषज्ञ से जुड़ें",
        profile: "प्रोफ़ाइल",
        settings: "सेटिंग्स",
        chatbot: "एआई चैटबॉट — वॉयस और इमेज",
        hello: "नमस्ते! खेती में आपकी कैसे मदद कर सकता हूँ?",
        soil: "🌾 मिट्टी की सेहत और खाद",
        govt: "💰 सरकारी योजनाएँ और सब्सिडी",
        weather: "🌦 लाइव मौसम सलाह"
    },
    ml: {
        dashboard: "ഡാഷ്‌ബോർഡ്",
        queries: "ചോദ്യങ്ങൾ",
        solutions: "പരിഹാരങ്ങൾ",
        community: "കമ്മ്യൂണിറ്റി",
        expert: "വിദഗ്ധ ബന്ധം",
        profile: "പ്രൊഫൈൽ",
        settings: "ക്രമീകരണങ്ങൾ",
        chatbot: "എഐ ചാറ്റ്‌ബോട്ട് — ശബ്ദവും ചിത്രവും",
        hello: "നമസ്കാരം! നിങ്ങളുടെ കൃഷിക്ക് എങ്ങനെ സഹായിക്കാം?",
        soil: "🌾 മണ്ണിന്റെ ആരോഗ്യം & വളം",
        govt: "💰 സർക്കാർ പദ്ധതികൾ & സബ്സിഡി",
        weather: "🌦 തത്സമയ കാലാവസ്ഥാ ഉപദേശം"
    },
    ta: {
        dashboard: "டாஷ்போர்டு",
        queries: "கேள்விகள்",
        solutions: "தீர்வுகள்",
        community: "சமூகம்",
        expert: "நிபுணர் தொடர்பு",
        profile: "சுயவிவரம்",
        settings: "அமைப்புகள்",
        chatbot: "ஏஐ அரட்டை — குரல் & படம்",
        hello: "வணக்கம்! விவசாயத்தில் எப்படி உதவலாம்?",
        soil: "🌾 மண்ணின் ஆரோக்கியம் & உரம்",
        govt: "💰 அரசு திட்டங்கள் & மானியங்கள்",
        weather: "🌦 நேரடி வானிலை ஆலோசனை"
    },
    te: {
        dashboard: "డాష్‌బోర్డ్",
        queries: "ప్రశ్నలు",
        solutions: "పరిష్కారాలు",
        community: "సమాజం",
        expert: "నిపుణుడు కనెక్ట్",
        profile: "ప్రొఫైల్",
        settings: "సెట్టింగ్స్",
        chatbot: "ఏఐ చాట్‌బాట్ — వాయిస్ & ఇమేజ్",
        hello: "హలో! మీ వ్యవసాయానికి ఎలా సహాయం చేయగలను?",
        soil: "🌾 నేల ఆరోగ్యం & ఎరువులు",
        govt: "💰 ప్రభుత్వ పథకాలు & సబ్సిడీలు",
        weather: "🌦 లైవ్ వాతావరణ సూచన"
    },
    kn: {
        dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        queries: "ಪ್ರಶ್ನೆಗಳು",
        solutions: "ಪರಿಹಾರಗಳು",
        community: "ಸಮುದಾಯ",
        expert: "ತಜ್ಞ ಸಂಪರ್ಕ",
        profile: "ಪ್ರೊಫೈಲ್",
        settings: "ಸೆಟ್ಟಿಂಗ್ಸ್",
        chatbot: "ಎಐ ಚಾಟ್‌ಬಾಟ್ — ಧ್ವನಿ & ಚಿತ್ರ",
        hello: "ನಮಸ್ಕಾರ! ಕೃಷಿಯಲ್ಲಿ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
        soil: "🌾 ಮಣ್ಣಿನ ಆರೋಗ್ಯ & ರಸಗೊಬ್ಬರ",
        govt: "💰 ಸರ್ಕಾರದ ಯೋಜನೆಗಳು & ಸಹಾಯಧನ",
        weather: "🌦 ನೇರ ಹವಾಮಾನ ಸಲಹೆ"
    }
};

/* -------------------------
  Change language function
------------------------- */
function changeLanguage(lang) {
    const t = translations[lang];
    if (!t) return;

    // Sidebar
    document.querySelector("button[onclick*='dashboard']").innerText = t.dashboard;
    document.querySelector("button[onclick*='queries']").innerText = t.queries;
    document.querySelector("button[onclick*='solutions']").innerText = t.solutions;
    document.querySelector("button[onclick*='community']").innerText = t.community;
    document.querySelector("button[onclick*='expert']").innerText = t.expert;
    document.querySelector("button[onclick*='profileTab']").innerText = t.profile;
    document.querySelector("button[onclick*='settings']").innerText = t.settings;

    // Chatbot
    document.querySelector(".chat-header").innerText = t.chatbot;
    const firstBotMsg = document.querySelector("#chatMessages .bot-message");
    if (firstBotMsg) firstBotMsg.innerText = t.hello;

    // Cards
    document.querySelector("#dashboard h2").innerText = t.dashboard;
    document.querySelector("#dashboard h3:nth-of-type(1)").innerText = t.weather;
    document.querySelector("#dashboard h3:nth-of-type(2)").innerText = t.soil;
    document.querySelector("#dashboard h3:nth-of-type(3)").innerText = t.govt;
}
/* -------------------------
  Expense & Profit Tracker
------------------------- */
let expenses = [];
let totalIncome = 0; // you can update this from other modules if needed

function saveExpense() {
    const desc = document.getElementById('expDesc').value.trim();
    const amt = parseFloat(document.getElementById('expAmount').value);

    if (!desc || isNaN(amt)) {
        alert("Please enter valid description and amount.");
        return;
    }

    expenses.push({ desc, amt });
    document.getElementById('expDesc').value = "";
    document.getElementById('expAmount').value = "";
    renderExpenses();
}

function clearExpenses() {
    expenses = [];
    renderExpenses();
}

function renderExpenses() {
    const list = document.getElementById('expenseList');
    list.innerHTML = "";

    if (expenses.length === 0) {
        list.innerHTML = "<p class='small'>No expenses added yet.</p>";
        return;
    }

    let total = 0;
    expenses.forEach((e, i) => {
        total += e.amt;
        const div = document.createElement('div');
        div.className = "small";
        div.style.marginBottom = "6px";
        div.innerHTML = `${i + 1}. <b>${escapeHtml(e.desc)}</b> — ₹${e.amt.toFixed(2)}`;
        list.appendChild(div);
    });

    // show total and profit
    const summary = document.createElement('div');
    summary.style.marginTop = "10px";
    summary.innerHTML = `<b>Total Expenses:</b> ₹${total.toFixed(2)} <br>
                       <b>Estimated Profit:</b> ₹${(totalIncome - total).toFixed(2)}`;
    list.appendChild(summary);
}
// --------------------
// Live Weather with Leaflet
// --------------------
let weatherMap;
let weatherMarker;

// Initialize map
function initWeatherMap(lat = 11.25, lon = 75.78) { // default: Kochi, Kerala
    if (weatherMap) return;
    weatherMap = L.map('weatherMap').setView([lat, lon], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(weatherMap);
}

// Fetch weather from Open-Meteo
async function fetchWeather(lat = 11.25, lon = 75.78) {
    initWeatherMap(lat, lon);

    const weatherCard = document.getElementById('weatherCard');
    weatherCard.innerHTML = 'Loading weather...';

    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);
        const data = await res.json();

        if (!data.current_weather) {
            weatherCard.innerText = '⚠️ No weather data available.';
            return;
        }

        const w = data.current_weather;

        // Weather info
        const weatherText = `
            🌡 Temp: ${w.temperature}°C <br>
            💨 Windspeed: ${w.windspeed} km/h <br>
            🌦 Condition: ${w.weathercode} 
        `;
        weatherCard.innerHTML = weatherText;

        // Add/Update marker
        if (weatherMarker) {
            weatherMarker.setLatLng([lat, lon]).bindPopup(weatherText).openPopup();
        } else {
            weatherMarker = L.marker([lat, lon]).addTo(weatherMap).bindPopup(weatherText).openPopup();
        }

        weatherMap.setView([lat, lon], 8);

    } catch (err) {
        console.error(err);
        weatherCard.innerText = 'Error fetching weather.';
    }
}

// Optional: get user location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
    }, () => {
        fetchWeather(); // default location if denied
    });
} else {
    fetchWeather(); // default location
}
