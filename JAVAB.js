// Variables globales
let isPlaying = false;
let currentSlide = 0;
let totalSlides = 0;
let enableMusic = false;

// ===== Música de fondo (archivo local musica.mp3) =====
// Se usa un <audio> nativo en lugar de YouTube. La regla de Safari/iOS (y de
// Chrome/Firefox) es que el audio solo puede arrancar dentro de un gesto del
// usuario: por eso audio.play() se llama de forma SÍNCRONA dentro del click
// del botón "Ingresar con música", que es el detonante de la música.
function getAudio() {
    return document.getElementById('bgMusic');
}

function hideWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.style.display = 'none';
}

function showMusicPlayer() {
    const musicPlayer = document.getElementById('musicPlayer');
    if (musicPlayer) musicPlayer.style.display = 'block';
}

function playMusic() {
    const audio = getAudio();
    if (!audio) return;
    audio.volume = 1;
    const p = audio.play();
    if (p && typeof p.then === 'function') {
        p.then(() => { isPlaying = true; updateMusicIcon(); })
         .catch(() => { isPlaying = false; updateMusicIcon(); });
    }
    isPlaying = true;
    updateMusicIcon();
}

function pauseMusic() {
    const audio = getAudio();
    if (!audio) return;
    audio.pause();
    isPlaying = false;
    updateMusicIcon();
}

function enterWithMusicClick() {
    enableMusic = true;
    playMusic();          // primero: dentro del gesto del usuario
    showMusicPlayer();
    hideWelcomeModal();
}

function enterWithoutMusicClick() {
    enableMusic = false;
    showMusicPlayer();    // queda el botón por si luego quieren activarla
    hideWelcomeModal();
}

function toggleMusic() {
    enableMusic = true;
    const mp = document.getElementById('musicPlayer');
    if (mp) mp.classList.remove('needs-tap');
    if (isPlaying) pauseMusic(); else playMusic();
}

function setupModalButtons() {
    const withMusic = document.getElementById('enterWithMusic');
    const withoutMusic = document.getElementById('enterWithoutMusic');
    const toggle = document.getElementById('musicToggle');
    if (withMusic) withMusic.onclick = enterWithMusicClick;
    if (withoutMusic) withoutMusic.onclick = enterWithoutMusicClick;
    if (toggle) toggle.onclick = toggleMusic;

    const audio = getAudio();
    if (audio && !audio._wired) {
        audio._wired = true;
        audio.addEventListener('play', () => { isPlaying = true; updateMusicIcon(); });
        audio.addEventListener('pause', () => { isPlaying = false; updateMusicIcon(); });
        // Respaldo del loop por si algún navegador ignora el atributo
        audio.addEventListener('ended', () => { audio.currentTime = 0; audio.play().catch(() => {}); });
        try { audio.load(); } catch (e) {}
    }
}

// Pausa la música al salir de la pestaña / bloquear el celular y la retoma al volver
document.addEventListener('visibilitychange', () => {
    const audio = getAudio();
    if (!audio || !enableMusic) return;
    if (document.hidden) {
        audio._resume = !audio.paused;
        audio.pause();
    } else if (audio._resume) {
        audio.play().catch(() => {});
    }
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeCountdown();
    initializeCarousel();
    setupModalButtons();
    initializeGuestGreeting();
    initializeIntro();
});

// =========================================================
// Intro: sobre animado
// - Al tocar el sobre arrancan a la vez el video y la música
//   (el toque es lo que permite el sonido en iPhone/Android)
// - El video va sin sonido; al terminar entra la invitación
// - El botón de música aparece al final para pausar/reanudar
// =========================================================
function initializeIntro() {
    const intro = document.getElementById('intro');
    const video = document.getElementById('introVideo');
    if (!intro || !video) { showMusicPlayer(); return; }

    let started = false, finished = false;

    const finish = () => {
        if (finished) return;
        finished = true;
        revealInvitation();
    };

    const start = () => {
        if (started) return;
        started = true;
        intro.classList.add('is-playing');
        intro.setAttribute('aria-label', 'Abriendo la invitación');

        // Música: dentro del mismo toque, junto con el video
        enableMusic = true;
        playMusic();

        video.muted = true;
        const p = video.play();
        if (p && p.catch) p.catch(() => finish());
    };

    intro.addEventListener('click', start);
    intro.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); }
    });
    video.addEventListener('ended', finish);
    video.addEventListener('error', () => { if (started) finish(); });
    // Seguro: si el video se traba, entrar igual
    video.addEventListener('playing', () => {
        const ms = ((video.duration || 8) - video.currentTime + 2.5) * 1000;
        clearTimeout(video._safety);
        video._safety = setTimeout(finish, ms);
    });
}

function revealInvitation() {
    const body = document.body;
    window.scrollTo(0, 0);
    body.classList.remove('intro-active');
    void body.offsetWidth;
    body.classList.add('is-revealing');
    playSparkles(3200);

    setTimeout(() => {
        showMusicPlayer();
        const mp = document.getElementById('musicPlayer');
        if (mp) {
            mp.classList.add('is-visible');
            // Si el navegador no dejó sonar la música, el botón late para invitar a tocarlo
            const audio = getAudio();
            mp.classList.toggle('needs-tap', !!(audio && audio.paused));
        }
    }, 2400);

    setTimeout(() => {
        body.classList.add('intro-done');
        const video = document.getElementById('introVideo');
        if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    }, 3600);
}

// Destellos que flotan durante la transición
function playSparkles(duration) {
    const canvas = document.getElementById('introSparkles');
    if (!canvas || !canvas.getContext) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const count = Math.round(Math.min(70, Math.max(35, (w * h) / 12000)));
    const parts = Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2, sp = 0.25 + Math.random() * 1.1;
        return { x: w / 2 + (Math.random() - 0.5) * w * 0.35, y: h * 0.46 + (Math.random() - 0.5) * h * 0.25,
                 vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.5, r: 0.8 + Math.random() * 2.2,
                 delay: Math.random() * 600, life: 1400 + Math.random() * 1600, hue: 200 + Math.random() * 16 };
    });
    const t0 = performance.now();
    const frame = (now) => {
        const t = now - t0;
        ctx.clearRect(0, 0, w, h);
        parts.forEach(p => {
            const age = t - p.delay;
            if (age < 0 || age > p.life) return;
            const alpha = Math.sin(Math.PI * (age / p.life)) * 0.9;
            const x = p.x + p.vx * age * 0.06, y = p.y + p.vy * age * 0.06;
            const g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4);
            g.addColorStop(0, `hsla(${p.hue}, 80%, 88%, ${alpha})`);
            g.addColorStop(0.4, `hsla(${p.hue}, 70%, 65%, ${alpha * 0.45})`);
            g.addColorStop(1, `hsla(${p.hue}, 70%, 60%, 0)`);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p.r * 4, 0, Math.PI * 2); ctx.fill();
        });
        if (t < duration) requestAnimationFrame(frame); else ctx.clearRect(0, 0, w, h);
    };
    requestAnimationFrame(frame);
}

function updateMusicIcon() {
    const volumeIcon = document.getElementById('volumeIcon');
    if (!volumeIcon) return;
    if (isPlaying) {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#3E9BD6" stroke="#fff" stroke-width="1"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08" stroke="#3E9BD6" stroke-width="2"></path>
            <circle cx="6.5" cy="12" r="1" fill="#6EC1EA"/>
        `;
    } else {
        volumeIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#3E9BD6" stroke="#fff" stroke-width="1"></polygon>
            <line x1="19" y1="9" x2="17" y2="11" stroke="#7CC4EC" stroke-width="2"></line>
            <line x1="17" y1="9" x2="19" y2="11" stroke="#7CC4EC" stroke-width="2"></line>
            <circle cx="6.5" cy="12" r="1" fill="#7CC4EC"/>
        `;
    }
}

// Countdown
function initializeCountdown() {
    const targetDate = new Date('2026-12-13T17:00:00-04:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;
        
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            document.getElementById('days').textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        } else {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Carrusel
function initializeCarousel() {
    const track = document.getElementById('carouselTrack');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (!track) return;

    // calcular total dinámicamente
    const items = track.querySelectorAll('.carousel-item');
    totalSlides = items.length;
    const totalSlidesElement = document.getElementById('totalSlides');
    if (totalSlidesElement) totalSlidesElement.textContent = totalSlides;

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        });
    }

    // Ajuste inicial para asegurar cálculo correcto tras el render
    updateCarousel();
    requestAnimationFrame(updateCarousel);
    setTimeout(updateCarousel, 200);

    // Auto-play del carrusel
    setInterval(() => {
        nextSlide();
    }, 2500);
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    if (track) {
        const items = track.querySelectorAll('.carousel-item');
        if (!items.length) return;
        const container = track.parentElement;

        // Temporarily reset transform to measure actual positions
        const previousTransform = track.style.transform;
        track.style.transform = 'none';

        const firstRect = items[0].getBoundingClientRect();
        const secondRect = items[1] ? items[1].getBoundingClientRect() : null;
        const stepWidth = Math.max(1, secondRect ? Math.round(secondRect.left - firstRect.left) : Math.round(firstRect.width));

        const containerWidth = Math.round(container.getBoundingClientRect().width);
        const visibleCount = Math.max(1, Math.floor((containerWidth + 1) / stepWidth));
        const maxIndex = Math.max(0, totalSlides - visibleCount);

        // Detecta si hay que dar la vuelta (de la última foto a la 1, o viceversa)
        let wrapped = false;
        if (currentSlide > maxIndex) { currentSlide = 0; wrapped = true; }
        if (currentSlide < 0) { currentSlide = maxIndex; wrapped = true; }

        const trackRect = track.getBoundingClientRect();
        const baseLeft = Math.round(firstRect.left - trackRect.left);
        const translateXpx = -Math.round(baseLeft + (currentSlide * stepWidth));

        if (wrapped) {
            // Al dar la vuelta, salta directo a la foto 1 sin animar el regreso
            // (evita el efecto de "devolverse" deslizando hacia atrás por todas las fotos)
            const prevTransition = track.style.transition;
            track.style.transition = 'none';
            track.style.transform = `translateX(${translateXpx}px)`;
            void track.offsetWidth; // fuerza reflow para aplicar el salto sin animación
            track.style.transition = prevTransition || '';
        } else {
            // Apply transform
            track.style.transform = `translateX(${translateXpx}px)`;
        }
        // console.log('Carousel moved to slide:', { currentSlide, visibleCount, maxIndex, translateXpx, stepWidth, baseLeft });
    }
    updateSlideCounter();
    markCenterCarouselItem();
}

function nextSlide() {
    currentSlide++;
    updateCarousel();
}

function previousSlide() {
    currentSlide--;
    updateCarousel();
}

function updateSlideCounter() {
    const currentSlideElement = document.getElementById('currentSlide');
    const totalSlidesElement = document.getElementById('totalSlides');
    if (currentSlideElement) currentSlideElement.textContent = (currentSlide + 1);
    if (totalSlidesElement) totalSlidesElement.textContent = totalSlides;
}

// Mark center carousel item on desktop
function markCenterCarouselItem() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    const items = Array.from(track.querySelectorAll('.carousel-item'));
    if (!items.length) return;
    items.forEach(it => it.classList.remove('is-center'));

    const firstItem = items[0];
    const container = track.parentElement;
    const itemWidth = firstItem.getBoundingClientRect().width;
    const containerWidth = container.getBoundingClientRect().width;
    const visibleCount = Math.max(1, Math.floor(containerWidth / itemWidth));

    const centerIndex = (currentSlide + Math.floor(visibleCount / 2)) % items.length;
    items[centerIndex].classList.add('is-center');
}

// Hook into carousel updates
const _origUpdateCarousel = typeof updateCarousel === 'function' ? updateCarousel : null;
if (_origUpdateCarousel) {
    window.updateCarousel = function() {
        _origUpdateCarousel();
        markCenterCarouselItem();
    };
}

window.addEventListener('resize', markCenterCarouselItem);

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(markCenterCarouselItem, 200);
});

// Funciones de los botones
// Nota: esta es una plantilla de ejemplo, así que los botones de
// "¿Cómo llegar?", "Subir Fotos" y "Confirmar Asistencia" no llevan a
// ningún enlace real todavía. Cuando se use para una boda real, basta con
// reemplazar cada URL de ejemplo por el enlace definitivo (Google Maps,
// álbum de fotos compartido, formulario de RSVP, etc.).
function openLocation(location) {
    const urls = {
        ceremony: 'https://www.google.com/maps/search/?api=1&query=Ayuntamiento+Municipal+de+Hato+Mayor+del+Rey',
        reception: 'https://www.google.com/maps/search/?api=1&query=Ayuntamiento+Municipal+de+Hato+Mayor+del+Rey'
    };
    const url = urls[location];
    if (url) {
        window.open(url, '_blank', 'noopener');
    }
}

const PHOTO_ALBUM_URL = 'https://photos.app.goo.gl/fX8AZDwSJXMa8cbKA';

function sharePhotos() {
    // Abre el álbum compartido de Google Fotos en una pestaña nueva
    // (en el celular abre la app de Google Fotos si está instalada).
    const win = window.open(PHOTO_ALBUM_URL, '_blank');
    if (win) {
        win.opener = null;
    } else {
        // Si el navegador bloqueó la pestaña nueva, abrir en la misma
        window.location.href = PHOTO_ALBUM_URL;
    }
}

function showDressCode() {
    const modal = document.getElementById('dresscodeModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeDressCodeModal() {
    // El click dentro de la tarjeta del modal usa stopPropagation(), así que
    // esta función solo se dispara al hacer click en el fondo oscuro o en la X.
    const modal = document.getElementById('dresscodeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showTips() {
    const modal = document.getElementById('tipsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeTipsModal() {
    const modal = document.getElementById('tipsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showGifts() {
    const modal = document.getElementById('giftModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeGiftModal(event) {
    const modal = document.getElementById('giftModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function confirmAttendance() {
    const p = new URLSearchParams(window.location.search);
    const quien = p.get('invitados') || (p.get('familia') ? 'Familia ' + p.get('familia') : '');
    const msg = '¡Hola! ' + (quien ? 'Somos ' + quien + '. ' : '') + 'Confirmo mi asistencia a la boda de Yerson & Dania el domingo 13 de diciembre de 2026. 💙';
    const url = 'https://wa.me/18294552618?text=' + encodeURIComponent(msg);
    window.open(url, '_blank', 'noopener');
}

// Sistema de Toast
function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastContent = document.getElementById('toastContent');
    
    toastContent.innerHTML = `
        <h4 style="font-weight: 700; color: #fff; margin-bottom: 0.35rem; letter-spacing: 0.2px;">${title}</h4>
        <p style="color: #ddd;">${message}</p>
    `;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Nota: el efecto de portada ahora se logra 100% con CSS (hero fijo detrás
// del contenido, ver .hero-section y .content en CCSB.css), igual que en
// boda100L. Ya no hace falta mover nada por JS en el scroll.

// Saludo personalizado por invitado/familia, leído desde la URL.
// Formatos soportados:
//   ?invitados=Juan Arias,Yerianny Arias,Valery Arias
//   ?familia=Arias
function initializeGuestGreeting() {
    const params = new URLSearchParams(window.location.search);
    const personasParam = parseInt(params.get('personas'), 10);
    const invitadosParam = params.get('invitados');
    const familiaParam = params.get('familia');

    const section = document.getElementById('guestSection');
    const badge = document.getElementById('guestBadge');
    const title = document.getElementById('guestTitle');
    const subtitle = document.getElementById('guestSubtitle');
    const greeting = document.getElementById('guestGreeting');
    if (!section || !badge || !subtitle || !greeting) return;

    let names = [];
    if (invitadosParam) {
        names = invitadosParam.split(',').map(n => decodeURIComponent(n.trim())).filter(Boolean);
    } else if (familiaParam) {
        names = [`Familia ${familiaParam.trim()}`];
    }

    // Total de personas: ?personas=N (1-6) o, si no viene, la cantidad de nombres
    let total = (personasParam >= 1 && personasParam <= 20) ? personasParam : names.length;
    if (!total) return;

    const palabras = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
    const palabra = palabras[total] || String(total);

    badge.textContent = total;
    if (title) title.textContent = total === 1 ? '¡Bienvenido!' : '¡Bienvenidos!';

    subtitle.textContent = total === 1
        ? 'Yerson & Dania te invitan con mucho cariño a celebrar su boda. Será un honor contar contigo.'
        : 'Yerson & Dania los invitan con mucho cariño a celebrar su boda. Será un honor contar con ustedes.';
    subtitle.style.display = 'block';

    greeting.innerHTML = '';
    names.forEach((name, index) => {
        const nameSpan = document.createElement('span');
        nameSpan.className = `guest-name color-${(index % 4) + 1}`;
        nameSpan.textContent = name;
        greeting.appendChild(nameSpan);
    });
    const pase = document.createElement('span');
    pase.className = 'guest-name guest-pass';
    pase.textContent = total === 1 ? 'Invitación para una persona' : `Invitación para ${palabra} personas`;
    greeting.appendChild(pase);

    section.style.display = 'block';
    const block = document.getElementById('guestBlock');
    if (block) block.style.display = 'block';
    document.querySelectorAll('.guest-divider').forEach(d => d.style.display = '');
}

// Forzar limpieza de caches en clientes antiguos
(function() {
  function clearCaches() {
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
      }).catch(() => {});
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearCaches);
  } else {
    clearCaches();
  }
})();


// Copiar número de cuenta (mesa de regalos)
function copyAccount(number, btn) {
    const done = () => {
        if (btn) {
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 1800);
        }
        showToast('¡Copiado!', 'Número de cuenta ' + number + ' copiado.');
    };
    const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = number;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, number.length); // iOS Safari
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        done();
    };
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(number).then(done).catch(fallback);
    } else {
        fallback();
    }
}

// Ramitas de las esquinas: blancas en secciones de fondo azul, celestes en las claras
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.content > section, .content > footer').forEach(function (el) {
        const m = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
        if (!m) return;
        const [r, g, b] = m.map(Number);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (lum < 0.7) el.classList.add('deco-on-dark');
    });
});
