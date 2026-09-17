// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Matrix Canvas Animation
function initMatrixAnimation() {
    if (prefersReducedMotion) return;
    
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Matrix characters
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);
    
    function draw() {
        ctx.fillStyle = 'rgba(10, 14, 39, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(draw, 50);
}

// Typewriter Effect for Terminal
function initTypewriterEffect() {
    // Text lives in the HTML (for search engines, screen readers, and no-JS visitors);
    // the effect re-types it for sighted visitors.
    const lines = [
        { id: 'line1', delay: 0 },
        { id: 'line2', delay: 250 },
        { id: 'line3', delay: 250 }
    ]
        .map(line => ({ ...line, element: document.getElementById(line.id) }))
        .filter(line => line.element);

    if (prefersReducedMotion || lines.length === 0) return;

    lines.forEach(line => {
        line.text = line.element.textContent;
        line.element.setAttribute('aria-label', line.text);
        line.element.textContent = '';
    });

    function typeWriter(element, text, speed = 28) {
        let i = 0;
        element.classList.add('typing');
        return new Promise((resolve) => {
            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    element.classList.remove('typing');
                    element.removeAttribute('aria-label');
                    resolve();
                }
            }
            type();
        });
    }

    (async function startTypewriter() {
        for (const line of lines) {
            await new Promise(resolve => setTimeout(resolve, line.delay));
            await typeWriter(line.element, line.text);
        }
    })();
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Initialize matrix animation
    initMatrixAnimation();
    
    // Initialize typewriter effect
    initTypewriterEffect();
    
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navToggle.contains(event.target) || navMenu.contains(event.target);
            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    // Fade-in Animation on Scroll
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    fadeElements.forEach(element => {
        fadeInObserver.observe(element);
    });

    // Contact form: no backend on GitHub Pages, so compose the message in the visitor's email app
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        const status = contactForm.querySelector('.form-status');
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const name = formData.get('name').trim();
            const email = formData.get('email').trim();
            const message = formData.get('message').trim();

            const subject = `Website inquiry from ${name}`;
            const body = `${message}\n\n— ${name} (${email})`;
            window.location.href = 'mailto:engramyrady@gmail.com'
                + '?subject=' + encodeURIComponent(subject)
                + '&body=' + encodeURIComponent(body);

            if (status) {
                status.innerHTML = 'Your email app should open with this message ready to send. '
                    + 'Nothing opened? Email me directly at '
                    + '<a href="mailto:engramyrady@gmail.com">engramyrady@gmail.com</a>.';
                status.hidden = false;
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});
