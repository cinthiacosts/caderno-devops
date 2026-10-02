/* Caderno DevOps · navegação entre páginas (HTML + CSS + JS no navegador) */
(function () {
  "use strict";

  var book = document.getElementById("book");
  var stage = document.getElementById("stage");
  var source = document.getElementById("source");
  var btnPrev = document.getElementById("prev");
  var btnNext = document.getElementById("next");
  var btnToc = document.getElementById("toc");
  var indicator = document.getElementById("indicator");

  var pages = Array.prototype.slice.call(source.querySelectorAll(".page"));
  var N = pages.length; // número par de páginas (capa ... contracapa)
  var TOC_PAGE = 2;
  var FLIP_MS = 900;

  var mq = window.matchMedia("(max-width: 760px)");
  var single = mq.matches;
  var leaves = [];
  var turned = 0; // quantas folhas já foram viradas
  var prevTurned = 0;
  var stepTimer = null;

  function maxTurned() {
    return single ? N - 1 : N / 2;
  }

  function makeFace(pageIndex, side, extraClass) {
    var face = document.createElement("div");
    face.className = "face " + side + (extraClass ? " " + extraClass : "");
    if (pageIndex !== null) {
      var page = pages[pageIndex].cloneNode(true);
      var isCover = page.classList.contains("cover");
      if (!isCover) {
        var num = document.createElement("span");
        num.className = "num";
        num.textContent = pageIndex;
        page.appendChild(num);
      }
      face.appendChild(page);
      bindNotes(page);
    } else {
      var blank = document.createElement("article");
      blank.className = "page";
      face.appendChild(blank);
    }
    return face;
  }

  // Anotações: o texto fica salvo no navegador (localStorage)
  var NOTES_KEY = "caderno-devops:anotacoes";

  function bindNotes(page) {
    var area = page.querySelector(".notes-area");
    if (!area) return;
    try {
      area.value = window.localStorage.getItem(NOTES_KEY) || "";
    } catch (err) { /* sem armazenamento: segue sem salvar */ }
    area.addEventListener("input", function () {
      try {
        window.localStorage.setItem(NOTES_KEY, area.value);
      } catch (err) { /* ignora */ }
    });
  }

  function build() {
    book.innerHTML = "";
    book.classList.toggle("single", single);
    leaves = [];

    var count = single ? N : N / 2;
    for (var k = 0; k < count; k++) {
      var leaf = document.createElement("div");
      leaf.className = "leaf";
      if (single) {
        leaf.appendChild(makeFace(k, "right", "front"));
        leaf.appendChild(makeFace(null, "right", "back"));
      } else {
        leaf.appendChild(makeFace(2 * k, "right", "front"));
        leaf.appendChild(makeFace(2 * k + 1, "left", "back"));
      }
      book.appendChild(leaf);
      leaves.push(leaf);
    }

    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "zone prev";
    prev.tabIndex = -1;
    prev.setAttribute("aria-label", "Voltar a página");
    prev.addEventListener("click", function () { turn(-1); });

    var next = document.createElement("button");
    next.type = "button";
    next.className = "zone next";
    next.tabIndex = -1;
    next.setAttribute("aria-label", "Virar a página");
    next.addEventListener("click", function () { turn(1); });

    book.appendChild(prev);
    book.appendChild(next);

    bindTocButtons();
    render(false);
  }

  function bindTocButtons() {
    var buttons = book.querySelectorAll("[data-goto]");
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener("click", function () {
        goTo(parseInt(b.getAttribute("data-goto"), 10));
      });
    });
  }

  function render(animate) {
    var total = leaves.length;
    leaves.forEach(function (leaf, k) {
      var flipped = k < turned;
      var changed = (k < prevTurned) !== flipped;
      leaf.classList.toggle("flipped", flipped);
      var finalZ = flipped ? k + 1 : total - k;

      if (animate && changed) {
        leaf.style.zIndex = total + 5; // folha em movimento fica por cima
        window.setTimeout(function () { leaf.style.zIndex = finalZ; }, FLIP_MS / 2);
      } else {
        leaf.style.zIndex = finalZ;
      }
    });
    prevTurned = turned;

    book.classList.toggle("at-start", turned === 0);
    book.classList.toggle("at-end", turned === maxTurned());
    btnPrev.disabled = turned === 0;
    btnNext.disabled = turned === maxTurned();
    updateIndicator();
  }

  function updateIndicator() {
    var text;
    if (single) {
      text = turned === 0 ? "Capa" : turned === N - 1 ? "Contracapa" : "Página " + turned + " de " + (N - 2);
    } else if (turned === 0) {
      text = "Capa";
    } else if (turned === N / 2) {
      text = "Contracapa";
    } else {
      text = "Páginas " + (2 * turned - 1) + " e " + 2 * turned;
    }
    indicator.textContent = text;
  }

  function turn(delta) {
    stopSteps();
    var target = Math.max(0, Math.min(maxTurned(), turned + delta));
    if (target === turned) return;
    turned = target;
    render(true);
  }

  function stopSteps() {
    if (stepTimer) {
      window.clearInterval(stepTimer);
      stepTimer = null;
    }
  }

  // Vai até uma página virando as folhas uma a uma
  function goTo(pageIndex) {
    var target = single ? pageIndex : Math.ceil(pageIndex / 2);
    target = Math.max(0, Math.min(maxTurned(), target));
    stopSteps();
    if (target === turned) return;
    var dir = target > turned ? 1 : -1;
    stepTimer = window.setInterval(function () {
      turned += dir;
      render(true);
      if (turned === target) stopSteps();
    }, 220);
  }

  /* ---------- Eventos ---------- */

  btnPrev.addEventListener("click", function () { turn(-1); });
  btnNext.addEventListener("click", function () { turn(1); });
  btnToc.addEventListener("click", function () { goTo(TOC_PAGE); });

  document.addEventListener("keydown", function (e) {
    if (e.target && /^(INPUT|TEXTAREA|SUMMARY)$/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight") { turn(1); }
    else if (e.key === "ArrowLeft") { turn(-1); }
    else if (e.key === "Home") { goTo(0); }
    else if (e.key === "End") { goTo(N - 1); }
  });

  // Deslizar o dedo no celular
  var startX = null;
  stage.addEventListener("touchstart", function (e) {
    if (e.target.closest && e.target.closest("textarea")) { startX = null; return; }
    startX = e.changedTouches[0].clientX;
  }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) turn(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Troca entre duas páginas (computador) e uma página (celular)
  mq.addEventListener("change", function (e) {
    stopSteps();
    var current = single ? turned : 2 * turned;
    single = e.matches;
    turned = single ? Math.min(current, N - 1) : Math.ceil(current / 2);
    prevTurned = turned;
    build();
  });

  build();
})();
