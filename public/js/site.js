(function () {
  // Medir la altura real del navbar, para saber cuánto espacio dejar debajo
  var header = document.querySelector('.site-header');
  if (header) {
    var setHeaderHeight = function (entries) {
      // Si viene de ResizeObserver, usar la medida que ya trae (no fuerza reflow)
      var box = entries && entries[0] && entries[0].borderBoxSize && entries[0].borderBoxSize[0];
      var h = box ? box.blockSize : header.offsetHeight;
      document.documentElement.style.setProperty('--header-h', Math.round(h) + 'px');
    };
    // ResizeObserver entrega la medida inicial sin forzar un reflow durante la carga
    if (window.ResizeObserver) {
      new ResizeObserver(setHeaderHeight).observe(header);
    } else {
      requestAnimationFrame(setHeaderHeight);
      window.addEventListener('resize', setHeaderHeight);
    }
  }

  // Igual, pero para la franja de patrocinadores (también es sticky)
  var sponsorStrip = document.querySelector('.sponsor-strip');
  if (sponsorStrip) {
    var setSponsorHeight = function (entries) {
      // Si viene de ResizeObserver, usar la medida que ya trae (no fuerza reflow)
      var box = entries && entries[0] && entries[0].borderBoxSize && entries[0].borderBoxSize[0];
      var h = box ? box.blockSize : sponsorStrip.offsetHeight;
      document.documentElement.style.setProperty('--sponsor-h', Math.round(h) + 'px');
    };
    if (window.ResizeObserver) {
      new ResizeObserver(setSponsorHeight).observe(sponsorStrip);
    } else {
      requestAnimationFrame(setSponsorHeight);
      window.addEventListener('resize', setSponsorHeight);
    }
  }

  // Menú hamburguesa : (=)
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Cuenta regresiva al evento
  var daysEl = document.getElementById('cd-days');
  var hoursEl = document.getElementById('cd-hours');
  var minEl = document.getElementById('cd-min');
  var secEl = document.getElementById('cd-sec');

  if (daysEl && hoursEl && minEl && secEl) {
    var target = new Date(2026, 10, 3, 0, 0, 0).getTime();

    var pad = function (n) {
      return n < 10 ? '0' + n : String(n);
    };

    var tick = function () {
      var diff = target - Date.now();
      if (diff <= 0) {
        daysEl.textContent = '000';
        hoursEl.textContent = '00';
        minEl.textContent = '00';
        secEl.textContent = '00';
        return;
      }

      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var minutes = Math.floor((diff % 3600000) / 60000);
      var seconds = Math.floor((diff % 60000) / 1000);

      daysEl.textContent = pad(days);
      hoursEl.textContent = pad(hours);
      minEl.textContent = pad(minutes);
      secEl.textContent = pad(seconds);
    };

    tick();
    setInterval(tick, 1000);
  }

  // Sobre el foro: recorrido fijado con scroll (se desactiva con "reducir movimiento")
  var sf = document.querySelector('.sf');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (sf && !reduceMotion.matches) {
    // Partir la frase gancho en palabras (las de .sf-k se resaltan)
    var hook = sf.querySelector('[data-sf-words]');
    var words = [];
    var splitWords = function (node, isKey) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) { return; }
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'sf-w' + (isKey ? ' is-key' : '');
            s.textContent = part;
            frag.appendChild(s);
            words.push(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          splitWords(child, isKey || child.classList.contains('sf-k'));
        }
      });
    };
    if (hook) { splitWords(hook, false); }

    sf.classList.add('is-enhanced');

    var sfTrack = sf.querySelector('.sf-track');
    var sfStage = sf.querySelector('.sf-stage');
    var sfPanels = sf.querySelectorAll('.sf-panel');
    var sfMarks = sf.querySelectorAll('.sf-ruler-marks li');
    var sfLead = sf.querySelector('.sf-lead');
    var sfAxes = sf.querySelectorAll('.sf-axis');
    var sfNums = sf.querySelectorAll('.sf-stat-num');
    var sfSkip = sf.querySelector('.sf-skip');
    var sfSteps = sfPanels.length;
    var sfCounted = false;
    var sfTicking = false;

    var countUp = function () {
      sfNums.forEach(function (el) {
        var end = parseInt(el.getAttribute('data-count'), 10);
        var start = null;
        var run = function (t) {
          if (!start) { start = t; }
          var k = Math.min((t - start) / 900, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
          if (k < 1) { requestAnimationFrame(run); }
        };
        el.textContent = '0';
        requestAnimationFrame(run);
      });
    };

    var sfUpdate = function () {
      sfTicking = false;
      var rect = sfTrack.getBoundingClientRect();
      var total = sfTrack.offsetHeight - sfStage.offsetHeight;
      var p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
      sf.style.setProperty('--sf-p', p.toFixed(4));

      var pos = p * sfSteps;
      var step = Math.min(Math.floor(pos), sfSteps - 1);
      var local = Math.min(pos - step, 1);

      sfPanels.forEach(function (el, i) {
        el.classList.toggle('is-active', i === step);
        el.classList.toggle('is-past', i < step);
      });
      sfMarks.forEach(function (el, i) { el.classList.toggle('is-on', i <= step); });
      if (sfSkip) { sfSkip.classList.toggle('is-hidden', step === sfSteps - 1); }

      // Paso 1: las palabras se encienden durante el primer 70% del paso
      var lit = step > 0 ? words.length : Math.floor((local / 0.7) * words.length) + 1;
      words.forEach(function (w, i) { w.classList.toggle('is-lit', i < lit); });
      if (sfLead) { sfLead.classList.toggle('is-lit', step > 0 || local > 0.72); }

      // Paso 4: los tres ejes se encienden uno por uno
      sfAxes.forEach(function (a, i) { a.classList.toggle('is-lit', step > 3 || (step === 3 && local > i * 0.28)); });

      // Paso 5: contadores (se repiten si se vuelve a llegar)
      if (step === sfSteps - 1 && !sfCounted) { sfCounted = true; countUp(); }
      if (step < sfSteps - 1) { sfCounted = false; }
    };

    var sfOnScroll = function () {
      if (!sfTicking) { sfTicking = true; requestAnimationFrame(sfUpdate); }
    };
    window.addEventListener('scroll', sfOnScroll, { passive: true });
    window.addEventListener('resize', sfOnScroll);
    sfUpdate();
  }

  // Programa: línea de tiempo con panel "foco" (escritorio) y filas desplegables (celular)
  var agendaLayout = document.querySelector('.agenda-layout');
  if (agendaLayout) {
    var desktopMq = window.matchMedia('(min-width: 901px)');
    var dayTabs = document.querySelectorAll('.day-tab');
    var filterBtns = document.querySelectorAll('.agenda-filter');
    var focusInner = document.getElementById('agendaFocus');
    var prevBtn = document.getElementById('agendaPrev');
    var nextBtn = document.getElementById('agendaNext');
    var countEl = document.getElementById('agendaCount');
    var emptyMsg = document.querySelector('.agenda-empty');
    var currentFilter = 'todo';

    var activeDay = function () { return document.querySelector('.agenda-day.is-active'); };
    var visibleItems = function () {
      var day = activeDay();
      return day ? Array.prototype.filter.call(day.querySelectorAll('.agenda-item'), function (it) { return !it.hidden; }) : [];
    };

    var updateNav = function () {
      var items = visibleItems();
      var sel = activeDay() ? activeDay().querySelector('.agenda-item.is-selected') : null;
      var pos = items.indexOf(sel);
      countEl.textContent = items.length ? (pos + 1) + ' / ' + items.length : '';
      prevBtn.disabled = pos <= 0;
      nextBtn.disabled = pos < 0 || pos >= items.length - 1;
    };

    // Escritorio: marca la sesión y copia su detalle al panel foco
    var selectItem = function (item) {
      document.querySelectorAll('.agenda-item.is-selected').forEach(function (it) {
        it.classList.remove('is-selected');
        it.querySelector('.agenda-row').removeAttribute('aria-current');
      });
      focusInner.innerHTML = '';
      if (item) {
        item.classList.add('is-selected');
        item.querySelector('.agenda-row').setAttribute('aria-current', 'true');
        var clone = item.querySelector('.agenda-detail').cloneNode(true);
        clone.removeAttribute('id');
        clone.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.removeAttribute('loading'); });
        focusInner.appendChild(clone);
      }
      updateNav();
    };

    var selectFirstVisible = function () {
      var items = visibleItems();
      var sel = items.filter(function (it) { return it.classList.contains('is-selected'); })[0];
      if (desktopMq.matches) { selectItem(sel || items[0] || null); }
      if (emptyMsg) { emptyMsg.hidden = items.length > 0; }
    };

    var applyFilter = function () {
      document.querySelectorAll('.agenda-item').forEach(function (it) {
        var cat = it.getAttribute('data-cat');
        var show = currentFilter === 'todo' ||
          cat === currentFilter ||
          (currentFilter === 'visita' && cat === 'logistica');
        it.hidden = !show;
      });
      selectFirstVisible();
    };

    document.querySelectorAll('.agenda-row').forEach(function (row) {
      row.addEventListener('click', function () {
        var item = row.closest('.agenda-item');
        if (desktopMq.matches) {
          selectItem(item);
        } else {
          var open = !item.classList.contains('is-open');
          item.classList.toggle('is-open', open);
          row.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
      });
    });

    dayTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        dayTabs.forEach(function (t) { t.classList.remove('is-active'); t.setAttribute('aria-pressed', 'false'); });
        tab.classList.add('is-active');
        tab.setAttribute('aria-pressed', 'true');
        document.querySelectorAll('.agenda-day').forEach(function (d) {
          d.classList.toggle('is-active', d.getAttribute('data-dayset') === tab.dataset.day);
        });
        selectFirstVisible();
      });
    });

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        currentFilter = btn.dataset.filter;
        applyFilter();
      });
    });

    var step = function (d) {
      var items = visibleItems();
      var pos = items.indexOf(activeDay().querySelector('.agenda-item.is-selected'));
      var target = items[pos + d];
      if (target) {
        selectItem(target);
        var list = document.querySelector('.agenda-list');
        var row = target.querySelector('.agenda-row');
        // Mantener visible la fila seleccionada dentro de la lista (sin mover la página)
        if (row.offsetTop < list.scrollTop || row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
          list.scrollTop = row.offsetTop - list.clientHeight / 2;
        }
      }
    };
    prevBtn.addEventListener('click', function () { step(-1); });
    nextBtn.addEventListener('click', function () { step(1); });

    var onBreakpoint = function () {
      if (desktopMq.matches) {
        selectFirstVisible();
      }
    };
    if (desktopMq.addEventListener) { desktopMq.addEventListener('change', onBreakpoint); }
    else if (desktopMq.addListener) { desktopMq.addListener(onBreakpoint); }

    selectFirstVisible();
  }

  // Abrir y cerrar el modal con la semblanza del ponente
  var ponenteModal = document.getElementById('ponenteModal');
  if (ponenteModal) {
    var modalPhoto = document.getElementById('ponenteModalPhoto');
    var modalName = document.getElementById('ponenteModalName');
    var modalMeta = document.getElementById('ponenteModalMeta');
    var modalBio = document.getElementById('ponenteModalBio');
    var modalLogo = document.getElementById('ponenteModalLogo');
    var lastTrigger = null;

    var openPonenteModal = function (btn) {
      var card = btn.closest('.agenda-detail');
      var source = card ? card.querySelector('.ponente-bio-source') : null;
      if (!source) { return; }

      var nameEl = source.querySelector('.bio-name');
      var metaEl = source.querySelector('.bio-meta');
      var photoImg = card.querySelector('.agenda-detail-photo:not(.is-logo) .agenda-detail-img');
      var logoUrl = source.getAttribute('data-logo');

      modalName.textContent = nameEl ? nameEl.textContent : '';
      modalMeta.textContent = metaEl ? metaEl.textContent : '';
      modalBio.innerHTML = '';
      source.querySelectorAll('p').forEach(function (p) {
        modalBio.appendChild(p.cloneNode(true));
      });

      if (photoImg) {
        modalPhoto.src = photoImg.src;
        modalPhoto.alt = photoImg.alt;
        modalPhoto.parentElement.hidden = false;
      } else {
        modalPhoto.removeAttribute('src');
        modalPhoto.parentElement.hidden = true;
      }

      if (logoUrl) {
        modalLogo.src = logoUrl;
        modalLogo.alt = metaEl ? metaEl.textContent : '';
        modalLogo.hidden = false;
      } else {
        modalLogo.removeAttribute('src');
        modalLogo.hidden = true;
      }

      lastTrigger = btn;
      ponenteModal.removeAttribute('inert');
      ponenteModal.classList.add('is-open');
      ponenteModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      ponenteModal.querySelector('.ponente-modal-close').focus();
    };

    var closePonenteModal = function () {
      ponenteModal.classList.remove('is-open');
      ponenteModal.setAttribute('aria-hidden', 'true');
      ponenteModal.setAttribute('inert', '');
      document.body.classList.remove('modal-open');
      if (lastTrigger) { lastTrigger.focus(); }
    };

    // Delegado: el botón también existe en la copia del panel foco
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.programa-card-bio-btn') : null;
      if (btn) { openPonenteModal(btn); }
    });

    ponenteModal.querySelectorAll('[data-modal-close]').forEach(function (el) {
      el.addEventListener('click', closePonenteModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ponenteModal.classList.contains('is-open')) {
        closePonenteModal();
      }
    });
  }

  // Ventana de videos del foro: el MP4 solo se descarga al abrirla
  var videoBtn = document.getElementById('heroVideoBtn');
  var videoModal = document.getElementById('videoModal');
  if (videoBtn && videoModal) {
    var player = document.getElementById('videoModalPlayer');
    var videoTitle = document.getElementById('videoModalTitle');
    var videoThumbs = videoModal.querySelectorAll('.video-thumb');

    var loadVideo = function (thumb, autoplay) {
      videoThumbs.forEach(function (t) { t.classList.toggle('is-active', t === thumb); });
      player.pause();
      player.querySelectorAll('track').forEach(function (t) { t.remove(); });
      player.src = thumb.dataset.src;
      if (thumb.dataset.poster) { player.poster = thumb.dataset.poster; } else { player.removeAttribute('poster'); }
      if (thumb.dataset.captions) {
        var track = document.createElement('track');
        track.kind = 'captions';
        track.srclang = 'es';
        track.label = 'Español';
        track.src = thumb.dataset.captions;
        player.appendChild(track);
      }
      videoTitle.textContent = thumb.dataset.title || '';
      player.load();
      if (autoplay) {
        var p = player.play();
        if (p && p.catch) { p.catch(function () { /* el navegador puede pedir un clic en play */ }); }
      }
    };

    var openVideoModal = function () {
      var current = videoModal.querySelector('.video-thumb.is-active') || videoThumbs[0];
      videoModal.removeAttribute('inert');
      videoModal.classList.add('is-open');
      videoModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      loadVideo(current, true);
      videoModal.querySelector('.video-modal-close').focus();
    };

    var closeVideoModal = function () {
      player.pause();
      player.removeAttribute('src');
      player.load();
      videoModal.classList.remove('is-open');
      videoModal.setAttribute('aria-hidden', 'true');
      videoModal.setAttribute('inert', '');
      document.body.classList.remove('modal-open');
      videoBtn.focus();
    };

    videoBtn.addEventListener('click', openVideoModal);

    // Cuando el hero sale de la vista, el botón se vuelve flotante (fijo abajo a la derecha)
    var heroMedia = document.querySelector('.hero-diag-media');
    if (heroMedia && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        videoBtn.classList.toggle('is-floating', e.intersectionRatio < 0.35);
      }, { threshold: [0, 0.35, 1] }).observe(heroMedia);
    }
    videoThumbs.forEach(function (t) {
      if (t.tagName === 'BUTTON') {
        t.addEventListener('click', function () { loadVideo(t, true); });
      }
    });
    videoModal.querySelectorAll('[data-video-close]').forEach(function (el) {
      el.addEventListener('click', closeVideoModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && videoModal.classList.contains('is-open')) {
        closeVideoModal();
      }
    });
  }

})();

// Animaciones del sitio: entradas al llegar a cada sección y efectos ligados al scroll.
// Se desactivan por completo si la persona pidió "reducir movimiento".
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || !('IntersectionObserver' in window)) { return; }
  var root = document.documentElement;
  root.classList.add('motion');

  // Marcar qué se anima y cómo
  var tag = function (selector, type) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (!el.hasAttribute('data-reveal')) { el.setAttribute('data-reveal', type); }
    });
  };
  tag('.seam', 'draw');
  tag('.section-header', 'head');
  tag('.agenda-toolbar', 'up');
  tag('.agenda-list', 'list');
  tag('.agenda-focus', 'up');
  tag('.section-cta', 'up');
  tag('.contact-grid > *', 'card');
  tag('.hoteles-block', 'up');
  tag('.evento-card', 'card');

  // Índices para escalonar entradas
  var index = function (selector, prop, max) {
    document.querySelectorAll(selector).forEach(function (el, i) { el.style.setProperty(prop, Math.min(i, max)); });
  };
  index('.contact-grid > *', '--i', 6);
  index('.evento-card', '--i', 6);
  document.querySelectorAll('.agenda-day').forEach(function (day) {
    day.querySelectorAll('.agenda-item').forEach(function (it, i) { it.style.setProperty('--i', Math.min(i, 12)); });
  });
  document.querySelectorAll('.hoteles-table tbody').forEach(function (tb) {
    tb.querySelectorAll('tr').forEach(function (tr, i) { tr.style.setProperty('--r', i); });
  });

  // Cada bloque se anima una sola vez, al entrar en pantalla
  // Los encabezados de sección se animan cada vez que vuelven a aparecer;
  // el resto del contenido, solo la primera vez
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var repeat = e.target.getAttribute('data-reveal') === 'head';
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        if (!repeat) { io.unobserve(e.target); }
      } else if (repeat && e.boundingClientRect.top > 0) {
        // Solo se "reinicia" cuando sale por abajo, para que vuelva a animarse al bajar de nuevo
        e.target.classList.remove('is-in');
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });

  // Efectos ligados al scroll: barra de avance, oscurecimiento del hero y escaneo de "Sobre el foro"
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var hero = document.querySelector('.hero-diag');
  var sf = document.querySelector('.sf');
  var sfStage = sf ? sf.querySelector('.sf-stage') : null;
  var ticking = false;

  var update = function () {
    ticking = false;
    var vh = window.innerHeight;
    var docH = document.documentElement.scrollHeight - vh;
    root.style.setProperty('--page-p', (docH > 0 ? Math.min(window.scrollY / docH, 1) : 0).toFixed(4));

    if (hero) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--hero-p', Math.min(Math.max(-r.top / r.height, 0), 1).toFixed(4));
    }
    if (sf && sfStage) {
      // El escaneo empieza cuando la sección ya se ve y termina cuando queda fija bajo los patrocinadores
      var top = sf.getBoundingClientRect().top;
      var stickyTop = parseFloat(getComputedStyle(sfStage).top) || 0;
      var startAt = vh * 0.8;
      var sc = Math.min(Math.max((startAt - top) / Math.max(startAt - stickyTop, 1), 0), 1);
      sf.style.setProperty('--sf-scan', sc.toFixed(4));
    }
  };
  var onScroll = function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

// Botón "Volver al inicio": aparece después del hero y sube suavemente a la portada
(function () {
  var hero = document.querySelector('.hero-diag');
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Volver al inicio');
  btn.title = 'Volver al inicio';
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"></path></svg>';
  if (document.getElementById('heroVideoBtn')) { btn.classList.add('has-video'); }
  document.body.appendChild(btn);

  var ticking = false;
  var update = function () {
    ticking = false;
    var limit = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;
    btn.classList.toggle('is-visible', window.scrollY > limit);
  };
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  btn.addEventListener('click', function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    // Llevar el foco al inicio para quien navega con teclado
    var brand = document.querySelector('.site-header a, .site-header button');
    if (brand) { brand.focus({ preventScroll: true }); }
  });
})();


// ---- Ponentes: carrusel automático ----
(function () {
  var pn = document.querySelector('.pn');
  if (!pn) { return; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var items = Array.prototype.slice.call(pn.querySelectorAll('.pn-item'));
  var n = items.length;

  // Clic en un ponente: ir a su sesión en el Programa
  pn.querySelectorAll('.pn-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var id = card.getAttribute('data-target');
      var detail = document.getElementById(id);
      if (!detail) { return; }
      var day = id.split('-')[1];
      var tab = document.querySelector('.day-tab[data-day="' + day + '"]');
      if (tab && !tab.classList.contains('is-active')) { tab.click(); }
      var all = document.querySelector('.agenda-filter[data-filter="todo"]');
      if (all && !all.classList.contains('is-active')) { all.click(); }
      var item = detail.closest('.agenda-item');
      var row = item.querySelector('.agenda-row');
      if (!item.classList.contains('is-selected') && !item.classList.contains('is-open')) { row.click(); }
      window.fismAgendaLock = Date.now() + 1200;
      item.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' });
    });
  });

  if (reduce.matches) { return; }
  pn.classList.add('is-enhanced');

  // Carrusel automático (sin fijar la sección): avanza solo, se pausa al pasar el mouse
  // o con el botón, se puede deslizar con el dedo, y da la vuelta al terminar.
  var stage = pn.querySelector('.pn-stage');
  var countNow = pn.querySelector('.pn-count-now');
  var pauseBtn = pn.querySelector('[data-pn="pause"]');
  var DWELL = 2600;          // ms que cada ponente se queda al centro
  var pos = -1.2;            // posición actual (continua)
  var target = 0;            // posición a la que se dirige
  var lastStep = performance.now();
  var visible = false, hovered = false, paused = false;

  var wrap = function (d) { d = ((d % n) + n) % n; return d > n / 2 ? d - n : d; };

  var render = function () {
    var w = stage.clientWidth;
    var cx = w / 2;
    var spacing = Math.min(300, Math.max(190, w * 0.24));
    var centerIdx = ((Math.round(pos) % n) + n) % n;
    items.forEach(function (it, i) {
      var d = wrap(i - pos);
      var ad = Math.abs(d);
      var x = cx + d * spacing;
      var sc = Math.max(0.5, 1.12 - ad * 0.26);
      var o = ad < 1.6 ? 1 : Math.max(0, 1 - (ad - 1.6) * 0.9);
      it.style.transform = 'translateX(' + x.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
      it.style.opacity = o.toFixed(3);
      it.style.zIndex = String(100 - Math.round(ad * 10));
      it.classList.toggle('is-center', i === centerIdx && ad < 0.5);
      it.querySelector('.pn-card').tabIndex = o > 0.2 ? 0 : -1;
    });
    if (countNow) { countNow.textContent = (centerIdx + 1 < 10 ? '0' : '') + (centerIdx + 1); }
  };

  var frame = function (now) {
    if (visible) {
      if (!hovered && !paused && now - lastStep > DWELL) { target = Math.round(target) + 1; lastStep = now; }
      pos += (target - pos) * 0.08;               // deslizamiento suave hacia el objetivo
      if (Math.abs(target - pos) < 0.001) { pos = target; }
      render();
    }
    requestAnimationFrame(frame);
  };

  // Con el mouse sobre la fila de ponentes, la rueda cambia al siguiente/anterior (uno por gesto)
  // y da la vuelta al llegar al final; la página no se mueve mientras el mouse esté sobre la fila
  // (también en el hueco entre dos fotos mientras se deslizan). Arriba o abajo de la fila, la rueda
  // vuelve a mover la página.
  var wheelLock = 0;
  var overRow = function (e) {
    var c = pn.querySelector('.pn-item.is-center .pn-card') || pn.querySelector('.pn-card');
    if (!c) { return false; }
    var r = c.getBoundingClientRect();
    return e.clientY >= r.top && e.clientY <= r.bottom;
  };
  stage.addEventListener('wheel', function (e) {
    if (!overRow(e)) { return; }
    e.preventDefault();
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 2) { return; }
    var now = performance.now();
    if (now < wheelLock) { return; }
    wheelLock = now + 450;
    target = Math.round(target) + (d > 0 ? 1 : -1);
    lastStep = now;
  }, { passive: false });

  // Deslizar con el dedo o arrastrar con el mouse para cambiar de ponente
  var downX = null, dragged = false;
  stage.addEventListener('pointerdown', function (e) { downX = e.clientX; dragged = false; });
  stage.addEventListener('pointerup', function (e) {
    if (downX === null) { return; }
    var dx = e.clientX - downX;
    downX = null;
    if (Math.abs(dx) > 40) {
      dragged = true;
      target = Math.round(target) + (dx < 0 ? 1 : -1);
      lastStep = performance.now();
    }
  });
  stage.addEventListener('click', function (e) {
    if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; }
  }, true);

  // Encabezado con fundido y activación solo cuando la sección está a la vista
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      visible = e.isIntersecting;
      if (visible) { lastStep = performance.now(); }
    });
  }, { threshold: 0.15 }).observe(stage);
  var headIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { pn.style.setProperty('--pn-in', e.isIntersecting ? '1' : '0'); });
  }, { threshold: 0.2 });
  headIo.observe(pn.querySelector('.pn-head'));
  pn.querySelector('.pn-head').style.transition = 'opacity .8s ease, transform .8s ease';
  pn.style.setProperty('--pn-in', '0');

  stage.addEventListener('mouseenter', function () { hovered = true; });
  stage.addEventListener('mouseleave', function () { hovered = false; lastStep = performance.now(); });
  stage.addEventListener('focusin', function () { hovered = true; });
  stage.addEventListener('focusout', function () { hovered = false; });

  pn.querySelector('[data-pn="prev"]').addEventListener('click', function () { target = Math.round(target) - 1; lastStep = performance.now(); });
  pn.querySelector('[data-pn="next"]').addEventListener('click', function () { target = Math.round(target) + 1; lastStep = performance.now(); });
  pauseBtn.addEventListener('click', function () {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pauseBtn.setAttribute('aria-label', paused ? 'Reanudar carrusel' : 'Pausar carrusel');
    pauseBtn.querySelector('.i-pause').hidden = paused;
    pauseBtn.querySelector('.i-play').hidden = !paused;
    if (!paused) { lastStep = performance.now(); }
  });

  document.addEventListener('visibilitychange', function () { if (!document.hidden) { lastStep = performance.now(); } });
  render();
  requestAnimationFrame(frame);
})();

// ---- Ventana emergente de próximos eventos CENAM ----
// Se abre sola una vez por visita (sessionStorage), 3.5 s después de cargar la página,
// solo si no hay otra ventana abierta. Muestra un evento a la vez y cambia solo cada 5 s
// (se pausa con el mouse encima o con el foco dentro). Se cierra con la X, el fondo o Escape.
(function () {
  var pop = document.getElementById('evPopup');
  if (!pop) { return; }
  var KEY = 'fismEvPopupVisto';
  var visto = false;
  try { visto = sessionStorage.getItem(KEY) === '1'; } catch (e) { }
  var drop = document.getElementById('evDrop');
  // La gotita al costado permite volver a abrir la ventana cuando ya se cerró
  var showDrop = function () {
    if (!drop) { return; }
    drop.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { drop.classList.add('is-shown'); }); });
  };

  var DWELL = 5000;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = Array.prototype.slice.call(pop.querySelectorAll('.ev-popup-item'));
  var dotsWrap = pop.querySelector('.ev-popup-dots');
  var dots = [];
  var current = 0, timer = null, paused = false, lastFocus = null;
  pop.style.setProperty('--evpop-dwell', DWELL + 'ms');

  var show = function (i) {
    if (i === current && items[i].classList.contains('is-active')) { return; }
    var prev = items[current];
    prev.classList.remove('is-active');
    prev.classList.add('is-leaving');
    prev.setAttribute('tabindex', '-1');
    setTimeout(function () { prev.classList.remove('is-leaving'); }, 650);
    current = i;
    items[i].classList.add('is-active');
    items[i].removeAttribute('tabindex');
    dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
    restartFill();
  };
  // Reinicia la animación de llenado de la píldora activa
  var restartFill = function () {
    var d = dots[current];
    if (!d) { return; }
    d.classList.add('no-fill'); void d.offsetWidth; d.classList.remove('no-fill');
  };
  var schedule = function () {
    clearTimeout(timer);
    if (items.length < 2 || paused || reduce) { return; }
    timer = setTimeout(function () { show((current + 1) % items.length); schedule(); }, DWELL);
  };

  items.forEach(function (it, i) {
    if (i === 0) { it.classList.add('is-active'); } else { it.setAttribute('tabindex', '-1'); }
    if (items.length > 1) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'ev-popup-dot' + (i === 0 ? ' is-active' : '');
      d.setAttribute('aria-label', 'Ver evento ' + (i + 1) + ' de ' + items.length);
      d.addEventListener('click', function () { show(i); schedule(); });
      dotsWrap.appendChild(d);
      dots.push(d);
    }
  });
  if (items.length > 1) { dotsWrap.removeAttribute('aria-hidden'); }

  var setPaused = function (v) { paused = v; pop.classList.toggle('is-paused', v); if (v) { clearTimeout(timer); } else { schedule(); } };
  var dialog = pop.querySelector('.ev-popup-dialog');
  dialog.addEventListener('mouseenter', function () { setPaused(true); });
  dialog.addEventListener('mouseleave', function () { setPaused(false); });

  var open = function () {
    if (document.body.classList.contains('modal-open') || pop.classList.contains('is-open')) { return; }
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { }
    lastFocus = document.activeElement;
    pop.removeAttribute('inert');
    pop.setAttribute('aria-hidden', 'false');
    pop.classList.add('is-open');
    document.body.classList.add('modal-open');
    pop.querySelector('.ev-popup-close').focus({ preventScroll: true });
    restartFill();
    schedule();
  };
  var close = function () {
    if (!pop.classList.contains('is-open')) { return; }
    clearTimeout(timer);
    pop.classList.remove('is-open');
    pop.setAttribute('aria-hidden', 'true');
    pop.setAttribute('inert', '');
    document.body.classList.remove('modal-open');
    showDrop();
    if (lastFocus && lastFocus !== drop && lastFocus.focus) { lastFocus.focus({ preventScroll: true }); }
    else if (drop) { drop.focus({ preventScroll: true }); }
  };
  if (drop) { drop.addEventListener('click', open); }

  pop.querySelectorAll('[data-evpop-close]').forEach(function (el) { el.addEventListener('click', close); });
  // Al elegir un evento (se abre en otra pestaña) también se cierra la ventana
  items.forEach(function (el) { el.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) {
    if (!pop.classList.contains('is-open')) { return; }
    if (e.key === 'Escape') { close(); }
    if (items.length > 1 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      show((current + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length);
      schedule();
    }
  });

  // Primera vez en la visita: se abre sola a los 3.5 s. Si ya se vio, solo aparece la gotita.
  var start = function () {
    if (visto) { showDrop(); return; }
    setTimeout(function () {
      open();
      if (!pop.classList.contains('is-open')) { showDrop(); }
    }, 3500);
  };
  if (document.readyState === 'complete') { start(); } else { window.addEventListener('load', start); }
})();
