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

    // Contact form: GitHub Pages has no backend, and a mailto: link does nothing for
    // visitors with no mail app registered (webmail users), so offer explicit choices.
    var form = document.querySelector('.contact-form');
    if (form) {
        var status = form.querySelector('.form-status');
        var options = form.querySelector('.send-options');
        var address = 'engramyrady@gmail.com';
        var composed = '';

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

            var subject = 'Website inquiry from ' + name;
            var body = message + '\n\n— ' + name + ' (' + email + ')';
            composed = 'To: ' + address + '\nSubject: ' + subject + '\n\n' + body;

            var s = encodeURIComponent(subject);
            var b = encodeURIComponent(body);
            form.querySelector('.send-gmail').href =
                'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(address) + '&su=' + s + '&body=' + b;
            form.querySelector('.send-outlook').href =
                'https://outlook.live.com/mail/0/deeplink/compose?to=' + encodeURIComponent(address) + '&subject=' + s + '&body=' + b;
            form.querySelector('.send-mailto').href = 'mailto:' + address + '?subject=' + s + '&body=' + b;

            status.classList.remove('error');
            status.hidden = true;
            options.hidden = false;
            options.querySelector('.send-gmail').focus();
        });

        var copyBtn = form.querySelector('.copy-message');
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                if (!navigator.clipboard) return;
                navigator.clipboard.writeText(composed).then(function () {
                    copyBtn.textContent = 'Copied. Paste it into any email app';
                    setTimeout(function () { copyBtn.textContent = 'Copy message'; }, 2600);
                });
            });
        }
    }
})();
