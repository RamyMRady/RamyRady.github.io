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
    // Edit mode: ?edit turns it on (remembered on this browser), ?edit=off turns it off.
    // Edit links open the page's source file at the right line in GitHub's web editor;
    // a push to main rebuilds and redeploys the site.
    var editOn = false;
    try {
        var q = new URLSearchParams(location.search);
        if (q.has('edit')) {
            localStorage.setItem('editMode', q.get('edit') === 'off' ? '0' : '1');
            q.delete('edit');
            history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
        }
        editOn = localStorage.getItem('editMode') === '1';
    } catch (e) {}
    if (editOn) {
        root.classList.add('edit-mode');
        document.querySelectorAll('.edit-link, .edit-bar').forEach(function (el) { el.hidden = false; });
    }

    // Questions on notes: an "Ask" button on every section, and on any selected text.
    var noteBody = document.querySelector('.note-body');
    if (noteBody) {
        var askTo = 'engramyrady@gmail.com';
        var noteTitle = (document.querySelector('.note-head h1') || {}).textContent || document.title;
        var dlg = document.createElement('dialog');
        dlg.className = 'ask-dialog';
        dlg.innerHTML =
            '<form method="dialog" class="ask-form">' +
            '<p class="ask-kicker">Ask a question</p>' +
            '<p class="ask-where"></p>' +
            '<blockquote class="ask-quote" hidden></blockquote>' +
            '<label>Your question<textarea name="q" rows="4" required></textarea></label>' +
            '<p class="ask-note muted small">This opens your email app with the question addressed to Ramy. Nothing is sent until you press send there.</p>' +
            '<div class="ask-send" hidden><a class="button send-gmail" target="_blank" rel="noopener">Gmail</a>' +
            '<a class="button send-outlook" target="_blank" rel="noopener">Outlook</a>' +
            '<a class="button send-mailto">Email app</a><button type="button" class="button ghost copy-q">Copy</button></div>' +
            '<div class="ask-actions"><button type="button" class="button ghost ask-cancel">Cancel</button>' +
            '<button type="submit" class="button ask-go">Continue</button></div></form>';
        document.body.appendChild(dlg);
        var ctx = { section: '', anchor: '', quote: '' };
        var composedQ = '';

        var openAsk = function (section, anchor, quote) {
            ctx = { section: section, anchor: anchor, quote: quote || '' };
            dlg.querySelector('.ask-where').textContent = noteTitle + (section ? ' → ' + section : '');
            var bq = dlg.querySelector('.ask-quote');
            bq.textContent = ctx.quote ? '“' + ctx.quote + '”' : '';
            bq.hidden = !ctx.quote;
            dlg.querySelector('textarea').value = '';
            dlg.querySelector('.ask-send').hidden = true;
            dlg.querySelector('.ask-go').hidden = false;
            if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
            dlg.querySelector('textarea').focus();
        };
        dlg.querySelector('.ask-cancel').addEventListener('click', function () { dlg.close(); });
        dlg.querySelector('.ask-form').addEventListener('submit', function (e) {
            e.preventDefault();
            var question = dlg.querySelector('textarea').value.trim();
            if (!question) return;
            var url = location.origin + location.pathname + (ctx.anchor ? '#' + ctx.anchor : '');
            var subject = 'Question on "' + noteTitle + '"' + (ctx.section ? ' (' + ctx.section + ')' : '');
            var body = question + '\n\n' + (ctx.quote ? 'About this passage:\n> ' + ctx.quote + '\n\n' : '') + url;
            composedQ = 'To: ' + askTo + '\nSubject: ' + subject + '\n\n' + body;
            var su = encodeURIComponent(subject), b = encodeURIComponent(body);
            dlg.querySelector('.send-gmail').href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + askTo + '&su=' + su + '&body=' + b;
            dlg.querySelector('.send-outlook').href = 'https://outlook.live.com/mail/0/deeplink/compose?to=' + askTo + '&subject=' + su + '&body=' + b;
            dlg.querySelector('.send-mailto').href = 'mailto:' + askTo + '?subject=' + su + '&body=' + b;
            dlg.querySelector('.ask-send').hidden = false;
            dlg.querySelector('.ask-go').hidden = true;
        });
        dlg.querySelector('.copy-q').addEventListener('click', function (e) {
            if (navigator.clipboard) navigator.clipboard.writeText(composedQ).then(function () { e.target.textContent = 'Copied'; });
        });

        noteBody.querySelectorAll('h2[id]').forEach(function (h) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'ask-btn';
            var name = h.cloneNode(true);
            name.querySelectorAll('.secnum, .edit-link').forEach(function (x) { x.remove(); });
            var label = name.textContent.trim();
            b.setAttribute('aria-label', 'Ask a question about ' + label);
            b.innerHTML = '<span aria-hidden="true">?</span><span class="ask-text">Ask</span>';
            b.addEventListener('click', function () { openAsk(label, h.id, ''); });
            h.appendChild(b);
        });

        // Select any passage, then "Ask about this".
        var pop = document.createElement('button');
        pop.type = 'button';
        pop.className = 'ask-pop';
        pop.hidden = true;
        pop.textContent = '? Ask about this';
        document.body.appendChild(pop);
        var sectionOf = function (node) {
            var el = node.nodeType === 1 ? node : node.parentElement;
            while (el && el.parentElement !== noteBody) el = el.parentElement;
            for (var h = el; h; h = h.previousElementSibling) {
                if (h.tagName === 'H2' && h.id) {
                    var c = h.cloneNode(true);
                    c.querySelectorAll('.secnum, .edit-link, .ask-btn').forEach(function (x) { x.remove(); });
                    return { label: c.textContent.trim(), id: h.id };
                }
            }
            return { label: '', id: '' };
        };
        var hidePop = function () { pop.hidden = true; };
        document.addEventListener('selectionchange', function () {
            var sel = window.getSelection();
            var text = sel ? sel.toString().trim() : '';
            if (!text || text.length < 3 || !sel.rangeCount || !noteBody.contains(sel.anchorNode)) { hidePop(); return; }
            var r = sel.getRangeAt(0).getBoundingClientRect();
            pop.style.top = (window.scrollY + r.bottom + 8) + 'px';
            pop.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - 170)) + 'px';
            pop.hidden = false;
        });
        pop.addEventListener('mousedown', function (e) { e.preventDefault(); });
        pop.addEventListener('click', function () {
            var sel = window.getSelection();
            var text = sel.toString().trim().replace(/\s+/g, ' ');
            if (text.length > 400) text = text.slice(0, 400) + '…';
            var where = sectionOf(sel.anchorNode);
            hidePop();
            openAsk(where.label, where.id, text);
        });
    }
    // Notes list: category tabs (the URL hash keeps the choice, e.g. notes.html#rf)
    var noteFilters = document.querySelectorAll('.note-filter');
    if (noteFilters.length) {
        var applyCat = function (cat) {
            var any = false;
            noteFilters.forEach(function (b) {
                var on = b.dataset.cat === cat;
                any = any || on;
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            if (!any) cat = 'all';
            document.querySelectorAll('.note-list > li').forEach(function (li) {
                li.hidden = !(cat === 'all' || li.dataset.cat === cat);
            });
        };
        noteFilters.forEach(function (b) {
            b.addEventListener('click', function () {
                applyCat(b.dataset.cat);
                history.replaceState(null, '', b.dataset.cat === 'all' ? location.pathname : '#' + b.dataset.cat);
            });
        });
        if (location.hash.length > 1) applyCat(location.hash.slice(1));
    }
})();
