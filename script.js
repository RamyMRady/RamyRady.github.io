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

    // Visit counter (Abacus: a free, keyless counter API). If it is unreachable,
    // the line stays hidden and nothing else is affected.
    var countBox = document.querySelector('.status-count');
    if (countBox) {
        fetch('https://abacus.jasoncameron.dev/hit/ramyrady.com/site')
            .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
            .then(function (d) {
                if (typeof d.value !== 'number') return;
                countBox.querySelector('.count-value').textContent = d.value.toLocaleString();
                countBox.querySelector('.count-label').textContent = d.value === 1 ? 'visit' : 'visits';
                countBox.hidden = false;
            })
            .catch(function () { /* counter unavailable: leave it hidden */ });
    }

    // Homepage terminal: the text is in the HTML; this retypes the commands for effect.
    var termBody = document.querySelector('.term-body');
    if (termBody && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        var steps = [];
        termBody.querySelectorAll('.term-cmd').forEach(function (cmd) {
            var typed = cmd.querySelector('.term-typed');
            steps.push({ cmd: cmd, typed: typed, text: typed.textContent, out: cmd.nextElementSibling });
        });
        if (steps.length) {
            termBody.classList.add('is-typing');
            steps.forEach(function (s) { s.typed.textContent = ''; });

            var typeLine = function (step) {
                return new Promise(function (resolve) {
                    step.cmd.classList.add('shown', 'active');
                    var i = 0;
                    (function tick() {
                        if (i < step.text.length) {
                            step.typed.textContent += step.text.charAt(i++);
                            setTimeout(tick, 26);
                        } else {
                            step.cmd.classList.remove('active');
                            setTimeout(function () {
                                if (step.out) step.out.classList.add('shown');
                                resolve();
                            }, 160);
                        }
                    })();
                });
            };

            var run = function () {
                steps.reduce(function (chain, step) {
                    return chain.then(function () { return typeLine(step); });
                }, Promise.resolve());
            };

            // Start when the terminal is actually on screen.
            if ('IntersectionObserver' in window) {
                var io = new IntersectionObserver(function (entries) {
                    if (entries[0].isIntersecting) { io.disconnect(); run(); }
                }, { threshold: 0.25 });
                io.observe(termBody);
            } else {
                run();
            }
        }
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
