/* TechNext — NVIDIA-style interactions
   - Hero with story-strip transition (tabs + green progress fill)
   - Horizontal spotlight carousel: green top-right arrows + scroll progress bar
   - Sticky-header shadow on scroll
   - IntersectionObserver scroll reveal
   - Mobile drawer
*/
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky header shadow ---------- */
  var header = document.querySelector(".header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Hero (story strip) ---------- */
  var hero = document.querySelector("[data-hero]");
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero__slide"));
    var tabs = Array.prototype.slice.call(hero.querySelectorAll(".hero__tab"));
    var bgs = Array.prototype.slice.call(hero.querySelectorAll(".hero__bg"));
    var i = 0, timer = null, INTERVAL = 6000;

    function render() {
      slides.forEach(function (s, idx) { s.classList.toggle("active", idx === i); });
      bgs.forEach(function (b, idx) { b.classList.toggle("active", idx === i); }); // swap category image
      if (bgs.length) { var a = bgs[i]; if (a) { a.style.transform = "none"; void a.offsetWidth; a.style.transform = ""; } }
      tabs.forEach(function (t, idx) {
        t.classList.remove("active");
        // restart the progress-fill animation on the active tab
        var sp = t.querySelector(".bar span");
        if (sp) { sp.style.animation = "none"; void sp.offsetWidth; sp.style.animation = ""; }
        if (idx === i) t.classList.add("active");
      });
    }
    function go(n) { i = (n + slides.length) % slides.length; render(); restart(); }
    function next() { go(i + 1); }
    // Always auto-advance so the hero loops continuously (not gated by reduce-motion).
    function restart() { if (timer) clearInterval(timer); timer = setInterval(next, INTERVAL); }

    tabs.forEach(function (t, idx) { t.addEventListener("click", function () { go(idx); }); });

    render();
    restart();
    hero.addEventListener("mouseenter", function () { if (timer) clearInterval(timer); });
    hero.addEventListener("mouseleave", restart);
  }

  /* ---------- Spotlight carousel ---------- */
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var track = root.querySelector(".carousel__track");
    var prev = root.querySelector(".carousel__btn--prev");
    var next = root.querySelector(".carousel__btn--next");
    var progress = root.querySelector(".carousel__progress span");
    var items = Array.prototype.slice.call(track.children);
    if (!items.length) return;
    var index = 0;

    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 24) || 24;
      return items[0].getBoundingClientRect().width + gap;
    }
    function visibleCount() {
      var vp = root.querySelector(".carousel__viewport").getBoundingClientRect().width;
      return Math.max(1, Math.round(vp / step()));
    }
    function maxIndex() { return Math.max(0, items.length - visibleCount()); }
    function update() {
      index = Math.min(index, maxIndex());
      track.style.transform = "translateX(" + (-index * step()) + "px)";
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= maxIndex();
      if (progress) {
        var vis = visibleCount();
        var w = Math.min(100, (vis / items.length) * 100);
        var maxi = maxIndex();
        var left = maxi === 0 ? 0 : (index / maxi) * (100 - w);
        progress.style.width = w + "%";
        progress.style.left = left + "%";
      }
    }
    if (prev) prev.addEventListener("click", function () { index = Math.max(0, index - 1); update(); });
    if (next) next.addEventListener("click", function () { index = Math.min(maxIndex(), index + 1); update(); });
    window.addEventListener("resize", update, { passive: true });
    // measure once now, then again after first paint & after fonts/images load
    update();
    if (window.requestAnimationFrame) requestAnimationFrame(update);
    window.addEventListener("load", update);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  });

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Contact form (demo — no external send) ---------- */
  var cform = document.querySelector("[data-contact-form]");
  if (cform) {
    cform.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = cform.querySelector("[data-form-note]");
      cform.querySelectorAll("input, textarea, button").forEach(function (el) { el.disabled = true; });
      if (note) { note.hidden = false; note.textContent = "Thanks — this is a demo form, so nothing was sent. Email us at hello@technext.asia and we'll reply within one business day."; }
    });
  }

  /* ---------- Quote cart (service page — add-to-quote = quotation request) ---------- */
  var quoteFab = document.querySelector("[data-quote-fab]");
  if (quoteFab) {
    var KEY = "tn_quote";
    var panel = document.querySelector("[data-quote-panel]");
    var listEl = panel.querySelector("[data-quote-list]");
    var noteEl = panel.querySelector("[data-quote-note]");
    var qform = panel.querySelector("[data-quote-form]");
    var countEls = document.querySelectorAll("[data-quote-count]");
    var items = Array.prototype.slice.call(document.querySelectorAll(".svc-item"));

    var loadCart = function () { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
    var saveCart = function (a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} };
    var cart = loadCart();

    function renderCount() {
      countEls.forEach(function (el) { el.textContent = cart.length; el.hidden = cart.length === 0; });
    }
    function renderButtons() {
      items.forEach(function (it) {
        var id = it.getAttribute("data-id");
        var btn = it.querySelector("[data-add]");
        var inCart = cart.some(function (c) { return c.id === id; });
        btn.classList.toggle("is-added", inCart);
        btn.textContent = inCart ? "Added ✓" : "Add to Quote";
      });
    }
    function renderList() {
      listEl.innerHTML = "";
      if (!cart.length) {
        var li = document.createElement("li");
        li.className = "quote-empty";
        li.textContent = "No services added yet. Browse the list and add the ones you'd like quoted.";
        listEl.appendChild(li);
        return;
      }
      cart.forEach(function (c) {
        var li = document.createElement("li");
        li.className = "quote-line";
        var info = document.createElement("div");
        info.innerHTML = '<div class="qn"></div><div class="qc"></div>';
        info.querySelector(".qn").textContent = c.name;
        info.querySelector(".qc").textContent = c.cat;
        var rm = document.createElement("button");
        rm.type = "button"; rm.className = "quote-remove"; rm.setAttribute("aria-label", "Remove " + c.name);
        rm.textContent = "×";
        rm.addEventListener("click", function () { cart = cart.filter(function (x) { return x.id !== c.id; }); saveCart(cart); refresh(); });
        li.appendChild(info); li.appendChild(rm);
        listEl.appendChild(li);
      });
    }
    function refresh() { renderCount(); renderButtons(); renderList(); }

    items.forEach(function (it) {
      var btn = it.querySelector("[data-add]");
      btn.addEventListener("click", function () {
        var id = it.getAttribute("data-id");
        if (cart.some(function (c) { return c.id === id; })) {
          cart = cart.filter(function (x) { return x.id !== id; });
        } else {
          cart.push({ id: id, name: it.getAttribute("data-name"), cat: it.getAttribute("data-cat") });
        }
        saveCart(cart); refresh();
      });
    });

    var openQ = function () { panel.classList.add("open"); document.body.style.overflow = "hidden"; };
    var closeQ = function () { panel.classList.remove("open"); document.body.style.overflow = ""; };
    document.querySelectorAll("[data-quote-open]").forEach(function (el) { el.addEventListener("click", openQ); });
    document.querySelectorAll("[data-quote-close]").forEach(function (el) { el.addEventListener("click", closeQ); });
    panel.addEventListener("click", function (e) { if (e.target === panel) closeQ(); });

    qform.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!cart.length) { if (noteEl) { noteEl.hidden = false; noteEl.textContent = "Add at least one service before requesting a quotation."; } return; }
      var n = cart.length;
      qform.querySelectorAll("input, textarea, button").forEach(function (el) { el.disabled = true; });
      if (noteEl) { noteEl.hidden = false; noteEl.textContent = "Thanks — your quotation request for " + n + " service(s) has been noted. This is a demo, so nothing was sent; email hello@technext.asia and we'll send a formal quote within one business day."; }
      cart = []; saveCart(cart); renderCount(); renderButtons();
    });

    refresh();
  }

  /* ---------- Mobile drawer ---------- */
  var drawer = document.querySelector("[data-drawer]");
  var openBtn = document.querySelector("[data-drawer-open]");
  var closeEls = document.querySelectorAll("[data-drawer-close]");
  if (drawer && openBtn) {
    openBtn.addEventListener("click", function () { drawer.classList.add("open"); document.body.style.overflow = "hidden"; });
    closeEls.forEach(function (el) {
      el.addEventListener("click", function () { drawer.classList.remove("open"); document.body.style.overflow = ""; });
    });
    drawer.addEventListener("click", function (e) {
      if (e.target === drawer) { drawer.classList.remove("open"); document.body.style.overflow = ""; }
    });
  }
})();
