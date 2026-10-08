/* Interactive figures for the notes.
   A note embeds one with <div class="widget" data-widget="NAME"></div>; everything
   else is built here. Each figure redraws on theme change and pauses its animation
   when off screen or when the reader prefers reduced motion. */
(function () {
    'use strict';
    var NS = 'http://www.w3.org/2000/svg';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var renders = [];

    // ---------- small helpers ----------
    function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
    function colors() {
        return { accent: css('--accent'), signal: css('--signal'), ink: css('--ink'), ink2: css('--ink-2'),
            muted: css('--muted'), rule: css('--rule'), s2: css('--surface-2'), surface: css('--surface'), bg: css('--bg') };
    }
    function h(tag, attrs, kids) {
        var e = document.createElement(tag);
        for (var k in attrs || {}) {
            if (k === 'text') e.textContent = attrs[k];
            else if (k === 'html') e.innerHTML = attrs[k];
            else e.setAttribute(k, attrs[k]);
        }
        (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
        return e;
    }
    function s(tag, attrs, parent) {
        var e = document.createElementNS(NS, tag);
        for (var k in attrs || {}) {
            if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]);
        }
        if (parent) parent.appendChild(e);
        return e;
    }
    function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
    function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
    function db10(x) { return 10 * Math.log10(x); }
    function lin10(d) { return Math.pow(10, d / 10); }
    function fmt(x, d) { return (+x).toFixed(d == null ? 2 : d); }
    function eng(x, unit, digits) {
        var p = [[1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'], [1e-15, 'f']];
        var a = Math.abs(x);
        if (a < 1e-18) return '0' + (unit ? '\u2009' + unit : '');
        for (var i = 0; i < p.length; i++) {
            if (a >= p[i][0] * 0.9995 || i === p.length - 1) {
                var v = x / p[i][0];
                var d = digits != null ? digits : (Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2);
                return v.toFixed(d) + ' ' + p[i][1] + unit;
            }
        }
    }
    function erfc(x) { // Numerical Recipes erfc, |error| < 1.2e-7
        var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
        var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
            t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
        return x >= 0 ? r : 2 - r;
    }
    function sup(n) { var m = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }; return String(n).split('').map(function (c) { return m[c]; }).join(''); }
    function qfunc(x) { return 0.5 * erfc(x / Math.SQRT2); }
    var randn = (function () {
        var spare = null;
        return function () {
            if (spare !== null) { var v = spare; spare = null; return v; }
            var u, w, r;
            do { u = Math.random() * 2 - 1; w = Math.random() * 2 - 1; r = u * u + w * w; } while (r >= 1 || r === 0);
            var m = Math.sqrt(-2 * Math.log(r) / r);
            spare = w * m; return u * m;
        };
    })();

    // ---------- widget shell and controls ----------
    function shell(host, title, hint) {
        clear(host);
        var head = h('div', { class: 'widget-head' }, [h('span', { class: 'widget-title', text: title }), hint ? h('span', { class: 'widget-hint', text: hint }) : null]);
        var stage = h('div', { class: 'widget-stage' });
        var readout = h('div', { class: 'readout', 'aria-live': 'polite' });
        var controls = h('div', { class: 'widget-controls' });
        host.appendChild(head); host.appendChild(stage); host.appendChild(readout); host.appendChild(controls);
        return { stage: stage, readout: readout, controls: controls };
    }
    function slider(parent, o) {
        // o: label, min, max, step, value, fmt(v) -> string, log (bool), onInput
        var out = h('output');
        var input = h('input', { type: 'range', min: o.log ? 0 : o.min, max: o.log ? 1000 : o.max, step: o.log ? 1 : (o.step || 'any'), 'aria-label': o.label });
        var toV = function (r) { return o.log ? o.min * Math.pow(o.max / o.min, r / 1000) : +r; };
        var toR = function (v) { return o.log ? 1000 * Math.log(v / o.min) / Math.log(o.max / o.min) : v; };
        var exact = o.value; // presets and defaults stay exact; dragging takes the slider's value
        input.value = toR(o.value);
        var wrap = h('label', { class: 'ctrl' }, [h('span', { class: 'ctrl-top' }, [h('span', { text: o.label }), out]), input]);
        parent.appendChild(wrap);
        var api = {
            get: function () { return exact != null ? exact : toV(+input.value); },
            set: function (v) { exact = v; input.value = toR(v); show(); },
            input: input
        };
        function show() { out.textContent = o.fmt ? o.fmt(api.get()) : fmt(api.get()); }
        input.addEventListener('input', function () { exact = null; show(); if (o.onInput) o.onInput(api.get()); });
        show();
        return api;
    }
    function seg(parent, label, options, value, onChange) {
        var box = h('div', { class: 'seg', role: 'group', 'aria-label': label });
        var cur = value;
        options.forEach(function (opt) {
            var b = h('button', { type: 'button', 'aria-pressed': opt[0] === value ? 'true' : 'false', text: opt[1] });
            b.addEventListener('click', function () {
                cur = opt[0];
                box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
                onChange(cur);
            });
            box.appendChild(b);
        });
        parent.appendChild(h('div', { class: 'ctrl' }, [h('span', { text: label }), box]));
        return { get: function () { return cur; } };
    }
    function select(parent, label, options, value, onChange) {
        var sel = h('select', { 'aria-label': label });
        options.forEach(function (o) { var op = h('option', { value: o[0], text: o[1] }); if (o[0] === value) op.selected = true; sel.appendChild(op); });
        sel.addEventListener('change', function () { onChange(sel.value); });
        parent.appendChild(h('label', { class: 'ctrl' }, [h('span', { text: label }), sel]));
        return { get: function () { return sel.value; } };
    }
    function readout(el, items) {
        clear(el);
        items.forEach(function (it) {
            var b = h('b', { text: it[1] });
            if (it[2]) b.className = it[2];
            el.appendChild(h('span', {}, [document.createTextNode(it[0] + ' '), b]));
        });
    }

    // ---------- plots ----------
    function Plot(svg, o) {
        this.svg = svg; this.o = o;
        this.W = o.W || 640; this.H = o.H || 300;
        this.p = o.pad || { l: 56, r: 16, t: 14, b: 40 };
        svg.setAttribute('viewBox', '0 0 ' + this.W + ' ' + this.H);
    }
    Plot.prototype.sx = function (x) {
        var o = this.o, a = o.x[0], b = o.x[1];
        var t = o.xlog ? Math.log(x / a) / Math.log(b / a) : (x - a) / (b - a);
        return this.p.l + t * (this.W - this.p.l - this.p.r);
    };
    Plot.prototype.sy = function (y) {
        var o = this.o, a = o.y[0], b = o.y[1];
        var t = o.ylog ? Math.log(y / a) / Math.log(b / a) : (y - a) / (b - a);
        return this.H - this.p.b - t * (this.H - this.p.t - this.p.b);
    };
    Plot.prototype.axes = function (c, xt, yt, xl, yl, xf, yf) {
        var g = s('g', {}, this.svg), self = this;
        var x0 = this.p.l, x1 = this.W - this.p.r, y0 = this.H - this.p.b, y1 = this.p.t;
        (xt || []).forEach(function (v) {
            var x = self.sx(v);
            s('line', { x1: x, x2: x, y1: y1, y2: y0, stroke: c.rule, 'stroke-width': 1 }, g);
            s('text', { x: x, y: y0 + 16, 'text-anchor': 'middle', 'font-size': 11.5, fill: c.muted, text: xf ? xf(v) : v }, g);
        });
        (yt || []).forEach(function (v) {
            var y = self.sy(v);
            s('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: c.rule, 'stroke-width': 1 }, g);
            s('text', { x: x0 - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 11.5, fill: c.muted, text: yf ? yf(v) : v }, g);
        });
        s('line', { x1: x0, x2: x1, y1: y0, y2: y0, stroke: c.muted, 'stroke-width': 1 }, g);
        s('line', { x1: x0, x2: x0, y1: y0, y2: y1, stroke: c.muted, 'stroke-width': 1 }, g);
        if (xl) s('text', { x: (x0 + x1) / 2, y: this.H - 6, 'text-anchor': 'middle', 'font-size': 12.5, fill: c.ink2, text: xl }, g);
        if (yl) s('text', { x: 14, y: (y0 + y1) / 2, 'text-anchor': 'middle', 'font-size': 12.5, fill: c.ink2, transform: 'rotate(-90 14 ' + (y0 + y1) / 2 + ')', text: yl }, g);
        return g;
    };
    Plot.prototype.path = function (pts, attrs) {
        var self = this, d = '';
        var xa = Math.min(this.o.x[0], this.o.x[1]), xb = Math.max(this.o.x[0], this.o.x[1]);
        pts.forEach(function (p) {
            if (!isFinite(p[1]) || p[0] < xa || p[0] > xb) return;
            d += (d ? 'L' : 'M') + self.sx(p[0]).toFixed(1) + ' ' + self.sy(clamp(p[1], Math.min(self.o.y[0], self.o.y[1]), Math.max(self.o.y[0], self.o.y[1]))).toFixed(1);
        });
        var a = { d: d, fill: 'none', 'stroke-width': 2, 'stroke-linejoin': 'round' };
        for (var k in attrs) a[k] = attrs[k];
        return s('path', a, this.svg);
    };
    function svgStage(stage, label) {
        var svg = s('svg', { role: 'img', 'aria-label': label });
        stage.appendChild(svg);
        return svg;
    }
    function logTicks(a, b) {
        var t = [];
        for (var e = Math.floor(Math.log10(a)); e <= Math.ceil(Math.log10(b)); e++) {
            var v = Math.pow(10, e);
            if (v >= a * 0.999 && v <= b * 1.001) t.push(v);
        }
        return t;
    }

    // ---------- animation: runs only while visible ----------
    function animator(host, step) {
        if (reduce) { step(0, true); return { kick: function () { step(0, true); } }; }
        var visible = false, raf = 0, last = 0;
        function frame(t) {
            raf = 0;
            if (!visible) return;
            var dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
            last = t;
            step(dt, false);
            raf = requestAnimationFrame(frame);
        }
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (e) {
                visible = e[0].isIntersecting;
                if (visible && !raf) { last = 0; raf = requestAnimationFrame(frame); }
            }, { threshold: 0.05 }).observe(host);
        } else { visible = true; raf = requestAnimationFrame(frame); }
        return { kick: function () { if (!raf) step(0, true); } };
    }

    var W = {};

    // =====================================================================
    // dB converter (noise-figure, rf-numbers)
    // =====================================================================
    W.db = function (host) {
        var ui = shell(host, 'Interactive: dB to ratio', 'Drag the slider');
        var svg = svgStage(ui.stage, 'Bar showing the power and voltage ratio for a dB value');
        var d = slider(ui.controls, { label: 'Gain', min: -30, max: 40, step: 1, value: 13, fmt: function (v) { return (v > 0 ? '+' : '') + v + ' dB'; }, onInput: render });
        function decompose(x) {
            // Express x dB using the memorized steps 20, 10, 6, 3, 1.
            var parts = [], r = Math.abs(x), steps = [20, 10, 6, 3, 1];
            steps.forEach(function (st) { while (r >= st) { parts.push(st); r -= st; } });
            return parts;
        }
        function render() {
            var c = colors(), x = d.get(), p = lin10(x), v = Math.pow(10, x / 20);
            clear(svg);
            var pl = new Plot(svg, { W: 640, H: 132, pad: { l: 70, r: 20, t: 18, b: 44 }, x: [1e-3, 1e4], xlog: true, y: [0, 2] });
            pl.axes(c, [1e-3, 1e-2, 0.1, 1, 10, 100, 1e3, 1e4], [], 'ratio (log scale)', '', function (t) { return t >= 1 ? t + '×' : '1/' + Math.round(1 / t); });
            var x1 = pl.sx(1);
            [[p, 'Power', c.accent, 1.5], [v, 'Voltage', c.signal, 0.5]].forEach(function (b) {
                var xr = pl.sx(clamp(b[0], 1e-3, 1e4)), y = pl.sy(b[3]) - 12;
                s('rect', { x: Math.min(x1, xr), y: y, width: Math.max(2, Math.abs(xr - x1)), height: 24, rx: 3, fill: b[2], opacity: 0.85 }, svg);
                s('text', { x: 64, y: y + 16, 'text-anchor': 'end', 'font-size': 12.5, fill: c.ink, text: b[1] }, svg);
            });
            var parts = decompose(x), sign = x < 0 ? ' − ' : ' + ';
            var how = x === 0 ? '0 dB is 1×' : (x < 0 ? '−' : '') + parts.join(sign) + ' dB';
            readout(ui.readout, [['Power ratio', p >= 1 ? fmt(p, p < 10 ? 2 : 1) + '×' : '1/' + fmt(1 / p, 1 / p < 10 ? 2 : 1)],
                ['Voltage ratio', v >= 1 ? fmt(v, v < 10 ? 2 : 1) + '×' : '1/' + fmt(1 / v, 1 / v < 10 ? 2 : 1)], ['Built from', how]]);
        }
        renders.push(render); render();
    };

    // =====================================================================
    // Friis cascade (noise-figure)
    // =====================================================================
    W.friis = function (host) {
        var ui = shell(host, 'Interactive: receiver noise budget', 'Change any stage and watch the total');
        var svg = svgStage(ui.stage, 'Bar chart of each stage term in the Friis formula');
        var dbf = function (u) { return function (v) { return fmt(v, 1) + ' ' + u; }; };
        var lnaNF = slider(ui.controls, { label: 'LNA noise figure', min: 0.3, max: 6, step: 0.1, value: 1.5, fmt: dbf('dB'), onInput: render });
        var lnaG = slider(ui.controls, { label: 'LNA gain', min: 0, max: 30, step: 0.5, value: 20, fmt: dbf('dB'), onInput: render });
        var mixNF = slider(ui.controls, { label: 'Mixer noise figure', min: 3, max: 16, step: 0.5, value: 10, fmt: dbf('dB'), onInput: render });
        var mixG = slider(ui.controls, { label: 'Mixer conversion gain', min: -10, max: 15, step: 0.5, value: 8, fmt: dbf('dB'), onInput: render });
        var ifNF = slider(ui.controls, { label: 'IF amplifier noise figure', min: 2, max: 12, step: 0.5, value: 4, fmt: dbf('dB'), onInput: render });
        var loss = slider(ui.controls, { label: 'Cable / filter loss', min: 0, max: 6, step: 0.1, value: 2, fmt: dbf('dB'), onInput: render });
        var where = seg(ui.controls, 'Put the loss', [['none', 'Nowhere'], ['before', 'Before LNA'], ['after', 'After LNA']], 'none', render);
        var bw = select(ui.controls, 'Bandwidth', [['1e6', '1 MHz'], ['2e7', '20 MHz'], ['1e8', '100 MHz'], ['1e9', '1 GHz']], '2e7', render);
        function render() {
            var c = colors();
            var stages = [['LNA', lnaNF.get(), lnaG.get()], ['Mixer', mixNF.get(), mixG.get()], ['IF amp', ifNF.get(), 30]];
            var L = loss.get(), w = where.get();
            if (w === 'before') stages.unshift(['Loss', L, -L]);
            if (w === 'after') stages.splice(1, 0, ['Loss', L, -L]);
            var gain = 1, F = 0, terms = [];
            stages.forEach(function (st, i) {
                var f = lin10(st[1]);
                var t = i === 0 ? f : (f - 1) / gain;
                terms.push([st[0], t, i === 0]);
                F += t; gain *= lin10(st[2]);
            });
            var NF = db10(F), Te = 290 * (F - 1), B = +bw.get(), pmin = -174 + db10(B) + NF + 10;
            clear(svg);
            var H = 40 + terms.length * 40, maxT = Math.max(2, F);
            svg.setAttribute('viewBox', '0 0 640 ' + H);
            var x0 = 96, x1 = 560;
            terms.forEach(function (t, i) {
                var y = 14 + i * 40, wpx = Math.max(1.5, (x1 - x0) * t[1] / maxT);
                s('text', { x: x0 - 10, y: y + 17, 'text-anchor': 'end', 'font-size': 13, fill: c.ink, text: t[0] }, svg);
                s('rect', { x: x0, y: y, width: wpx, height: 24, rx: 3, fill: t[0] === 'Loss' ? c.signal : (t[2] ? c.accent : c.muted) }, svg);
                s('text', { x: x0 + wpx + 8, y: y + 17, 'font-size': 12.5, fill: c.muted, text: fmt(t[1], 3) + (t[2] ? '  (F₁)' : '  ((F−1)/gain ahead)') }, svg);
            });
            s('text', { x: x0, y: H - 8, 'font-size': 12, fill: c.muted, text: 'Bars: each term of eq. (4), same scale. Total F = sum of the bars.' }, svg);
            readout(ui.readout, [['Total F', fmt(F, 3)], ['NF', fmt(NF, 2) + ' dB', NF > 3 ? 'bad' : 'good'],
                ['Tₑ', Math.round(Te) + ' K'], ['Sensitivity at 10 dB SNR', fmt(pmin, 1) + ' dBm']]);
        }
        renders.push(render); render();
    };

    // =====================================================================
    // Wavelength and antenna length (rf-numbers)
    // =====================================================================
    W.wavelength = function (host) {
        var ui = shell(host, 'Interactive: frequency ↔ wavelength ↔ antenna', 'Pick a frequency or a preset');
        var svg = svgStage(ui.stage, 'Half-wave dipole drawn with its standing-wave current');
        var presets = [['15e6', '15 MHz (λ = 20 m)'], ['14.2e6', '14.2 MHz ham “20 m band”'], ['100e6', '100 MHz FM radio'], ['433e6', '433 MHz ISM'],
            ['915e6', '915 MHz ISM'], ['1.575e9', '1.575 GHz GPS L1'], ['2.45e9', '2.45 GHz Wi-Fi / microwave oven'], ['5.8e9', '5.8 GHz Wi-Fi'],
            ['28e9', '28 GHz 5G FR2'], ['60e9', '60 GHz WiGig'], ['77e9', '77 GHz automotive radar']];
        var f = slider(ui.controls, { label: 'Frequency', min: 1e6, max: 100e9, log: true, value: 15e6, fmt: function (v) { return eng(v, 'Hz', 3); }, onInput: function () { draw(true); } });
        select(ui.controls, 'Preset', [['', 'Choose…']].concat(presets), '', function (v) { if (v) { f.set(+v); draw(true); } });
        var med = select(ui.controls, 'Medium', [['1', 'Free space / air (εr = 1)'], ['2.1', 'PTFE coax (εr ≈ 2.1)'], ['3.3', 'FR-4 microstrip (εeff ≈ 3.3)'], ['4.4', 'FR-4 stripline (εr ≈ 4.4)'], ['11.7', 'Silicon (εr ≈ 11.7)']], '1', function () { draw(true); });
        var objects = [[0.0856, 'a credit card'], [0.30, 'a ruler'], [1.75, 'a person'], [3.5, 'a car'], [12, 'a city bus'], [45, 'a 15-storey building'], [100, 'a football field'], [330, 'the Eiffel Tower']];
        var phase = 0;
        function draw() {
            var c = colors(), fr = f.get(), er = +med.get();
            var lam0 = 299792458 / fr, lam = lam0 / Math.sqrt(er);
            var half = 0.95 * lam0 / 2, quarter = 0.95 * lam0 / 4; // antennas radiate into air: use the free-space wavelength
            clear(svg);
            svg.setAttribute('viewBox', '0 0 640 220');
            var cx = 320, cy = 96, len = 440;
            // standing-wave current envelope: I(z) = cos(k z), |z| <= λ/4
            var amp = Math.cos(phase);
            var top = '', bot = '';
            for (var i = 0; i <= 80; i++) {
                var z = -1 + 2 * i / 80, x = cx + z * len / 2, e = Math.cos(z * Math.PI / 2) * 46;
                top += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (cy - e * amp).toFixed(1);
                bot = 'L' + x.toFixed(1) + ' ' + (cy + e * amp).toFixed(1) + bot;
            }
            s('path', { d: top + bot.replace(/^L/, 'L') + 'Z', fill: c.accent, opacity: 0.16 }, svg);
            s('path', { d: top, fill: 'none', stroke: c.accent, 'stroke-width': 1.5, opacity: 0.8 }, svg);
            s('line', { x1: cx - len / 2, x2: cx - 6, y1: cy, y2: cy, stroke: c.ink, 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
            s('line', { x1: cx + 6, x2: cx + len / 2, y1: cy, y2: cy, stroke: c.ink, 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
            s('circle', { cx: cx, cy: cy, r: 5, fill: c.signal }, svg);
            s('text', { x: cx, y: cy + 74, 'text-anchor': 'middle', 'font-size': 12, fill: c.muted, text: 'feed point (current is largest here, zero at the tips)' }, svg);
            s('line', { x1: cx - len / 2, x2: cx + len / 2, y1: 184, y2: 184, stroke: c.muted }, svg);
            s('line', { x1: cx - len / 2, x2: cx - len / 2, y1: 178, y2: 190, stroke: c.muted }, svg);
            s('line', { x1: cx + len / 2, x2: cx + len / 2, y1: 178, y2: 190, stroke: c.muted }, svg);
            s('text', { x: cx, y: 206, 'text-anchor': 'middle', 'font-size': 13, fill: c.ink, text: 'half-wave dipole ≈ ' + eng(half, 'm', 3) }, svg);
            var near = objects[0];
            objects.forEach(function (o) { if (Math.abs(Math.log(o[0] / half)) < Math.abs(Math.log(near[0] / half))) near = o; });
            s('text', { x: cx, y: 22, 'text-anchor': 'middle', 'font-size': 13, fill: c.ink2, text: 'about the size of ' + near[1] + (half > near[0] * 1.3 ? ' (or bigger)' : half < near[0] / 1.3 ? ' (or smaller)' : '') }, svg);
            readout(ui.readout, [['λ₀ = c/f', eng(lam0, 'm', 3)], ['λ in medium', eng(lam, 'm', 3)], ['λ/2 dipole', eng(half, 'm', 3)],
                ['λ/4 monopole', eng(quarter, 'm', 3)], ['Period', eng(1 / fr, 's', 3)]]);
        }
        var anim = animator(host, function (dt, still) { phase = still ? 0 : phase + dt * 2.2; draw(); });
        renders.push(function () { draw(); });
        draw();
    };

    // =====================================================================
    // Microring transmission (microring)
    // =====================================================================
    W.ring = function (host) {
        var ui = shell(host, 'Interactive: ring through-port spectrum', 'Move the coupling past the loss to cross critical coupling');
        var svg = svgStage(ui.stage, 'Through-port transmission of a microring versus wavelength');
        var R = 10e-6, ng = 4.2, neff = 2.4, L = 2 * Math.PI * R, lam0 = 1550e-9;
        var r = slider(ui.controls, { label: 'Self-coupling r (bus gap)', min: 0.80, max: 0.999, step: 0.001, value: 0.985, fmt: function (v) { return fmt(v, 3); }, onInput: draw });
        var a = slider(ui.controls, { label: 'Round-trip amplitude a (loss)', min: 0.90, max: 0.999, step: 0.001, value: 0.985, fmt: function (v) { return fmt(v, 3) + ' (' + fmt(-20 * Math.log10(v), 2) + ' dB)'; }, onInput: draw });
        var dT = slider(ui.controls, { label: 'Temperature change', min: -5, max: 5, step: 0.1, value: 0, fmt: function (v) { return (v > 0 ? '+' : '') + fmt(v, 1) + ' K'; }, onInput: draw });
        function T(lam, rr, aa, shift) {
            // phase from the group-index expansion around a resonance at 1550 nm + thermal shift
            var phi = 2 * Math.PI * ng * L * (1 / lam - 1 / (lam0 + shift)) * -1;
            var cphi = Math.cos(phi);
            return (aa * aa - 2 * aa * rr * cphi + rr * rr) / (1 - 2 * aa * rr * cphi + aa * aa * rr * rr);
        }
        function draw() {
            var c = colors(), rr = r.get(), aa = a.get(), shift = 0.075e-9 * dT.get();
            var fsr = lam0 * lam0 / (ng * L);
            var fwhm = (1 - rr * aa) * lam0 * lam0 / (Math.PI * ng * L * Math.sqrt(rr * aa));
            var Tmin = T(lam0 + shift, rr, aa, shift);
            clear(svg);
            var span = 1.2e-9;
            var pl = new Plot(svg, { W: 640, H: 260, x: [-span, span], y: [0, 1.02] });
            pl.axes(c, [-1.2e-9, -0.6e-9, 0, 0.6e-9, 1.2e-9], [0, 0.25, 0.5, 0.75, 1], 'Wavelength − 1550 nm (nm)', 'Through power', function (v) { return fmt(v * 1e9, 1); }, function (v) { return v; });
            var pts = [];
            for (var i = 0; i <= 600; i++) { var x = -span + 2 * span * i / 600; pts.push([x, T(lam0 + x, rr, aa, shift)]); }
            pl.path(pts, { stroke: c.accent });
            var laser = 0, tl = T(lam0, rr, aa, shift);
            s('line', { x1: pl.sx(laser), x2: pl.sx(laser), y1: pl.sy(0), y2: pl.sy(1.02), stroke: c.signal, 'stroke-dasharray': '4 4' }, svg);
            s('circle', { cx: pl.sx(laser), cy: pl.sy(tl), r: 5, fill: c.signal }, svg);
            s('text', { x: pl.sx(laser) + 8, y: pl.sy(1.02) + 14, 'font-size': 12, fill: c.signal, text: 'laser at 1550 nm' }, svg);
            var regime = Math.abs(rr - aa) < 0.0015 ? ['critically coupled', 'good'] : rr < aa ? ['over-coupled (r < a)', ''] : ['under-coupled (r > a)', ''];
            readout(ui.readout, [['Regime', regime[0], regime[1]], ['Extinction', Tmin < 1e-6 ? '> 60 dB' : fmt(-db10(Tmin), 1) + ' dB'],
                ['FWHM', fmt(fwhm * 1e9, 3) + ' nm'], ['Loaded Q', Math.round(lam0 / fwhm).toLocaleString()], ['FSR', fmt(fsr * 1e9, 2) + ' nm'],
                ['Laser power through', fmt(tl * 100, 0) + '%']]);
        }
        renders.push(draw); draw();
    };

    // =====================================================================
    // Mach-Zehnder transfer and distortion (mzm-driver)
    // =====================================================================
    W.mzm = function (host) {
        var ui = shell(host, 'Interactive: MZM bias and distortion', 'Move the bias off quadrature and watch the second harmonic appear');
        var svg = svgStage(ui.stage, 'MZM transfer curve with a sinusoidal drive and the resulting optical output');
        var bias = slider(ui.controls, { label: 'Bias (fraction of Vπ)', min: 0, max: 1, step: 0.01, value: 0.5, fmt: function (v) { return fmt(v, 2) + ' Vπ'; }, onInput: function () { draw(); } });
        var amp = slider(ui.controls, { label: 'RF drive amplitude', min: 0.02, max: 0.6, step: 0.01, value: 0.2, fmt: function (v) { return fmt(v, 2) + ' Vπ'; }, onInput: function () { draw(); } });
        var t0 = 0;
        function out(v) { return 0.5 * (1 + Math.cos(Math.PI * v)); } // eq. (1), φ = 0
        function harmonics(b, A) {
            var N = 256, re = [0, 0, 0, 0], im = [0, 0, 0, 0];
            for (var n = 0; n < N; n++) {
                var th = 2 * Math.PI * n / N, y = out(b + A * Math.sin(th));
                for (var k = 1; k <= 3; k++) { re[k] += y * Math.cos(k * th); im[k] += y * Math.sin(k * th); }
            }
            var m = function (k) { return Math.hypot(re[k], im[k]) * 2 / N; };
            return [m(1), m(2), m(3)];
        }
        function draw() {
            var c = colors(), b = bias.get(), A = amp.get();
            clear(svg);
            svg.setAttribute('viewBox', '0 0 640 270');
            // left: transfer curve P(V)
            var pl = new Plot(svg, { W: 640, H: 270, pad: { l: 50, r: 330, t: 14, b: 40 }, x: [0, 1.5], y: [0, 1.05] });
            pl.axes(c, [0, 0.5, 1, 1.5], [0, 0.5, 1], 'Drive voltage (Vπ)', 'P_out / P_in', function (v) { return v; }, function (v) { return v; });
            var pts = []; for (var i = 0; i <= 150; i++) { var v = 1.5 * i / 150; pts.push([v, out(v)]); }
            pl.path(pts, { stroke: c.accent });
            s('rect', { x: pl.sx(clamp(b - A, 0, 1.5)), y: pl.sy(1.05), width: pl.sx(clamp(b + A, 0, 1.5)) - pl.sx(clamp(b - A, 0, 1.5)), height: pl.sy(0) - pl.sy(1.05), fill: c.signal, opacity: 0.1 }, svg);
            var vnow = b + A * Math.sin(t0);
            s('circle', { cx: pl.sx(clamp(vnow, 0, 1.5)), cy: pl.sy(out(vnow)), r: 5, fill: c.signal }, svg);
            // right: output waveform vs time
            var pr = new Plot(svg, { W: 640, H: 270, pad: { l: 360, r: 16, t: 14, b: 40 }, x: [0, 2], y: [0, 1.05] });
            pr.axes(c, [0, 1, 2], [0, 0.5, 1], 'Time (RF periods)', '', function (v) { return v; }, function () { return ''; });
            var w = []; for (var j = 0; j <= 200; j++) { var tt = 2 * j / 200; w.push([tt, out(b + A * Math.sin(2 * Math.PI * tt + t0))]); }
            pr.path(w, { stroke: c.signal });
            var hm = harmonics(b, A);
            var dbc = function (x) { return x / hm[0] < 1e-6 ? '< −120 dBc' : fmt(20 * Math.log10(x / hm[0]), 1) + ' dBc'; };
            readout(ui.readout, [['Fundamental', fmt(hm[0], 3)], ['2nd harmonic', dbc(hm[1]), Math.abs(b - 0.5) < 0.02 ? 'good' : 'bad'], ['3rd harmonic', dbc(hm[2])],
                ['Bias', Math.abs(b - 0.5) < 0.02 ? 'at quadrature' : (b < 0.5 ? 'above' : 'below') + ' quadrature']]);
        }
        animator(host, function (dt, still) { if (!still) t0 += dt * 2.5; draw(); });
        renders.push(draw); draw();
    };

    // =====================================================================
    // Ring auto-tuning: coarse sweep, fine sweep, track (ring-auto-tuning)
    // =====================================================================
    W.tuning = function (host) {
        var ui = shell(host, 'Simulation: finding and holding a ring resonance', 'Press “Tune”, then add temperature drift');
        var svg = svgStage(ui.stage, 'Monitor photodiode signal versus heater setting and over time');
        var drift = slider(ui.controls, { label: 'Ambient drift', min: 0, max: 3, step: 0.1, value: 1, fmt: function (v) { return fmt(v, 1) + ' K/s (fast, for show)'; } });
        var btns = h('div', { class: 'ctrl' }, [h('span', { text: 'Controller' })]);
        var go = h('button', { type: 'button', class: 'button', text: 'Tune' });
        var off = h('button', { type: 'button', class: 'button ghost', text: 'Loop off' });
        btns.appendChild(h('div', { style: 'display:flex;gap:8px' }, [go, off]));
        ui.controls.appendChild(btns);
        // Model: resonance offset (nm) = fab offset + 0.075 nm/K * dT - k * V^2 (heater red-shifts; laser fixed)
        var st = { V: 0, mode: 'idle', dT: 0, fab: 1.1, sweepV: 0, best: [0, -1], hist: [], t: 0, dir: 1 };
        var Vmax = 5, kV = 0.12, fw = 0.155; // nm per V^2, linewidth nm
        function detune(V) { return st.fab + 0.075 * st.dT - kV * V * V; }
        function monitor(V) { var d = detune(V) / (fw / 2); return 1 / (1 + d * d) + 0.01 * randn(); } // drop-port Lorentzian
        go.addEventListener('click', function () { st.mode = 'coarse'; st.sweepV = 0; st.best = [0, -1]; });
        off.addEventListener('click', function () { st.mode = 'idle'; });
        function step(dt) {
            st.t += dt;
            st.dT += drift.get() * dt * (Math.sin(st.t * 0.25) > 0 ? 1 : -1);
            st.dT = clamp(st.dT, -12, 12);
            if (st.mode === 'coarse') {
                for (var i = 0; i < 6; i++) {
                    st.sweepV += 0.01; var m = monitor(st.sweepV);
                    if (m > st.best[1]) st.best = [st.sweepV, m];
                    if (st.sweepV >= Vmax) { st.mode = 'fine'; st.sweepV = Math.max(0, st.best[0] - 0.15); st.fineEnd = st.best[0] + 0.15; st.best = [st.best[0], -1]; break; }
                }
                st.V = st.sweepV;
            } else if (st.mode === 'fine') {
                for (var j = 0; j < 3; j++) {
                    st.sweepV += 0.002; var mf = monitor(st.sweepV);
                    if (mf > st.best[1]) st.best = [st.sweepV, mf];
                    if (st.sweepV >= st.fineEnd) { st.mode = 'track'; st.V = st.best[0]; break; }
                }
                if (st.mode === 'fine') st.V = st.sweepV;
            } else if (st.mode === 'track') {
                // dither: try a small step each way, keep whichever reads higher
                var dv = 0.004, up = monitor(st.V + dv), dn = monitor(st.V - dv), mid = monitor(st.V);
                if (up > mid && up >= dn) st.V += dv; else if (dn > mid) st.V -= dv;
                st.V = clamp(st.V, 0, Vmax);
            }
            st.hist.push(monitor(st.V)); if (st.hist.length > 240) st.hist.shift();
        }
        function draw() {
            var c = colors();
            clear(svg); svg.setAttribute('viewBox', '0 0 640 250');
            var pl = new Plot(svg, { W: 640, H: 250, pad: { l: 50, r: 340, t: 14, b: 40 }, x: [0, Vmax], y: [0, 1.1] });
            pl.axes(c, [0, 1, 2, 3, 4, 5], [0, 0.5, 1], 'Heater voltage (V)', 'Monitor', function (v) { return v; }, function (v) { return v; });
            var pts = []; for (var i = 0; i <= 300; i++) { var V = Vmax * i / 300, d = detune(V) / (fw / 2); pts.push([V, 1 / (1 + d * d)]); }
            pl.path(pts, { stroke: c.accent });
            s('line', { x1: pl.sx(st.V), x2: pl.sx(st.V), y1: pl.sy(0), y2: pl.sy(1.1), stroke: c.signal, 'stroke-width': 1.5 }, svg);
            var pr = new Plot(svg, { W: 640, H: 250, pad: { l: 350, r: 16, t: 14, b: 40 }, x: [0, 240], y: [0, 1.1] });
            pr.axes(c, [], [0, 0.5, 1], 'Time →', '', null, function () { return ''; });
            pr.path(st.hist.map(function (v, i) { return [i + 240 - st.hist.length, v]; }), { stroke: c.signal, 'stroke-width': 1.5 });
            var label = { idle: 'loop off', coarse: 'coarse sweep', fine: 'fine sweep', track: 'tracking (dither)' }[st.mode];
            var m = st.hist.length ? st.hist[st.hist.length - 1] : 0;
            readout(ui.readout, [['State', label, st.mode === 'track' ? 'good' : ''], ['Heater', fmt(st.V, 2) + ' V'], ['Heater power ∝ V²', fmt(st.V * st.V, 2)],
                ['Ambient change', fmt(st.dT, 1) + ' K'], ['Monitor', fmt(clamp(m, 0, 1) * 100, 0) + '%', m > 0.8 ? 'good' : 'bad']]);
        }
        animator(host, function (dt, still) { if (!still) step(dt); draw(); });
        renders.push(draw); draw();
    };

    // =====================================================================
    // Eye diagram with channel loss and equalization (serdes-circuits)
    // =====================================================================
    W.eye = function (host) {
        var ui = shell(host, 'Simulation: eye diagram through a lossy channel', 'Add loss, then equalize');
        var canvas = h('canvas', { width: 1280, height: 520, role: 'img', 'aria-label': 'Eye diagram' });
        ui.stage.appendChild(canvas);
        ui.stage.appendChild(h('p', { class: 'widget-hint', style: 'margin:4px 4px 0', text: 'Window: 2 UI, centered on the sampling point (dashed). Simplified channel: two real poles.' }));
        var ctx = canvas.getContext('2d');
        var mod = seg(ui.controls, 'Modulation', [['2', 'NRZ'], ['4', 'PAM4']], '2', rebuild);
        var loss = slider(ui.controls, { label: 'Channel loss at Nyquist', min: 0, max: 36, step: 0.5, value: 14, fmt: function (v) { return fmt(v, 1) + ' dB'; }, onInput: rebuild });
        var ffe = slider(ui.controls, { label: 'TX FFE post-cursor tap', min: 0, max: 0.35, step: 0.01, value: 0, fmt: function (v) { return v === 0 ? 'off' : '−' + fmt(v, 2) + ' (' + fmt(-20 * Math.log10(1 - 2 * v || 1e-3), 1) + ' dB)'; }, onInput: rebuild });
        var ctle = slider(ui.controls, { label: 'RX CTLE peaking', min: 0, max: 14, step: 0.5, value: 0, fmt: function (v) { return fmt(v, 1) + ' dB'; }, onInput: rebuild });
        var dfe = select(ui.controls, 'RX DFE taps', [['0', 'Off'], ['1', '1 tap'], ['3', '3 taps'], ['8', '8 taps']], '0', rebuild);
        var noise = slider(ui.controls, { label: 'Noise (rms, % of swing)', min: 0, max: 6, step: 0.1, value: 1, fmt: function (v) { return fmt(v, 1) + '%'; }, onInput: rebuild });
        var OS = 32, NP = 24, pulse = [], cur = 0, levels = [], syms = [], wave = [], pos = 0, peakSwing = 1;
        function lpf(x, fc) { // fc in cycles/sample
            var a = 1 - Math.exp(-2 * Math.PI * fc), y = 0;
            return x.map(function (v) { y += a * (v - y); return y; });
        }
        function buildPulse() {
            var n = NP * OS, x = new Array(n).fill(0);
            var c1 = ffe.get();
            for (var i = 0; i < OS; i++) { x[2 * OS + i] = 1 - c1; x[3 * OS + i] = -c1; } // 2-tap TX FFE
            var fN = 0.5 / OS, Ld = loss.get(), np = 2;
            var y = x;
            if (Ld > 0) {
                var fc = fN / Math.sqrt(Math.pow(10, Ld / (10 * np)) - 1);
                for (var k = 0; k < np; k++) y = lpf(y, fc);
            }
            var pk = ctle.get();
            if (pk > 0) { // CTLE: y + g*(y - LP(y)) boosts high frequencies by about (1+g)
                var g = Math.pow(10, pk / 20) - 1, lp = lpf(y, fN / 2);
                y = y.map(function (v, i) { return v + g * (v - lp[i]); });
            }
            // sample at the pulse peak, then scale so the main cursor is 1
            var best = 0; for (var j = 0; j < n; j++) if (y[j] > y[best]) best = j;
            cur = best % OS;
            var main = y[best];
            pulse = y.map(function (v) { return v / main; });
            // worst-case excursion over all phases sets the vertical scale
            peakSwing = 0;
            for (var ph = 0; ph < OS; ph++) {
                var sum = 0;
                for (var q = 0; q < NP; q++) sum += Math.abs(pulse[q * OS + ph] || 0);
                peakSwing = Math.max(peakSwing, sum);
            }
            return Math.floor(best / OS);
        }
        var mainIdx = 0;
        function rebuild() {
            mainIdx = buildPulse();
            var M = +mod.get();
            levels = []; for (var i = 0; i < M; i++) levels.push(-1 + 2 * i / (M - 1));
            syms = []; wave = []; pos = 0;
            ctx.fillStyle = colors().surface; ctx.fillRect(0, 0, canvas.width, canvas.height);
            gen(600);
            paint(600, true);
        }
        function gen(count) {
            // generate symbols and waveform by superposing pulse responses
            var M = levels.length, nTaps = +dfe.get();
            for (var k = 0; k < count; k++) syms.push(levels[Math.floor(Math.random() * M)]);
            var total = syms.length * OS + NP * OS;
            while (wave.length < total) wave.push(0);
            for (var s0 = syms.length - count; s0 < syms.length; s0++) {
                var a = syms[s0];
                for (var t = 0; t < pulse.length; t++) wave[s0 * OS + t] += a * pulse[t];
            }
            // DFE: subtract the post-cursors of already-decided symbols (ideal decisions)
            if (nTaps > 0) {
                for (var s1 = syms.length - count; s1 < syms.length; s1++) {
                    for (var tap = 1; tap <= nTaps; tap++) {
                        var hk = pulse[(mainIdx + tap) * OS + cur] || 0, start = (s1 + tap + mainIdx) * OS + cur - OS / 2;
                        for (var u = 0; u < OS; u++) if (start + u >= 0 && start + u < wave.length) wave[start + u] -= syms[s1] * hk;
                    }
                }
            }
        }
        var stats = { h: 0 };
        function paint(count, fresh) {
            var c = colors(), Wc = canvas.width, Hc = canvas.height, nv = noise.get() / 100 * 2; // rms, as a fraction of the 2-unit swing
            if (!fresh) { ctx.globalAlpha = 0.04; ctx.fillStyle = c.surface; ctx.fillRect(0, 0, Wc, Hc); ctx.globalAlpha = 1; }
            var ymax = Math.max(1.2, peakSwing * 1.05 + 3 * nv), sy = function (v) { return Hc / 2 - v / ymax * (Hc / 2 - 20); };
            ctx.strokeStyle = c.accent; ctx.lineWidth = 2.6; ctx.globalAlpha = 0.22;
            var off = mainIdx * OS + cur - OS; // window: one UI before the sampling point to one after
            var first = Math.max(NP, syms.length - count);
            for (var k = first; k < syms.length - NP; k++) {
                ctx.beginPath();
                for (var t = 0; t <= 2 * OS; t++) {
                    var v = wave[k * OS + off + t] + nv * randn();
                    var x = t / (2 * OS) * Wc;
                    if (t) ctx.lineTo(x, sy(v)); else ctx.moveTo(x, sy(v));
                }
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            // inner eye height at the sampling instant: worst-case ISI, minus ±3σ of noise
            var M = levels.length, groups = levels.map(function () { return [Infinity, -Infinity]; });
            for (var q = NP; q < syms.length - NP; q++) {
                var gi = levels.indexOf(syms[q]), val = wave[(q + mainIdx) * OS + cur];
                groups[gi][0] = Math.min(groups[gi][0], val); groups[gi][1] = Math.max(groups[gi][1], val);
            }
            var hmin = Infinity;
            for (var g = 0; g < M - 1; g++) hmin = Math.min(hmin, groups[g + 1][0] - groups[g][1] - 2 * 3 * nv);
            stats.h = hmin / (2 / (M - 1));
            ctx.strokeStyle = c.signal; ctx.setLineDash([8, 8]); ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(Wc / 2, 10); ctx.lineTo(Wc / 2, Hc - 10); ctx.stroke(); ctx.setLineDash([]);
            var open = stats.h > 0;
            var mn = +mod.get();
            readout(ui.readout, [['Eye height (inner, vs. ideal)', open ? fmt(stats.h * 100, 0) + '%' : 'closed', open && stats.h > 0.3 ? 'good' : 'bad'],
                ['Symbols / bit', mn === 2 ? '1 bit per UI' : '2 bits per UI, each eye 1/3 the swing'], ['First post-cursor h₁', fmt(pulse[(mainIdx + 1) * OS + cur], 2)]]);
        }
        animator(host, function (dt, still) {
            if (still) return;
            if (syms.length > 4000) { syms = []; wave = []; gen(NP * 2 + 600); }
            gen(12); paint(12, false);
        });
        renders.push(rebuild); rebuild();
    };

    // =====================================================================
    // Lane-rate calculator (serdes-circuits)
    // =====================================================================
    W.lanes = function (host) {
        var ui = shell(host, 'Interactive: what a lane rate means for the circuit', 'Pick a standard or set your own');
        var svg = svgStage(ui.stage, 'Unit interval and Nyquist frequency for the chosen lane');
        var std = [['2.5e9|2|8b/10b', 'PCIe 1.0 · 2.5 GT/s NRZ'], ['8e9|2|128b/130b', 'PCIe 3.0 · 8 GT/s NRZ'], ['32e9|2|128b/130b', 'PCIe 5.0 · 32 GT/s NRZ'],
            ['64e9|4|FLIT', 'PCIe 6.0 · 64 GT/s PAM4'], ['128e9|4|FLIT', 'PCIe 7.0 · 128 GT/s PAM4'], ['10.3125e9|2|64b/66b', '10GBASE-KR · 10.3125 Gb/s NRZ'],
            ['25.78125e9|2|64b/66b', '25GBASE-KR · 25.78 Gb/s NRZ'], ['53.125e9|4|RS-FEC', '50G/lane · 26.56 GBd PAM4'], ['106.25e9|4|RS-FEC', '100G/lane (802.3ck) · 53.125 GBd PAM4'],
            ['212.5e9|4|RS-FEC', '200G/lane (802.3dj) · 106.25 GBd PAM4'], ['20e9|2|128b/132b', 'DisplayPort UHBR20 · 20 Gb/s NRZ']];
        var rate = 32e9, M = 2, coding = '128b/130b';
        select(ui.controls, 'Standard', std, std[2][0], function (v) { var p = v.split('|'); rate = +p[0]; M = +p[1]; coding = p[2]; r.set(rate); mods(); draw(); });
        var r = slider(ui.controls, { label: 'Line rate', min: 1e9, max: 448e9, log: true, value: rate, fmt: function (v) { return eng(v, 'b/s', 3); }, onInput: function (v) { rate = v; coding = 'custom'; draw(); } });
        var mbox = h('div'); ui.controls.appendChild(mbox);
        function mods() { clear(mbox); seg(mbox, 'Modulation', [['2', 'NRZ'], ['3', 'PAM3'], ['4', 'PAM4']], String(M), function (v) { M = +v; draw(); }); }
        mods();
        function draw() {
            var c = colors(), bits = M === 3 ? 1.5 : Math.log2(M), baud = rate / bits, ui_s = 1 / baud, fn = baud / 2;
            clear(svg); svg.setAttribute('viewBox', '0 0 640 150');
            var x0 = 40, wpx = 560;
            for (var k = 0; k < 4; k++) {
                s('rect', { x: x0 + k * wpx / 4, y: 30, width: wpx / 4 - 4, height: 48, rx: 4, fill: k % 2 ? c.s2 : c.accent, opacity: k % 2 ? 1 : 0.25 }, svg);
                s('text', { x: x0 + k * wpx / 4 + wpx / 8, y: 59, 'text-anchor': 'middle', 'font-size': 13, fill: c.ink, text: '1 UI' }, svg);
            }
            s('text', { x: x0, y: 20, 'font-size': 12.5, fill: c.ink2, text: '4 unit intervals = ' + eng(4 * ui_s, 's', 3) + '. Light travels ' + eng(4 * ui_s * 3e8 / Math.sqrt(4), 'm', 2) + ' in FR-4 in that time.' }, svg);
            var p = 'M' + x0 + ' 118';
            for (var i = 0; i <= 200; i++) { var x = x0 + wpx * i / 200; p += 'L' + x.toFixed(1) + ' ' + (118 - 22 * Math.sin(2 * Math.PI * 2 * i / 200)).toFixed(1); }
            s('path', { d: p, fill: 'none', stroke: c.signal, 'stroke-width': 2 }, svg);
            s('text', { x: x0, y: 146, 'font-size': 12.5, fill: c.ink2, text: 'Nyquist tone: one full cycle every 2 UI (the 1010… pattern) = ' + eng(fn, 'Hz', 3) }, svg);
            readout(ui.readout, [['Symbol rate', eng(baud, 'Bd', 3)], ['UI', eng(ui_s, 's', 3)], ['Nyquist', eng(fn, 'Hz', 3)],
                ['Bits / symbol', M === 3 ? '1.5 (3 bits in 2 symbols)' : fmt(bits, 0)], ['Eye penalty vs NRZ', M === 2 ? '0 dB' : fmt(20 * Math.log10(M - 1), 1) + ' dB'], ['Coding', coding]]);
        }
        renders.push(draw); draw();
    };

    // =====================================================================
    // Pixel driver: Vth variation and compensation (display-circuits)
    // =====================================================================
    W.pixels = function (host) {
        var ui = shell(host, 'Simulation: threshold-voltage variation on a panel', 'Raise the Vth spread, then turn on compensation');
        var svg = svgStage(ui.stage, 'A grid of pixels whose brightness depends on each drive transistor threshold');
        var sig = slider(ui.controls, { label: 'Vth spread σ (TFT to TFT)', min: 0, max: 0.3, step: 0.005, value: 0.1, fmt: function (v) { return fmt(v * 1000, 0) + ' mV'; }, onInput: draw });
        var gray = slider(ui.controls, { label: 'Gray level (overdrive Vgs − Vth)', min: 0.3, max: 3, step: 0.05, value: 1.0, fmt: function (v) { return fmt(v, 2) + ' V'; }, onInput: draw });
        var mode = seg(ui.controls, 'Pixel circuit', [['2t1c', '2T1C (no comp.)'], ['comp', 'Vth-compensated']], '2t1c', draw);
        var NX = 24, NY = 12, dv = [];
        for (var i = 0; i < NX * NY; i++) dv.push(randn());
        function draw() {
            var c = colors(), sg = sig.get(), vov = gray.get(), cmp = mode.get() === 'comp';
            clear(svg); svg.setAttribute('viewBox', '0 0 640 300');
            var cell = 22, x0 = (640 - NX * cell) / 2, y0 = 10, vals = [];
            for (var k = 0; k < NX * NY; k++) {
                // saturation: I ∝ (Vgs − Vth)^2. Compensated pixel stores Vth on Cst, leaving ~3% residual.
                var err = sg * dv[k] * (cmp ? 0.03 : 1);
                var ov = Math.max(0, vov - err);
                vals.push(ov * ov / (vov * vov));
            }
            var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
            vals.forEach(function (v, k) {
                var x = x0 + (k % NX) * cell, y = y0 + Math.floor(k / NX) * cell;
                var lv = clamp(v / Math.max(mean * 1.6, 1e-9), 0, 1);
                s('rect', { x: x + 1, y: y + 1, width: cell - 2, height: cell - 2, rx: 2, fill: 'rgb(' + Math.round(40 + 215 * lv) + ',' + Math.round(40 + 200 * lv) + ',' + Math.round(60 + 120 * lv) + ')' }, svg);
            });
            var mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
            var sd = Math.sqrt(vals.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / vals.length);
            s('text', { x: 320, y: y0 + NY * cell + 22, 'text-anchor': 'middle', 'font-size': 12.5, fill: c.muted, text: 'Each square is one pixel at the same gray level. I_OLED ∝ (V_GS − V_th)²' }, svg);
            readout(ui.readout, [['Brightness spread (σ/mean)', fmt(sd / mean * 100, 1) + '%', sd / mean < 0.02 ? 'good' : 'bad'],
                ['Max / min', mn > 0 ? fmt(mx / mn, 2) + '×' : '∞'], ['Sensitivity ΔI/I ≈ 2·ΔVth/Vov', fmt(2 * sg / vov * 100 * (cmp ? 0.03 : 1), 1) + '% per σ']]);
        }
        renders.push(draw); draw();
    };

    // =====================================================================
    // LED efficiency: ABC model with sidewall recombination (display-circuits)
    // =====================================================================
    W.led = function (host) {
        var ui = shell(host, 'Interactive: why tiny LEDs lose efficiency', 'ABC recombination model with sidewall loss');
        var svg = svgStage(ui.stage, 'Internal quantum efficiency versus current density for two LED sizes');
        var size = slider(ui.controls, { label: 'LED size (side length)', min: 2, max: 200, log: true, value: 10, fmt: function (v) { return fmt(v, v < 10 ? 1 : 0) + ' µm'; }, onInput: draw });
        var S = slider(ui.controls, { label: 'Surface recombination velocity', min: 1e2, max: 1e5, log: true, value: 1e4, fmt: function (v) { return v.toExponential(0).replace(/e\+(\d+)/, function (_, e) { return '×10' + sup(e); }) + ' cm/s'; }, onInput: draw });
        var q = 1.602e-19, d = 3e-7, A0 = 1e7, B = 1e-11, C = 1e-30; // d: active thickness (cm), SI-cm units
        function curve(side_um) {
            var A = A0 + 4 * S.get() / (side_um * 1e-4); // sidewall adds 4S/side
            var pts = [];
            for (var e = 14; e <= 21; e += 0.02) {
                var n = Math.pow(10, e), R = A * n + B * n * n + C * n * n * n;
                var J = q * d * R; // A/cm^2
                pts.push([J, B * n * n / R]);
            }
            return { pts: pts, A: A };
        }
        function draw() {
            var c = colors();
            clear(svg);
            var pl = new Plot(svg, { W: 640, H: 280, x: [1e-3, 1e3], xlog: true, y: [0, 1] });
            pl.axes(c, logTicks(1e-3, 1e3), [0, 0.25, 0.5, 0.75, 1], 'Current density (A/cm²)', 'Internal quantum efficiency',
                function (v) { return v >= 1 ? String(v) : v.toExponential(0).replace('e', 'e'); }, function (v) { return Math.round(v * 100) + '%'; });
            var big = curve(200), small = curve(size.get());
            pl.path(big.pts, { stroke: c.muted, 'stroke-dasharray': '5 4' });
            pl.path(small.pts, { stroke: c.accent, 'stroke-width': 2.5 });
            var peak = small.pts.reduce(function (a, b) { return b[1] > a[1] ? b : a; });
            s('circle', { cx: pl.sx(peak[0]), cy: pl.sy(peak[1]), r: 5, fill: c.signal }, svg);
            s('text', { x: pl.sx(1e-3) + 8, y: pl.sy(0.95), 'font-size': 12, fill: c.muted, text: '- - 200 µm reference' }, svg);
            // micro-display pixels run at roughly 0.1–10 A/cm^2
            s('rect', { x: pl.sx(0.1), y: pl.sy(1), width: pl.sx(10) - pl.sx(0.1), height: pl.sy(0) - pl.sy(1), fill: c.signal, opacity: 0.07 }, svg);
            s('text', { x: pl.sx(1), y: pl.sy(0.05), 'text-anchor': 'middle', 'font-size': 11.5, fill: c.signal, text: 'typical display operating range' }, svg);
            var atOne = small.pts.reduce(function (a, b) { return Math.abs(Math.log(b[0])) < Math.abs(Math.log(a[0])) ? b : a; });
            readout(ui.readout, [['Peak IQE', fmt(peak[1] * 100, 0) + '%'], ['at J ≈', eng(peak[0], 'A/cm²', 2)], ['IQE at 1 A/cm²', fmt(atOne[1] * 100, 0) + '%', atOne[1] > 0.5 ? 'good' : 'bad'],
                ['Effective A', small.A.toExponential(1).replace(/e\+(\d+)/, function (_, e) { return '×10' + sup(e); }) + ' s⁻¹']]);
        }
        renders.push(draw); draw();
    };

    // =====================================================================
    // LDO load-step response (display-circuits)
    // =====================================================================
    W.ldo = function (host) {
        var ui = shell(host, 'Simulation: LDO load step', 'Simplified loop: transconductance gm plus one gate pole');
        var svg = svgStage(ui.stage, 'Output voltage of an LDO after a load current step');
        var Cout = slider(ui.controls, { label: 'Output capacitor', min: 100e-12, max: 10e-6, log: true, value: 1e-6, fmt: function (v) { return eng(v, 'F', 2); }, onInput: draw });
        var gm = slider(ui.controls, { label: 'Loop transconductance (gain)', min: 0.1, max: 100, log: true, value: 10, fmt: function (v) { return fmt(v, v < 1 ? 2 : 1) + ' A/V'; }, onInput: draw });
        var fp = slider(ui.controls, { label: 'Pass-device gate pole', min: 100e3, max: 100e6, log: true, value: 5e6, fmt: function (v) { return eng(v, 'Hz', 2); }, onInput: draw });
        var dI = slider(ui.controls, { label: 'Load step', min: 1e-3, max: 0.5, log: true, value: 0.1, fmt: function (v) { return eng(v, 'A', 2); }, onInput: draw });
        function sim() {
            // dI/dt = (gm·(Vref − V) − I)/τ ;  dV/dt = (I − Iload)/C   (V measured from the regulated level)
            var C = Cout.get(), G = gm.get(), tau = 1 / (2 * Math.PI * fp.get()), step = dI.get();
            var ugb = G / (2 * Math.PI * C), wn = Math.sqrt(G / (tau * C));
            var T = Math.max(12 / wn, 4 * tau), N = 1600, dt = T / N;
            var V = 0, I = 0, pts = [], mn = 0;
            for (var k = 0; k < N; k++) {
                var t = k * dt, Il = t > T * 0.1 ? step : 0;
                I = (I + dt / tau * G * (-V)) / (1 + dt / tau); // backward Euler: stable even when dt > tau
                V += (I - Il) / C * dt;
                pts.push([t, V]); mn = Math.min(mn, V);
            }
            var pm = 90 - Math.atan(ugb / fp.get()) * 180 / Math.PI;
            return { pts: pts, T: T, mn: mn, ugb: ugb, pm: pm, ss: -step / G };
        }
        function draw() {
            var c = colors(), r = sim();
            var lo = Math.min(r.mn * 1.15, -1e-6), hi = Math.max(-lo * 0.8, 1e-6);
            for (var i = 0; i < r.pts.length; i++) hi = Math.max(hi, r.pts[i][1] * 1.1);
            clear(svg);
            var pl = new Plot(svg, { W: 640, H: 260, pad: { l: 64, r: 16, t: 14, b: 40 }, x: [0, r.T], y: [lo, hi] });
            var yt = [lo, lo / 2, 0, hi / 2].filter(function (v, i, a) { return a.indexOf(v) === i; });
            pl.axes(c, [0, r.T / 4, r.T / 2, 3 * r.T / 4, r.T], yt, 'Time', 'ΔV_out',
                function (v) { return eng(v, 's', 1); }, function (v) { return eng(v, 'V', 0); });
            pl.path(r.pts, { stroke: c.accent, 'stroke-width': 2.2 });
            readout(ui.readout, [['Undershoot', eng(-r.mn, 'V', 2), -r.mn < 0.05 ? 'good' : 'bad'], ['Unity-gain BW ≈ gm/2πC', eng(r.ugb, 'Hz', 2)],
                ['Phase margin ≈ 90° − atan(UGB/f_p)', fmt(r.pm, 0) + '°', r.pm > 45 ? 'good' : 'bad'], ['Load regulation ΔI/gm', eng(-r.ss, 'V', 2)]]);
        }
        renders.push(draw); draw();
    };

    // =====================================================================
    // Switched-capacitor converter output resistance (display-circuits)
    // =====================================================================
    W.sc = function (host) {
        var ui = shell(host, 'Interactive: 2:1 switched-capacitor converter', 'Slow-switching vs fast-switching limits');
        var svg = svgStage(ui.stage, 'Output resistance versus switching frequency');
        var Cf = slider(ui.controls, { label: 'Flying capacitor', min: 10e-12, max: 100e-9, log: true, value: 1e-9, fmt: function (v) { return eng(v, 'F', 2); }, onInput: draw });
        var Ron = slider(ui.controls, { label: 'Switch on-resistance (each of 4)', min: 0.05, max: 20, log: true, value: 1, fmt: function (v) { return eng(v, 'Ω', 2); }, onInput: draw });
        var fsw = slider(ui.controls, { label: 'Switching frequency', min: 1e5, max: 1e9, log: true, value: 20e6, fmt: function (v) { return eng(v, 'Hz', 2); }, onInput: draw });
        var Io = slider(ui.controls, { label: 'Load current', min: 1e-3, max: 1, log: true, value: 0.05, fmt: function (v) { return eng(v, 'A', 2); }, onInput: draw });
        var Vin = 3.6;
        function draw() {
            var c = colors(), C = Cf.get(), R = Ron.get();
            var ssl = function (f) { return 1 / (4 * C * f); }, fsl = 2 * R, rout = function (f) { return Math.hypot(ssl(f), fsl); };
            clear(svg);
            var lo = fsl / 3, hi = Math.max(ssl(1e5), fsl * 10);
            var pl = new Plot(svg, { W: 640, H: 270, x: [1e5, 1e9], xlog: true, y: [lo, hi], ylog: true });
            pl.axes(c, logTicks(1e5, 1e9), logTicks(lo, hi), 'Switching frequency (Hz)', 'R_out (Ω)', function (v) { return eng(v, '', 0); }, function (v) { return eng(v, '', 0); });
            var a = [], b = [], o = [];
            for (var e = 5; e <= 9; e += 0.02) { var f = Math.pow(10, e); a.push([f, ssl(f)]); b.push([f, fsl]); o.push([f, rout(f)]); }
            pl.path(a, { stroke: c.muted, 'stroke-dasharray': '5 4' });
            pl.path(b, { stroke: c.muted, 'stroke-dasharray': '2 4' });
            pl.path(o, { stroke: c.accent, 'stroke-width': 2.5 });
            var fn = fsw.get(), ro = rout(fn);
            s('circle', { cx: pl.sx(fn), cy: pl.sy(clamp(ro, lo, hi)), r: 5, fill: c.signal }, svg);
            s('text', { x: pl.sx(2e5), y: pl.sy(clamp(ssl(2e5), lo, hi)) + 16, 'font-size': 11.5, fill: c.muted, text: 'SSL: 1/(4·C·f)' }, svg);
            s('text', { x: pl.sx(2e8), y: pl.sy(fsl) - 8, 'font-size': 11.5, fill: c.muted, text: 'FSL: 2·R_on' }, svg);
            var fc = 1 / (8 * C * R); // corner where SSL = FSL
            var vout = Vin / 2 - Io.get() * ro;
            readout(ui.readout, [['R_out', eng(ro, 'Ω', 2)], ['Corner f (SSL = FSL)', eng(fc, 'Hz', 2)], ['V_out = V_in/2 − I·R_out', fmt(vout, 3) + ' V (V_in = 3.6 V)'],
                ['Conduction efficiency', fmt(Math.max(0, vout / (Vin / 2)) * 100, 1) + '%', vout / (Vin / 2) > 0.9 ? 'good' : 'bad']]);
        }
        renders.push(draw); draw();
    };

    // =====================================================================
    // Arrhenius acceleration (post-silicon)
    // =====================================================================
    W.arrhenius = function (host) {
        var ui = shell(host, 'Interactive: how long is 1000 hours at 125 °C?', 'Arrhenius acceleration factor');
        var svg = svgStage(ui.stage, 'Bathtub failure-rate curve');
        var Ea = slider(ui.controls, { label: 'Activation energy Eₐ', min: 0.3, max: 1.5, step: 0.05, value: 0.7, fmt: function (v) { return fmt(v, 2) + ' eV'; }, onInput: draw });
        var Tu = slider(ui.controls, { label: 'Use temperature', min: 25, max: 105, step: 1, value: 55, fmt: function (v) { return v + ' °C'; }, onInput: draw });
        var Ts = slider(ui.controls, { label: 'Stress temperature', min: 85, max: 175, step: 1, value: 125, fmt: function (v) { return v + ' °C'; }, onInput: draw });
        var hrs = slider(ui.controls, { label: 'Stress time', min: 48, max: 4000, log: true, value: 1000, fmt: function (v) { return Math.round(v) + ' h'; }, onInput: draw });
        function draw() {
            var c = colors(), k = 8.617e-5;
            var AF = Math.exp(Ea.get() / k * (1 / (Tu.get() + 273.15) - 1 / (Ts.get() + 273.15)));
            var eq = AF * hrs.get();
            clear(svg); svg.setAttribute('viewBox', '0 0 640 200');
            var pl = new Plot(svg, { W: 640, H: 200, pad: { l: 40, r: 16, t: 14, b: 36 }, x: [0, 1], y: [0, 1] });
            pl.axes(c, [], [], 'Time in the field →', 'Rate', null, null);
            var pts = [];
            for (var i = 0; i <= 200; i++) { var t = i / 200; pts.push([t, 0.12 + 0.75 * Math.exp(-t / 0.05) + 0.7 * Math.pow(t, 6)]); }
            pl.path(pts, { stroke: c.accent, 'stroke-width': 2.5 });
            [['infant mortality', 0.17, 'burn-in screens these out'], ['useful life', 0.5, 'random failures, flat rate'], ['wear-out', 0.84, 'EM, TDDB, HCI, NBTI']].forEach(function (z) {
                s('text', { x: pl.sx(z[1]), y: pl.sy(0.62), 'text-anchor': 'middle', 'font-size': 12.5, fill: c.ink, text: z[0] }, svg);
                s('text', { x: pl.sx(z[1]), y: pl.sy(0.62) + 16, 'text-anchor': 'middle', 'font-size': 11.5, fill: c.muted, text: z[2] }, svg);
            });
            readout(ui.readout, [['Acceleration factor', fmt(AF, AF < 10 ? 1 : 0) + '×'], ['Equivalent use time', Math.round(eq).toLocaleString() + ' h'],
                ['≈', fmt(eq / 8766, 1) + ' years', eq / 8766 > 7 ? 'good' : '']]);
        }
        renders.push(draw); draw();
    };

    // =====================================================================
    // Jitter bathtub (post-silicon, serdes-circuits)
    // =====================================================================
    W.bathtub = function (host) {
        var ui = shell(host, 'Interactive: jitter bathtub curve', 'Dual-Dirac model: TJ = DJ + 2·Q(BER)·σ');
        var svg = svgStage(ui.stage, 'Bit error rate versus sampling position across one unit interval');
        var rate = slider(ui.controls, { label: 'Data rate', min: 1e9, max: 112e9, log: true, value: 25e9, fmt: function (v) { return eng(v, 'b/s', 3); }, onInput: draw });
        var rj = slider(ui.controls, { label: 'Random jitter σ (RJ rms)', min: 0.05, max: 3, step: 0.01, value: 0.6, fmt: function (v) { return fmt(v, 2) + ' ps'; }, onInput: draw });
        var dj = slider(ui.controls, { label: 'Deterministic jitter (DJδδ)', min: 0, max: 20, step: 0.1, value: 6, fmt: function (v) { return fmt(v, 1) + ' ps'; }, onInput: draw });
        var target = select(ui.controls, 'Target BER', [['1e-6', '10⁻⁶'], ['1e-12', '10⁻¹²'], ['1e-15', '10⁻¹⁵']], '1e-12', draw);
        function draw() {
            var c = colors(), UI = 1e12 / rate.get(), sg = rj.get(), DJ = dj.get(), rho = 0.5;
            var ber = function (t) { // t in ps from the left crossing
                var L = rho * 0.5 * (qfunc((t - DJ / 2) / sg) + qfunc((t + DJ / 2) / sg));
                var tr = UI - t, R = rho * 0.5 * (qfunc((tr - DJ / 2) / sg) + qfunc((tr + DJ / 2) / sg));
                return Math.max(1e-18, L + R);
            };
            clear(svg);
            var pl = new Plot(svg, { W: 640, H: 270, x: [0, UI], y: [1e-16, 1], ylog: true });
            pl.axes(c, [0, UI / 4, UI / 2, 3 * UI / 4, UI], [1e-15, 1e-12, 1e-9, 1e-6, 1e-3, 1], 'Sampling position (ps)', 'BER',
                function (v) { return fmt(v, 1); }, function (v) { return v === 1 ? '1' : '10' + sup(Math.round(Math.log10(v))); });
            var pts = []; for (var i = 0; i <= 400; i++) { var t = UI * i / 400; pts.push([t, ber(t)]); }
            pl.path(pts, { stroke: c.accent, 'stroke-width': 2.5 });
            var tb = +target.get();
            // Q for target: solve rho*Q(x) = tb  (bisection)
            var lo = 0, hi = 20; for (var k = 0; k < 60; k++) { var m = (lo + hi) / 2; if (rho * 0.5 * qfunc(m) > tb) lo = m; else hi = m; }
            var Q = lo, TJ = DJ + 2 * Q * sg, open = UI - TJ;
            s('line', { x1: pl.sx(0), x2: pl.sx(UI), y1: pl.sy(tb), y2: pl.sy(tb), stroke: c.signal, 'stroke-dasharray': '4 4' }, svg);
            if (open > 0) {
                s('line', { x1: pl.sx(TJ / 2), x2: pl.sx(UI - TJ / 2), y1: pl.sy(tb), y2: pl.sy(tb), stroke: c.signal, 'stroke-width': 4 }, svg);
            }
            readout(ui.readout, [['UI', fmt(UI, 2) + ' ps'], ['Q (this model)', fmt(Q, 2)], ['Total jitter TJ', fmt(TJ, 2) + ' ps'],
                ['Eye opening', open > 0 ? fmt(open, 2) + ' ps (' + fmt(open / UI * 100, 0) + '% UI)' : 'closed', open / UI > 0.3 ? 'good' : 'bad']]);
        }
        renders.push(draw); draw();
    };

    // =====================================================================
    // Y-factor noise figure (post-silicon)
    // =====================================================================
    W.yfactor = function (host) {
        var ui = shell(host, 'Interactive: Y-factor noise-figure measurement', 'F = ENR / (Y − 1), with T_cold = 290 K');
        var svg = svgStage(ui.stage, 'Noise power with the source off and on');
        var enr = slider(ui.controls, { label: 'Noise source ENR', min: 5, max: 16, step: 0.1, value: 15, fmt: function (v) { return fmt(v, 1) + ' dB'; }, onInput: draw });
        var y = slider(ui.controls, { label: 'Measured Y (hot / cold power)', min: 0.3, max: 15, step: 0.05, value: 12.5, fmt: function (v) { return fmt(v, 2) + ' dB'; }, onInput: draw });
        function draw() {
            var c = colors(), E = lin10(enr.get()), Y = lin10(y.get());
            var F = E / (Y - 1), NF = db10(F);
            clear(svg); svg.setAttribute('viewBox', '0 0 640 140');
            var cold = 1, hot = Y, scale = 440 / Math.max(hot, 2);
            [['Source off (cold)', cold, c.muted, 30], ['Source on (hot)', hot, c.accent, 78]].forEach(function (b) {
                s('text', { x: 150, y: b[3] + 17, 'text-anchor': 'end', 'font-size': 13, fill: c.ink, text: b[0] }, svg);
                s('rect', { x: 160, y: b[3], width: Math.max(2, b[1] * scale), height: 26, rx: 3, fill: b[2] }, svg);
            });
            s('text', { x: 160, y: 18, 'font-size': 12, fill: c.muted, text: 'Output noise power (linear). Y = hot / cold.' }, svg);
            var bad = Y < 1.6;
            readout(ui.readout, [['Noise factor F', isFinite(F) && F > 0 ? fmt(F, 3) : '—'], ['NF', isFinite(NF) ? fmt(NF, 2) + ' dB' : '—', bad ? 'bad' : 'good'],
                ['Confidence', bad ? 'low: Y too close to 1, so small power errors swing NF a lot. Use a higher ENR source.' : 'good: Y well above 1']]);
        }
        renders.push(draw); draw();
    };

    // ---------- mount ----------
    function mount() {
        document.querySelectorAll('.widget[data-widget]').forEach(function (host) {
            var fn = W[host.dataset.widget];
            if (!fn) return;
            try { fn(host); } catch (e) { host.innerHTML = '<p class="widget-fallback">This interactive figure could not load.</p>'; if (window.console) console.error(e); }
        });
        var rerender = function () { renders.forEach(function (r) { try { r(); } catch (e) {} }); };
        new MutationObserver(rerender).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.addEventListener) mq.addEventListener('change', rerender);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
