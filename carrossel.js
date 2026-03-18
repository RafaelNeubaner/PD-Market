const carrossel = document.querySelector('.slides_autoplay');
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



document.addEventListener('DOMContentLoaded', () => {
    dots[0].classList.add('active');
    iniciarAutoplay();
});