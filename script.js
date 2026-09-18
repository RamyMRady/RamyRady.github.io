(function () {
    var root = document.documentElement;

    // Theme toggle: an explicit choice is stored; otherwise the OS setting applies.
    var toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', function () {
            var current = root.dataset.theme ||
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            var next = current === 'dark' ? 'light' : 'dark';
            root.dataset.theme = next;
            try { localStorage.setItem('theme', next); } catch (e) {}
        });
    }

    // Mobile navigation
    var navToggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (navToggle && nav) {
        navToggle.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && nav.classList.contains('open')) {
                nav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
            }
        });
    }

    // BibTeX: show/hide and copy
    document.querySelectorAll('[data-cite]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var box = document.getElementById(btn.dataset.cite);
            if (!box) return;
            box.hidden = !box.hidden;
            btn.setAttribute('aria-expanded', box.hidden ? 'false' : 'true');
        });
    });
    document.querySelectorAll('.copy-bib').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var text = btn.parentElement.querySelector('pre').textContent;
            var reset = function () { setTimeout(function () { btn.textContent = 'Copy BibTeX'; }, 1600); };
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function () {
                    btn.textContent = 'Copied';
                    reset();
                }, function () {
                    btn.textContent = 'Copy failed. Select the text above';
                    reset();
                });
            }
        });
    });

    // Publication filters
    var filters = document.querySelectorAll('.filter');
    filters.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var f = btn.dataset.filter;
            filters.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
            document.querySelectorAll('.pubs-page .pub').forEach(function (li) {
                li.hidden = !(f === 'all' ||
                    (f === 'first' ? li.dataset.first === 'true' : li.dataset.kind === f));
            });
            document.querySelectorAll('.year-group').forEach(function (g) {
                g.hidden = !g.querySelector('.pub:not([hidden])');
            });
        });
    });

    // Contact form: GitHub Pages has no backend, so compose the email in the visitor's mail app.
    var form = document.querySelector('.contact-form');
    if (form) {
        var status = form.querySelector('.form-status');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = form.elements.name.value.trim();
            var email = form.elements.email.value.trim();
            var message = form.elements.message.value.trim();
            if (!name || !email || !message) {
                status.textContent = 'Add your name, email, and a message, then try again.';
                status.classList.add('error');
                status.hidden = false;
                return;
            }
            status.classList.remove('error');
            window.location.href = 'mailto:engramyrady@gmail.com' +
                '?subject=' + encodeURIComponent('Website inquiry from ' + name) +
                '&body=' + encodeURIComponent(message + '\n\n— ' + name + ' (' + email + ')');
            status.innerHTML = 'Your email app should open with this message ready to send. ' +
                'If nothing opened, write to <a href="mailto:engramyrady@gmail.com">engramyrady@gmail.com</a>.';
            status.hidden = false;
        });
    }
})();
