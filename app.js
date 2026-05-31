/* ==========================================================================
   ASTRAEA APPLICATION LOGIC ENGINE (app.js)
   ========================================================================== */

// Global Application State
const appState = {
  activeTab: 'dashboard',
  guideProgress: 0,
  currentNiche: 'Luxury Beauty',
  shieldActive: true,
  terminalHistory: [],
  sessionSearchLogs: []
};

// Tabs Metadata for dynamic titles and descriptions
const tabsMetadata = {
  dashboard: {
    title: "Genel Bakış",
    desc: "Astraea Faceless AI Amazon Otomasyon Sistemi performans paneli."
  },
  guide: {
    title: "Kurulum Kılavuzu",
    desc: "Yüz göstermeden 7/24 çalışan Amazon affiliate otomasyonunuzu adım adım yapılandırın."
  },
  analyzer: {
    title: "Niş & Gelir Hesaplayıcı",
    desc: "Ürün fiyatları, komisyon oranları ve dönüşümlere göre kazanç projeksiyonları simülasyonu."
  },
  generator: {
    title: "AI Video Stüdyosu",
    desc: "Sosyal medyada yüksek izlenme getiren ürün tanıtım senaryoları ve HeyGen promptları üretin."
  },
  repurpose: {
    title: "Dağıtım Paneli",
    desc: "Repurpose.io entegrasyonu ile tek yüklemeyle videoları 134+ sosyal ağda otomatik yayınlayın."
  },
  hermes: {
    title: "Hermes Agentic OS",
    desc: "Nous-Hermes-v0.15 otonom ajan ekosistemi, ajan sürüleri ve terminal yönetim konsolu."
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupTabRouting();
  setupGuideChecklist();
  setupEarningsCalculator();
  setupNotificationDropdown();
  setupRepurposeSimulationLogs();
  setupTelegramConfig();
  
  // Initial draw of the calculator SVG chart
  updateCalculatorProjections();
});

// ==========================================================================
// 1. ROUTING & TAB NAVIGATION
// ==========================================================================
function setupTabRouting() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  // Update state
  appState.activeTab = tabId;

  // Toggle Nav Button Classes
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle Tab Content Panels
  document.querySelectorAll('.tab-content').forEach(panel => {
    if (panel.getAttribute('id') === `tab-${tabId}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Update Dynamic Header Text
  const meta = tabsMetadata[tabId];
  if (meta) {
    document.getElementById('current-tab-title').textContent = meta.title;
    document.getElementById('current-tab-desc').textContent = meta.desc;
  }

  // Focus terminal if switched to Hermes Agent
  if (tabId === 'hermes') {
    setTimeout(() => {
      const termInput = document.getElementById('terminal-input');
      if (termInput) termInput.focus();
    }, 100);
  }
}

// ==========================================================================
// 2. SETUP GUIDE & LOCALSTORAGE STATE PERSISTENCE
// ==========================================================================
function setupGuideChecklist() {
  const checkboxes = document.querySelectorAll('.guide-checkbox');
  
  // Load saved state
  checkboxes.forEach(cb => {
    const taskId = cb.getAttribute('data-task-id');
    const savedState = localStorage.getItem(`astraea_task_${taskId}`);
    if (savedState === 'true') {
      cb.checked = true;
    }
    
    // Add change listeners
    cb.addEventListener('change', () => {
      localStorage.setItem(`astraea_task_${taskId}`, cb.checked);
      calculateGuideProgress();
    });
  });

  calculateGuideProgress();
}

function toggleAccordion(accordionId) {
  const item = document.getElementById(accordionId);
  if (item) {
    item.classList.toggle('active');
  }
}

function calculateGuideProgress() {
  const checkboxes = document.querySelectorAll('.guide-checkbox');
  const total = checkboxes.length;
  let checkedCount = 0;

  checkboxes.forEach(cb => {
    if (cb.checked) checkedCount++;
  });

  const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  appState.guideProgress = percent;

  // Update UI Elements
  document.getElementById('guide-progress-text').textContent = `${percent}%`;
  document.getElementById('sidebar-progress-percent').textContent = `${percent}% Tamamlandı`;
  document.getElementById('sidebar-progress-fill').style.width = `${percent}%`;

  // Update Circular Progress Ring
  const ring = document.getElementById('guide-progress-ring');
  if (ring) {
    const radius = ring.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    ring.style.strokeDashoffset = offset;
  }

  // Trigger celebration on completion
  if (percent === 100) {
    showToast("🎉 Tebrikler! Tüm kurulum adımlarını tamamladınız. Otomasyonunuz hazır!");
    const ringText = document.getElementById('guide-progress-text');
    if (ringText) ringText.style.color = 'var(--green-secure)';
  }
}

// ==========================================================================
// 3. INTERACTIVE NICHE & EARNINGS CALCULATOR
// ==========================================================================
function setupEarningsCalculator() {
  const sliders = ['price', 'commission', 'views', 'ctr', 'cr'];
  
  sliders.forEach(key => {
    const slider = document.getElementById(`slide-${key}`);
    const display = document.getElementById(`val-${key}`);
    
    if (slider && display) {
      slider.addEventListener('input', () => {
        let val = parseFloat(slider.value);
        
        // Format display values
        if (key === 'price') display.textContent = `$${val.toLocaleString()}`;
        else if (key === 'commission') display.textContent = `${val}%`;
        else if (key === 'views') display.textContent = val.toLocaleString();
        else if (key === 'ctr' || key === 'cr') display.textContent = `${val}%`;

        updateCalculatorProjections();
      });
    }
  });
}

function loadNichePreset(price, comm, nicheName) {
  // Update state
  appState.currentNiche = nicheName;

  // Update presets visual styling active class
  document.querySelectorAll('.preset-card').forEach(card => {
    const nameSpan = card.querySelector('.preset-name');
    if (nameSpan && nameSpan.textContent.includes(nicheName)) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // Set Slider Values
  const priceSlider = document.getElementById('slide-price');
  const commSlider = document.getElementById('slide-commission');
  
  if (priceSlider && commSlider) {
    priceSlider.value = price;
    commSlider.value = comm;
    
    document.getElementById('val-price').textContent = `$${price}`;
    document.getElementById('val-commission').textContent = `${comm}%`;
    
    updateCalculatorProjections();
  }
}

function updateCalculatorProjections() {
  // Read current slider inputs
  const price = parseFloat(document.getElementById('slide-price').value);
  const comm = parseFloat(document.getElementById('slide-commission').value) / 100;
  const views = parseFloat(document.getElementById('slide-views').value);
  const ctr = parseFloat(document.getElementById('slide-ctr').value) / 100;
  const cr = parseFloat(document.getElementById('slide-cr').value) / 100;

  // Mathematical Model
  const dailyTraffic = views * ctr;
  const dailyReferrals = dailyTraffic * cr;
  const dailyEarnings = dailyReferrals * price * comm;

  // Projections
  const p30d = dailyEarnings * 30;
  const p90d = dailyEarnings * 90;
  const p1y = dailyEarnings * 365;
  const p5y = dailyEarnings * 365 * 5;

  // Update numeric displays in UI with counter animations
  animateValue('proj-30d', p30d);
  animateValue('proj-90d', p90d);
  animateValue('proj-1y', p1y);
  animateValue('proj-5y', p5y);

  // Redraw SVG Chart paths
  drawSVGChartPaths(p30d, p90d, p1y, p5y);
}

function animateValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

function drawSVGChartPaths(p30d, p90d, p1y, p5y) {
  // SVG size is 500x220, margins: left=50, right=480, top=20, bottom=180
  const x0 = 50, x1 = 157, x2 = 264, x3 = 372, x4 = 480;
  const yAxisZero = 180;
  const yAxisMax = 20;
  
  // Standardize scaling factor (Max projection plotted will be the swarm aggressive 5-year value)
  const maxVal = p5y * 2.5; // swarm multiplier is 2.5
  
  const getY = (val) => {
    if (maxVal === 0) return yAxisZero;
    const ratio = val / maxVal;
    return yAxisZero - (ratio * (yAxisZero - yAxisMax));
  };

  // Generate path coords for three trajectories
  // 1. Conservative (x0.5 multiplier)
  const cY0 = yAxisZero;
  const cY1 = getY(p30d * 0.5);
  const cY2 = getY(p90d * 0.5);
  const cY3 = getY(p1y * 0.5);
  const cY4 = getY(p5y * 0.5);
  
  // 2. Moderate (x1.0 multiplier)
  const mY0 = yAxisZero;
  const mY1 = getY(p30d);
  const mY2 = getY(p90d);
  const mY3 = getY(p1y);
  const mY4 = getY(p5y);

  // 3. Hermes Swarm (x2.5 multiplier)
  const sY0 = yAxisZero;
  const sY1 = getY(p30d * 2.5);
  const sY2 = getY(p90d * 2.5);
  const sY3 = getY(p1y * 2.5);
  const sY4 = getY(p5y * 2.5);

  // Update SVG paths using cubic bezier formatting
  document.getElementById('chart-path-conservative').setAttribute('d', 
    `M ${x0} ${cY0} C ${x0+30} ${cY0-10}, ${x1-30} ${cY1+10}, ${x1} ${cY1} C ${x1+30} ${cY1-10}, ${x2-30} ${cY2+10}, ${x2} ${cY2} C ${x2+30} ${cY2-10}, ${x3-30} ${cY3+10}, ${x3} ${cY3} C ${x3+30} ${cY3-20}, ${x4-30} ${cY4+10}, ${x4} ${cY4}`
  );
  
  document.getElementById('chart-path-moderate').setAttribute('d', 
    `M ${x0} ${mY0} C ${x0+30} ${mY0-15}, ${x1-30} ${mY1+15}, ${x1} ${mY1} C ${x1+30} ${mY1-15}, ${x2-30} ${mY2+15}, ${x2} ${mY2} C ${x2+30} ${mY2-15}, ${x3-30} ${mY3+15}, ${x3} ${mY3} C ${x3+30} ${mY3-25}, ${x4-30} ${mY4+15}, ${x4} ${mY4}`
  );

  document.getElementById('chart-path-swarm').setAttribute('d', 
    `M ${x0} ${sY0} C ${x0+30} ${sY0-30}, ${x1-30} ${sY1+20}, ${x1} ${sY1} C ${x1+30} ${sY1-20}, ${x2-30} ${sY2+20}, ${x2} ${sY2} C ${x2+30} ${sY2-20}, ${x3-30} ${sY3+20}, ${x3} ${sY3} C ${x3+30} ${sY3-35}, ${x4-30} ${sY4+20}, ${x4} ${sY4}`
  );
}

// ==========================================================================
// 4. AI VIDEO SCRIPT & PROMPT STUDIO
// ==========================================================================
function generateScripts(e) {
  e.preventDefault();
  
  const name = document.getElementById('prod-name').value;
  const hook = document.getElementById('prod-hook').value;
  const target = document.getElementById('prod-target').value;
  const framework = document.getElementById('prod-framework').value;
  
  let script = "";
  let heygen = "";
  let captions = "";

  // Compile templates based on framework selected
  if (framework === 'problem-solution') {
    script = `[0:00 - 0:08] HOOK (ACILIK):
Görsel: Bir kişinin derin uyku çekmeye çalışırken sürekli yatakta döndüğü yorgun görüntüsü.
Seslendirme: "Günde 8 saat uyuduğunuz halde sabahları sanki kamyon çarpmış gibi uyanmaktan bıktınız mı?"
SFX: Yüksek tonlu gerilim sesi, anlık patlama.

[0:08 - 0:20] PROBLEM AÇIKLAMASI:
Görsel: Boynunu ovalayan, boyun omurlarını gösteren 3D anatomi görseli.
Seslendirme: "Bunun nedeni uykusuzluk değil, başınızı koyduğunuz sıradan yastıkların boyun omurganıza uyguladığı yanlış baskı. Boynunuz gece boyunca yanlış açıda kalıyor."

[0:20 - 0:35] ÇÖZÜM & KANIT (Ürün Tanıtımı):
Görsel: ${name} görüntüsü, özel ortopedik kavis yapısının başı nazikçe nasıl sardığı gösterilir.
Seslendirme: "İşte bu problemi kökten çözen ${name}. ${hook}. Özel hafızalı köpük yapısı baş ve boynunuzun tam şeklini alır ve omurganızı mükemmel hizalar."

[0:35 - 0:45] HAREKETE GEÇİRİCİ CTA:
Görsel: Yatakta mükemmel gülümsemeyle uyanan mutlu insan. Profildeki linki işaret eden oklar.
Seslendirme: "Hayatınızı değiştirecek bu uyku konforuna geçmek için profilimdeki Amazon linkine tıklayın. Sınırlı indirim fırsatını kaçırmayın!"`;

    heygen = `Avatar: "Marcus - Modern Tech Casual"
Ses: "Turkish male - Deep Friendly"
Arka Plan: Modern, minimal, hafif loş bir yatak odası (Warm glassmorphism lighting).
Ürün Görseli Yerleşimi: HeyGen Product Placement aracılığıyla Marcus, elinde ${name} yastığını tutuyor ve ürünün kıvrımlarını göstererek konuşuyor.
Prompt Talimatı: "Create a highly realistic faceless product review video where a professional avatar explains the body comfort benefits of ${name}. Keep hands gesturing towards the product shape. Avatar should look authentic and trustable, targeting ${target}."`;

    captions = `Altyazı Stili: "Style: Bold Neon Purple / Yellow Accent"
Font: Montserrat Black (Büyük harflerle hızlı akan altyazı)
Ses Efektleri (SFX):
- 0:01s: Anlık "whoosh" geçiş sesi.
- 0:08s: Kalp atışı "heartbeat" derin bas efekti.
- 0:22s: Teknolojik parıltı "glisten" sesi.
Görsel Efektler: Kelimeler seslendirildikçe vurgulu kelimeler (bıktınız mı, omurga, ${name}) yeşil ve sarı parlayan neon renklerle büyür.`;

  } else if (framework === 'top3') {
    script = `[0:00 - 0:08] HOOK (MERAK):
Görsel: Ürünün fütüristik tasarımı ve hızlı kutu açılışı geçişleri.
Seslendirme: "Eğer ${target} biriyseniz, hayatınızı 10 kat kolaylaştıracak bu Amazon mucizesini kesinlikle görmelisiniz!"
SFX: Fast pop / Synthwave vurmalı vuruş.

[0:08 - 0:22] MADDE 1:
Görsel: Ürünün ana özelliği gösterilir.
Seslendirme: "Neden 1: ${hook}. Bu özellik rakiplerinde yok ve işinizi anında kolaylaştırıyor."

[0:22 - 0:32] MADDE 2 & 3:
Görsel: Ürünün kullanım pratikliği ve estetik detayları.
Seslendirme: "Neden 2: Taşınabilir olması ve premium materyali. Neden 3: Şu an Amazon'da 5 yıldızlı binlerce kullanıcı yorumuna sahip olması."

[0:32 - 0:45] CTA:
Görsel: Satın alma linki görseli, profildeki linke parmakla işaret.
Seslendirme: "${name} ürününe özel indirimli fiyatla ulaşmak için profilimdeki Amazon satış ortağı linkine şimdi tıklayın!"`;

    heygen = `Avatar: "Bella - Casual Friendly Female"
Ses: "Turkish female - Warm Energetic"
Arka Plan: Şık, aydınlık bir yaşam odası (Cosy aesthetic home studio).
Ürün Görseli Yerleşimi: Bella, elinde ${name} ürününü hevesli ve enerjik bir şekilde sallayarak özelliklerini madde madde el işaretleriyle anlatıyor.
Prompt: "High conversion product advocate video. Bella introduces ${name} with three clear bullet points. Product is placed on a glass table next to her, zooming in during feature highlights. Dynamic light background."`;

    captions = `Altyazı Stili: "Style: Dynamic TikTok Style (Yellow/White)"
Font: The Bold Font (Her karede en fazla 2-3 kelime)
Ses Efektleri:
- Her madde geçişinde (Neden 1, Neden 2): Hızlı kamera deklanşör sesi "shutter snap".
- Önemli vurgularda pop sesleri.
Görsel Efektler: "Neden 1" yazısı ekranda kocaman 3D neon animasyonla belirir.`;

  } else { // aesthetic unboxing
    script = `[0:00 - 0:10] HOOK (ESTETİK DOYUM):
Görsel: ASMR tarzında kutunun yavaşça açılması, koruyucu jelatinin soyulması.
Seslendirme: "Amazon'dan aldığım ve odamın tüm havasını değiştiren o o estetik ürün sonunda geldi..."
SFX: ASMR kutu açılım sürtünmesi, jelatin yırtılma sesi.

[0:10 - 0:25] DETAY AÇIKLAMASI:
Görsel: Ürünün loş ışık altındaki dokusu, yakından premium dikişleri/detayları.
Seslendirme: "${name}. Minimalist tasarımı sevenler için üretilmiş. ${hook}. Dokunduğunuz anda o kalite hissini alıyorsunuz."

[0:25 - 0:40] KULLANIM ANLARI & CTA:
Görsel: Ürünün odanın köşesindeki şık duruşu. Profil linkine parmak ucu işareti.
Seslendirme: "Eğer siz de evinizde bu modern ve konforlu havayı yakalamak isterseniz, indirimli Amazon linkini profilime bıraktım."`;

    heygen = `Avatar: "Aria - Premium Elegance Female"
Ses: "Turkish female - Whisper Quiet/Sleek"
Arka Plan: Aşırı lüks, minimalist beton-ahşap karışımı loft daire (Aesthetic interior).
Ürün Görseli: Aria, yavaş ve zarif hareketlerle ${name} kutusunu açıyor.
Prompt: "Aesthetic ASMR-oriented marketing video. High-end lighting, focusing heavily on ${name} texture and premium packaging. Target: ${target}. Soft color correction."`;

    captions = `Altyazı Stili: "Style: Minimalist Elegant Serif (Beige / White)"
Font: Playfair Display (İtalik ve zarif altyazı akışı)
Ses Efektleri:
- Kutunun açılma anında yüksek frekanslı yumuşak rüzgar "soft sweep" efekti.
- Arkada çok kısık sesli lo-fi chill müzik.
Görsel Efektler: Ekranda hafif eskitilmiş film grenleri ve yavaş geçişler.`;
  }

  // Update Textareas
  document.getElementById('script-text-area').value = script;
  document.getElementById('heygen-text-area').value = heygen;
  document.getElementById('captions-text-area').value = captions;

  showToast("⚡ Pazarlama scripti ve yapay zeka promptları başarıyla üretildi!");
}

function switchOutputTab(outTabId) {
  document.querySelectorAll('.output-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-out-tab') === outTabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.output-tab-content').forEach(content => {
    if (content.getAttribute('id') === outTabId) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

function copyToClipboard(textareaId) {
  const textEl = document.getElementById(textareaId);
  if (textEl) {
    textEl.select();
    textEl.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(textEl.value)
      .then(() => {
        showToast("📋 Panoya başarıyla kopyalandı!");
      })
      .catch(() => {
        showToast("❌ Kopyalama başarısız.");
      });
  }
}

// Helper to show floating toast
function showToast(message) {
  const toaster = document.createElement('div');
  toaster.className = 'toaster';
  toaster.textContent = message;
  document.body.appendChild(toaster);
  
  setTimeout(() => {
    toaster.style.opacity = '0';
    toaster.style.transform = 'translateY(10px)';
    setTimeout(() => {
      toaster.remove();
    }, 300);
  }, 2500);
}

// ==========================================================================
// 5. REPURPOSE.IO MULTI-CHANNEL DISTRIBUTION HUB SIMULATOR
// ==========================================================================
function togglePipelineChannel(channelId) {
  const switchEl = document.getElementById(`switch-${channelId}`);
  const nodeEl = document.getElementById(`node-${channelId}`);
  const statusEl = document.getElementById(`status-${channelId}`);
  const pathEl = document.getElementById(`path-${channelId}`);
  const logConsole = document.getElementById('repurpose-logs-console');
  
  const timeStr = new Date().toLocaleTimeString();

  if (switchEl && switchEl.checked) {
    // Enable channel
    nodeEl.classList.add('active');
    statusEl.textContent = "Bağlı";
    statusEl.className = "node-status text-cyan";
    if (pathEl) pathEl.classList.add('active-pulse');

    // Append Log
    const newLog = document.createElement('div');
    newLog.className = 'log-entry';
    newLog.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-tag tag-${channelId}">[${channelId.toUpperCase()}]</span> Connection bridge established. Trigger rules updated.`;
    logConsole.insertBefore(newLog, logConsole.firstChild);
  } else {
    // Disable channel
    nodeEl.classList.remove('active');
    statusEl.textContent = "Bağlantısız";
    statusEl.className = "node-status text-muted";
    if (pathEl) pathEl.classList.remove('active-pulse');

    // Append Log
    const newLog = document.createElement('div');
    newLog.className = 'log-entry';
    newLog.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-tag tag-system">[SYSTEM]</span> Rota bağlantısı kesildi: ${channelId.toUpperCase()}`;
    logConsole.insertBefore(newLog, logConsole.firstChild);
  }
}

function setupRepurposeSimulationLogs() {
  // Mock simulation intervals removed for production release.
}

// ==========================================================================
// 6. HERMES AGENTIC OS CONTROL SUITE & TERMINAL PARSER
// ==========================================================================
function toggleShield() {
  const shieldCb = document.getElementById('switch-shield');
  const badge = document.getElementById('shield-badge');
  const screen = document.getElementById('terminal-screen');
  
  if (shieldCb && badge) {
    if (shieldCb.checked) {
      badge.textContent = "SHIELD ACTIVE";
      badge.className = "badge badge-green";
      appState.shieldActive = true;
      appendTerminalLine("SYSTEM", "Prompt Injection Shield ACTIVATED. Security checks running in background.");
    } else {
      badge.textContent = "SHIELD INACTIVE";
      badge.className = "badge badge-pink";
      appState.shieldActive = false;
      appendTerminalLine("WARNING", "Prompt Injection Shield DEACTIVATED. Vulnerable mode enabled.");
    }
  }
}

function runBootTest() {
  const container = document.getElementById('boot-progress-container');
  const fill = document.getElementById('boot-progress-fill');
  const val = document.getElementById('boot-time-val');
  const triggerBtn = document.getElementById('boot-trigger');
  
  if (!container || !fill || !triggerBtn) return;
  
  triggerBtn.disabled = true;
  container.style.display = 'block';
  fill.style.style = '0%';
  
  appendTerminalLine("SYSTEM", "Hermes Agent shutdown initiated...");
  
  let progress = 0;
  const startTime = performance.now();
  
  const interval = setInterval(() => {
    progress += 10;
    fill.style.width = `${progress}%`;
    
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    val.textContent = `${elapsed}s`;
    
    if (progress >= 100) {
      clearInterval(interval);
      triggerBtn.disabled = false;
      
      const totalElapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      document.getElementById('header-boot-speed').textContent = `${totalElapsed}s (Trimmed)`;
      
      appendTerminalLine("SUCCESS", `Hermes Agent v0.15 booted in ${totalElapsed}s! Codebase size: 3.8K lines (76% optimized refactor).`);
      
      // Update UI Statuses
      document.getElementById('sidebar-agent-status').textContent = `Hermes v0.15: Online`;
      showToast(`⚡ Hermes Boot Test completed in ${totalElapsed}s!`);
    }
  }, 60);
}

// Terminal commands controller
function executeTerminalCommand(e) {
  e.preventDefault();
  
  const inputEl = document.getElementById('terminal-input');
  if (!inputEl) return;
  
  const cmdRaw = inputEl.value.trim();
  if (cmdRaw === "") return;
  
  // Save input history
  appState.terminalHistory.push(cmdRaw);
  
  // Echo command in screen
  appendTerminalLine("USER", cmdRaw, true);
  
  // Clear input field
  inputEl.value = "";
  
  // Command Parsing state machine
  const args = cmdRaw.split(" ");
  const command = args[0].toLowerCase();
  
  if (command === 'help') {
    appendTerminalLine("HERMES", "Mevcut Sistem Komutları:\n" +
      "  help                      - Desteklenen komutları listeler.\n" +
      "  clear                     - Terminal ekranını temizler.\n" +
      "  hermes update             - En yeni Hermes v0.15 kararlı sürümünü sunucudan çeker.\n" +
      "  hermes hunt --niche <tag> - Amazon Best Sellers üzerinde otonom ürün avı simüle eder.\n" +
      "  hermes swarm --task <msg> - Ajan sürüsünü (triage ve paralel) tetikler.");
  } 
  else if (command === 'clear') {
    const screen = document.getElementById('terminal-screen');
    if (screen) screen.innerHTML = "";
  } 
  else if (command === 'hermes' && args[1] === 'update') {
    appendTerminalLine("HERMES", "Bağlantı kuruluyor: secure-node-9.nous.research...");
    setTimeout(() => {
      appendTerminalLine("HERMES", "En son Velocity v0.15.226 kararlı sürümü bulundu. İndiriliyor (3.4 MB)...");
      setTimeout(() => {
        appendTerminalLine("SUCCESS", "Paket başarıyla açıldı. 16.000 satırlık hantal devasa kod dosyaları siliniyor...");
        setTimeout(() => {
          appendTerminalLine("SUCCESS", "Temizleme tamamlandı: %76 küçültülmüş hafif modüler mimariye geçildi.");
          appendTerminalLine("SUCCESS", "Hermes Agent v0.15 başarıyla güncellendi! Sistem açılışı 1 saniyenin altına ayarlandı.");
          document.getElementById('header-boot-speed').textContent = `0.68s (Trimmed)`;
        }, 800);
      }, 800);
    }, 600);
  } 
  else if (command === 'hermes' && args[1] === 'hunt') {
    const nicheArg = args[3] || 'general';
    appendTerminalLine("HERMES", `[Swarm Task] Amazon Product Hunter ajanı başlatılıyor. Hedef niş: ${nicheArg.toUpperCase()}`);
    
    // Animate Swarm Cards Active State
    setSwarmAgentState('agent-hunter', 'working');
    setSwarmAgentState('agent-browser', 'working');
    document.getElementById('triage-status-val').textContent = `ÜRÜN AVI ÇALIŞIYOR (${nicheArg.toUpperCase()})`;
    
    setTimeout(() => {
      appendTerminalLine("HUNTER", `Amazon best sellers listeleri browser.sh yardımıyla kazınıyor...`);
      setTimeout(() => {
        appendTerminalLine("HUNTER", `Filtrelendi: Yüksek komisyon ve 4.5+ yıldızlı ürünler bulunuyor.`);
        setTimeout(() => {
          appendTerminalLine("SUCCESS", `Ürün bulundu! ASIN: B08X123456 | Kategori: ${nicheArg.toUpperCase()} | Fiyat: $75 | Komisyon: 8%`);
          
          setSwarmAgentState('agent-hunter', 'completed');
          setSwarmAgentState('agent-browser', 'completed');
          document.getElementById('triage-status-val').textContent = `TAMAMLANDI`;
          
          // Populate calculator sliders automatically with this hunt!
          loadNichePreset(75, 8, nicheArg.toUpperCase());

          // Send real Telegram alert if configured
          const token = localStorage.getItem('astraea_tg_token');
          const chatId = localStorage.getItem('astraea_tg_chatid');
          if (token && chatId && document.getElementById('notify-telegram').checked) {
            const text = `🕵️‍♂️ *Astraea Otonom Ürün Avcısı:*\n\nKategori: *${nicheArg.toUpperCase()}*\nASIN: *B08X123456*\nFiyat: *$75*\nKomisyon: *%8*\n\nBulunan ürün Astraea gelir hesaplayıcıya aktarıldı ve AI Video Stüdyosu için hazırlandı! 🤖📦`;
            const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}&parse_mode=Markdown`;
            fetch(url).catch(e => console.error(e));
          }
        }, 1000);
      }, 1000);
    }, 600);
  } 
  else if (command === 'hermes' && args[1] === 'swarm') {
    const taskDetails = args.slice(2).join(" ").replace('--task ', '');
    appendTerminalLine("HERMES", `[Triage System] Yeni otonom iş emri alındı: "${taskDetails}"`);
    
    document.getElementById('triage-status-val').textContent = `TRIAGE ANALİZİ YAPILIYOR`;
    
    setTimeout(() => {
      appendTerminalLine("TRIAGE", `İş alt görevlere bölünüyor: [1] Ürün avla, [2] Senaryo yaz, [3] Repurpose rotasını tetikle.`);
      
      // Cascade Swarm Agents to Work Paralelly
      setSwarmAgentState('agent-hunter', 'working');
      setSwarmAgentState('agent-writer', 'working');
      setSwarmAgentState('agent-scheduler', 'working');
      setSwarmAgentState('agent-browser', 'working');
      
      document.getElementById('triage-status-val').textContent = `PARALEL SWARM ÇALIŞIYOR`;
      
      setTimeout(() => {
        appendTerminalLine("HUNTER", `[Amazon Hunter] En popüler 5 ASIN bulundu.}`);
        appendTerminalLine("WRITER", `[Script Specialist] Problem-Çözüm kancalı HeyGen render senaryosu yazıldı.`);
        
        setTimeout(() => {
          appendTerminalLine("SCHEDULER", `[Repurpose Router] Otomatik filigran silme kuyruğu güncellendi. Pinterest pin rotası aktif edildi.`);
          appendTerminalLine("SUCCESS", `[Swarm Complete] "${taskDetails}" iş paketi başarıyla tamamlandı. Workspace tamamlandı! Akıllı bildirimler tetikleniyor.`);
          
          setSwarmAgentState('agent-hunter', 'completed');
          setSwarmAgentState('agent-writer', 'completed');
          setSwarmAgentState('agent-scheduler', 'completed');
          setSwarmAgentState('agent-browser', 'completed');
          document.getElementById('triage-status-val').textContent = `TAMAMLANDI`;
          
          // Update Dashboard Console text
          document.getElementById('dashboard-console-log').textContent = `Workspace completed: Swarm successfully finished task "${taskDetails}".`;
          
          // Play smart notification beep/alert simulation
          triggerSmartNotifications(taskDetails);
        }, 1200);
      }, 1000);
    }, 800);
  } 
  else {
    // Conversational fallback
    appendTerminalLine("HERMES", "Düşünüyor...");
    setTimeout(() => {
      appendTerminalLine("HERMES", `Merhaba! Ben Nous Hermes v0.15 Velocity asistanınız. Komut satırına '${cmdRaw}' yazdınız. Bu otonom yapıda Amazon Associates kazançlarınızı katlamak için 'help' yazarak özel komutlarımı test edebilirsiniz!`);
    }, 500);
  }
}

function appendTerminalLine(sender, text, isInput = false) {
  const screen = document.getElementById('terminal-screen');
  if (!screen) return;
  
  const line = document.createElement('div');
  line.className = 'term-line';
  
  const timeStr = new Date().toLocaleTimeString();
  
  if (isInput) {
    line.innerHTML = `<span class="terminal-prompt">hermes@astraea:~$</span> <span style="color:#ffffff">${text}</span>`;
  } else {
    let tagColor = '#8b5cf6'; // default purple
    if (sender === 'SYSTEM') tagColor = '#eab308'; // yellow
    if (sender === 'SUCCESS') tagColor = '#22c55e'; // green
    if (sender === 'WARNING') tagColor = '#ec4899'; // pink
    if (sender === 'HUNTER' || sender === 'WRITER' || sender === 'SCHEDULER' || sender === 'TRIAGE') tagColor = '#06b6d4'; // cyan
    
    line.innerHTML = `<span style="color: ${tagColor}; font-weight:700">[${sender}]</span> ${text.replace(/\n/g, '<br>  ')}`;
  }
  
  screen.appendChild(line);
  
  // Auto scroll to bottom
  screen.scrollTop = screen.scrollHeight;
}

function setSwarmAgentState(agentId, state) {
  const agentEl = document.getElementById(agentId);
  if (!agentEl) return;
  
  const stateBadge = agentEl.querySelector('.swarm-state');
  if (!stateBadge) return;
  
  // Clear previous states
  stateBadge.className = 'swarm-state';
  agentEl.classList.remove('active');
  
  if (state === 'idle') {
    stateBadge.textContent = 'Idle';
    stateBadge.classList.add('state-idle');
  } else if (state === 'working') {
    stateBadge.textContent = 'Working';
    stateBadge.classList.add('state-working');
    agentEl.classList.add('active');
  } else if (state === 'completed') {
    stateBadge.textContent = 'Completed';
    stateBadge.classList.add('state-completed');
  }
}

function sendSwarmDirective() {
  const inputEl = document.getElementById('swarm-directive-input');
  if (!inputEl) return;
  
  const val = inputEl.value.trim();
  if (val === "") return;
  
  appendTerminalLine("SYSTEM", `Direct instruction injected to running swarm queue: "${val}"`);
  showToast("📥 Swarm yönlendirmesi ajana iletildi!");
  inputEl.value = "";
}

// 20ms Session Search Script
function searchSessionLogs() {
  const query = document.getElementById('session-search-input').value.toLowerCase().trim();
  const perfBadge = document.getElementById('search-perf-badge');
  const resultsList = document.getElementById('search-results-list');
  
  if (!resultsList || !perfBadge) return;
  
  if (query === "") {
    perfBadge.style.display = 'none';
    resultsList.innerHTML = "";
    return;
  }
  
  const startTime = performance.now();
  
  // Instant Javascript filter over mock logs array
  const filtered = appState.sessionSearchLogs.filter(log => 
    log.title.toLowerCase().includes(query) || log.content.toLowerCase().includes(query)
  );

  const elapsed = (performance.now() - startTime).toFixed(2);
  
  // Render results
  resultsList.innerHTML = "";
  
  if (filtered.length === 0) {
    resultsList.innerHTML = `<div class="text-muted text-small" style="padding:4px;">Hiçbir seans kaydı bulunamadı.</div>`;
  } else {
    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'search-item';
      card.innerHTML = `<strong>${item.title}</strong> <span class="text-muted" style="font-size:0.6rem">(${item.date})</span><br><span class="text-muted">${item.content}</span>`;
      resultsList.appendChild(card);
    });
  }

  // Display performance time (strictly under 20ms!)
  perfBadge.style.display = 'inline-block';
  perfBadge.textContent = `${elapsed}ms | $0.00 Cost`;
}

// Smart push notifications simulator
function triggerSmartNotifications(taskName) {
  const timeStr = new Date().toLocaleTimeString();
  
  if (document.getElementById('notify-desktop').checked) {
    showToast(`🔔 [Masaüstü Bildirimi] Görev Tamamlandı: ${taskName}`);
  }
  
  if (document.getElementById('notify-telegram').checked) {
    const logConsole = document.getElementById('repurpose-logs-console');
    const newLog = document.createElement('div');
    newLog.className = 'log-entry';
    newLog.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-tag tag-system">[TELEGRAM]</span> Push alert successfully transmitted to connected mobile client. Title: Workspace complete.`;
    logConsole.insertBefore(newLog, logConsole.firstChild);

    // Real Telegram Send
    const token = localStorage.getItem('astraea_tg_token');
    const chatId = localStorage.getItem('astraea_tg_chatid');
    if (token && chatId) {
      const text = `🤖 *Astraea Otonom Ajan Raporu:*\n\n"${taskName}" otonom görevi başarıyla tamamlandı! 7/24 çalışan sistem aktif. 🚀`;
      const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}&parse_mode=Markdown`;
      fetch(url).catch(e => console.error("Telegram notify failed", e));
    }
  }
}

// ==========================================================================
// 7. NOTIFICATION BELL & DROPDOWN HEADER
// ==========================================================================
function setupNotificationDropdown() {
  const trigger = document.getElementById('bell-trigger');
  const dropdown = document.getElementById('notification-dropdown');
  const badge = document.getElementById('bell-badge');

  if (!trigger || !dropdown) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('active');
  });

  // Reading notifications decreases count
  dropdown.addEventListener('click', () => {
    if (badge) {
      badge.style.display = 'none';
    }
  });
}

// ==========================================================================
// 8. REAL TELEGRAM BOT INTEGRATION CONTROLLERS
// ==========================================================================
function setupTelegramConfig() {
  const tokenInput = document.getElementById('tg-bot-token');
  const chatIdInput = document.getElementById('tg-chat-id');
  const storedToken = localStorage.getItem('astraea_tg_token');
  const storedChatId = localStorage.getItem('astraea_tg_chatid');
  
  if (tokenInput && storedToken) tokenInput.value = storedToken;
  if (chatIdInput && storedChatId) chatIdInput.value = storedChatId;
}

function sendRealTelegramTest() {
  const token = document.getElementById('tg-bot-token').value.trim();
  const chatId = document.getElementById('tg-chat-id').value.trim();
  
  if (!token || !chatId) {
    showToast("⚠️ Lütfen hem Bot Token hem de Chat ID alanlarını doldurun!");
    return;
  }
  
  localStorage.setItem('astraea_tg_token', token);
  localStorage.setItem('astraea_tg_chatid', chatId);
  
  showToast("📤 Telegram'a test mesajı gönderiliyor...");
  
  const message = "🤖 *Astraea Sistem Bildirimi:*\n\nTelegram bot bağlantınız başarıyla doğrulandı ve Astraea otomasyon ekosistemine entegre edildi! 🎉";
  const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;
  
  fetch(url)
  .then(res => res.json())
  .then(data => {
    if (data.ok) {
      showToast("✅ Test mesajı başarıyla gönderildi! Telefonunuzu kontrol edin.");
      appendTerminalLine("SUCCESS", "Telegram Bot connection successfully verified. Active notification node ONLINE.");
    } else {
      showToast("❌ Gönderim başarısız! Token veya Chat ID hatalı.");
      appendTerminalLine("WARNING", `Telegram API Error: ${data.description}`);
    }
  })
  .catch(err => {
    showToast("❌ Ağ hatası oluştu!");
    appendTerminalLine("WARNING", `Telegram Connection Error: ${err.message}`);
  });
}
