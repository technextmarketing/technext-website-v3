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
    function restart() { if (timer) clearInterval(timer); if (!reduce) timer = setInterval(next, INTERVAL); }

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
