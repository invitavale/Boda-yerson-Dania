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

    const modal = document.getElementById('welcomeModal');
    if (modal) modal.style.display = 'flex';
});

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
    const invitadosParam = params.get('invitados');
    const familiaParam = params.get('familia');

    const section = document.getElementById('guestSection');
    const badge = document.getElementById('guestBadge');
    const subtitle = document.getElementById('guestSubtitle');
    const greeting = document.getElementById('guestGreeting');
    if (!section || !badge || !subtitle || !greeting) return;

    let names = [];

    if (invitadosParam) {
        names = invitadosParam.split(',').map(n => decodeURIComponent(n.trim())).filter(Boolean);
    } else if (familiaParam) {
        names = [`Familia ${familiaParam.trim()}`];
    }

    if (names.length === 0) return;

    // Badge con el total de invitados
    badge.textContent = names.length;

    // Subtítulo de acompañantes: solo tiene sentido cuando hay más de un
    // nombre individual (no aplica al formato "Familia X")
    const companions = invitadosParam ? names.length - 1 : 0;
    if (companions > 0) {
        subtitle.textContent = `(${companions} acompañante${companions > 1 ? 's' : ''})`;
        subtitle.style.display = 'block';
    } else {
        subtitle.style.display = 'none';
    }

    // Limpiar contenido previo
    greeting.innerHTML = '';

    names.forEach((name, index) => {
        const nameSpan = document.createElement('span');
        const colorIndex = (index % 4) + 1;
        nameSpan.className = `guest-name color-${colorIndex}`;
        nameSpan.textContent = name;
        greeting.appendChild(nameSpan);
    });

    section.style.display = 'block';
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
