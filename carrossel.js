const carrossel = document.querySelector('.slides_autoplay');
const carrosselwrap = document.querySelector('.carrossel-wrap');
const dots = document.querySelectorAll('.dot');
let autoplayInterval;

function iniciarAutoplay() {
    autoplayInterval = setInterval(autoplayCarrossel, 5000);
}

function resetAutoplay() {
    clearInterval(autoplayInterval);
    iniciarAutoplay();
}

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        dots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        atualizarCarrossel();
        resetAutoplay();
    });
});

function atualizarCarrossel() {
    const activeIndex = Array.from(dots).findIndex(dot => dot.classList.contains('active'));
    const offset = -activeIndex * 20;
    carrossel.style.transform = `translateX(${offset}%)`;
}

function autoplayCarrossel() {
    const activeIndex = Array.from(dots).findIndex(dot => dot.classList.contains('active'));
    const nextIndex = (activeIndex + 1) % dots.length;
    dots.forEach(dot => dot.classList.remove('active'));
    dots[nextIndex].classList.add('active');
    atualizarCarrossel();
}

carrossel.addEventListener('mouseenter',() => {
    clearInterval(autoplayInterval);
});

carrossel.addEventListener('mouseleave', () => {
    iniciarAutoplay();
});

carrosselwrap.addEventListener('keydown', (event) => {
    const activeIndex = Array.from(dots).findIndex(dot => dot.classList.contains('active'));
    if (event.key === 'ArrowRight') {
        const nextIndex = (activeIndex + 1) % dots.length;
        dots.forEach(dot => dot.classList.remove('active'));
        dots[nextIndex].classList.add('active');
        atualizarCarrossel();
        resetAutoplay();
    } else if (event.key === 'ArrowLeft') {
        const prevIndex = (activeIndex - 1 + dots.length) % dots.length;
        dots.forEach(dot => dot.classList.remove('active'));
        dots[prevIndex].classList.add('active');
        atualizarCarrossel();
        resetAutoplay();
    }
});


document.addEventListener('DOMContentLoaded', () => {
    dots[0].classList.add('active');
    iniciarAutoplay();
});