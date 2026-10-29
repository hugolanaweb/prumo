/* Prumo — interações da landing page (JS puro, sem dependências) */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* PendingSlot: só aparece em desenvolvimento */
  if (['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname)) root.classList.add('is-dev');

  /* Cada parte roda isolada: se uma falhar, as outras continuam funcionando */
  const run = (name, fn) => {
    try { fn(); } catch (err) { console.error(`[Prumo] Falha em "${name}":`, err); }
  };

  /* ---------- Header e menu ---------- */
  run('Menu', () => {
    const header = $('[data-header]');
    const navList = $('[data-nav-list]');
    const navToggle = $('[data-nav-toggle]');
    const navToggleLabel = $('[data-nav-toggle-label]');

    const setMenu = (open) => {
      navList.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggleLabel.textContent = open ? 'Fechar' : 'Menu';
    };
    navToggle.addEventListener('click', () => setMenu(!navList.classList.contains('is-open')));
    navList.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navList.classList.contains('is-open')) {
        setMenu(false);
        navToggle.focus();
      }
    });
    document.addEventListener('click', (e) => { if (!header.contains(e.target)) setMenu(false); });

    /* Link ativo conforme a seção na tela */
    const navLinks = $$('a[href^="#"]', navList);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.hash === `#${entry.target.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => { const s = $(a.hash); if (s) spy.observe(s); });
  });

  /* ---------- Fio de prumo, progresso e marcadores de nível ---------- */
  run('Fio de prumo', () => {
    const header = $('[data-header]');
    const plumbLine = $('[data-plumb-line]');
    const progressBar = $('[data-progress]');
    const levels = $$('[data-level]');
    let ticking = false;

    const onScroll = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      plumbLine.style.setProperty('--plumb', `${Math.round(p * (innerHeight - 24))}px`);
      progressBar.style.setProperty('--progress', p.toFixed(4));
      header.classList.toggle('is-scrolled', scrollY > 40);
      const line = innerHeight * 0.6;
      levels.forEach((el) => el.classList.toggle('is-reached', el.getBoundingClientRect().top < line));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();
  });

  /* ---------- Cotas: desenham uma vez ao entrar na tela ---------- */
  run('Cotas', () => {
    const dimObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-drawn');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    $$('.dim-wrap').forEach((el) => dimObserver.observe(el));
  });

  /* ---------- Hero: a rolagem avança a câmera até a casa ----------
     O vídeo virou uma sequência de quadros (assets/frames/d e /m, 12 fps).
     O quadro mostrado no canvas acompanha o progresso da rolagem dentro do hero. */
  run('Hero', () => {
    const hero = $('[data-hero]');
    const canvas = $('[data-hero-canvas]', hero);
    if (!hero || !canvas || reduceMotion.matches) return;

    const ctx = canvas.getContext('2d');
    const COUNT = 61;
    const PARALLEL = 4;
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    let frames = [];
    let setKey = '';
    let shown = -1;
    let progress = 0;
    let queued = false;

    const target = () => Math.round(progress * (COUNT - 1));

    const nearestLoaded = (i) => {
      for (let d = 0; d < COUNT; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      shown = -1;
    };

    const draw = () => {
      const i = nearestLoaded(target());
      if (i < 0 || i === shown) return;
      const img = frames[i];
      const cw = canvas.width, ch = canvas.height;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - w) * 0.5, (ch - h) * 0.45, w, h); // mesmo enquadramento do pôster
      shown = i;
      canvas.classList.add('is-ready');
    };

    const load = () => {
      const key = mobileQuery.matches ? 'm' : 'd';
      if (key === setKey) return;
      setKey = key;
      frames = new Array(COUNT).fill(null);
      shown = -1;
      let next = 0;
      const pull = () => {
        if (key !== setKey || next >= COUNT) return;
        const idx = next++;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (key !== setKey) return;
          frames[idx] = img;
          if (Math.abs(idx - target()) <= 1 || shown < 0) draw();
          pull();
        };
        img.onerror = pull;
        img.src = `assets/frames/${key}/${String(idx + 1).padStart(3, '0')}.webp`;
      };
      for (let k = 0; k < PARALLEL; k++) pull();
    };

    const update = () => {
      queued = false;
      const rect = hero.getBoundingClientRect();
      const travel = hero.offsetHeight - window.innerHeight;
      progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      hero.style.setProperty('--hero-p', progress.toFixed(4));
      hero.classList.toggle('is-past-text', progress > 0.4);
      draw();
    };

    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', () => { size(); load(); update(); });

    size();
    update();
    // Quadros só depois do carregamento da página, para não competir com o pôster (LCP)
    if (document.readyState === 'complete') load();
    else window.addEventListener('load', load, { once: true });
  });

  /* ---------- "Entre em contato" ----------
     Preencha o número (só dígitos, com DDI e DDD) quando ele existir.
     Sem número, o botão leva ao formulário de agendamento. */
  run('Entre em contato', () => {
    const WHATSAPP_NUMBER = '';
    const MESSAGE = 'Olá! Vim pelo site da Prumo e quero conversar sobre a construção da minha casa.';
    if (!WHATSAPP_NUMBER) return;
    $$('[data-whatsapp]').forEach((a) => {
      a.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(a.dataset.whatsappMessage || MESSAGE)}`;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  });

  /* ---------- SqueezeCarousel (Projetos) ----------
     Uma faixa que desliza: o painel aberto, três colunas que encolhem e uma
     cauda de ripas. Avançar acrescenta um cartão no fim e desliza a faixa;
     depois que o movimento termina, a faixa é aparada de volta, sem animação. */
  run('Projetos', () => {
    const root = $('[data-squeeze]');
    const slides = window.PROJETOS_DEMO;
    if (!root || !slides?.length) return;

    const strip = $('[data-squeeze-strip]', root);
    const panelsEl = $('[data-squeeze-panels]', root);
    const count = slides.length;
    const wrap = (i) => ((i % count) + count) % count;
    const slats = Math.min(3, Math.max(1, count - 4));
    const visible = 4 + slats;
    const SHARES = [-0.06, 0.61, 0.3, 0.15];
    const STRETCHED = [0, 0.71, 0.4, 0.25];
    const SQUEEZED = [-0.12, 0.59, 0.28, 0.13];
    const ms = reduceMotion.matches ? 0 : 1000;

    root.style.setProperty('--sq-slats', slats);
    root.style.setProperty('--sq-ms', `${ms}ms`);

    let cards = [];
    let column = 0;   // coluna do primeiro cartão da faixa
    let slid = 0;     // deslocamento da faixa, em ripas
    let hover = -1;
    let timer = 0;

    const shareOf = (col) => {
      if (hover < 0 || hover > 3 || reduceMotion.matches) return SHARES[col];
      return hover === col ? STRETCHED[col] : SQUEEZED[col];
    };
    const widthOf = (col) => {
      if (col < 0 || col > 3) return 'var(--sq-slat)';
      if (col === 0) return `calc(var(--sq-hero) + var(--sq-room) * ${shareOf(0)})`;
      return `calc(var(--sq-room) * ${shareOf(col)})`;
    };

    const openIndex = () => cards[-column]?.slide ?? 0;

    const layout = (instant = false) => {
      cards.forEach((card, place) => {
        const col = place + column;
        const w = widthOf(col);
        const el = card.el;
        if (instant) el.style.transition = 'none';
        el.style.width = w;
        el.style.marginLeft = place === 0 ? '0px' : col < 4 ? 'var(--sq-gap)' : 'var(--sq-slat-gap)';
        el.style.borderRadius = `min(var(--sq-radius), calc(${w} / 2))`;
        const front = col === 0;
        el.classList.toggle('is-open', front);
        el.setAttribute('aria-selected', String(front));
        el.tabIndex = front ? 0 : -1;
      });
      if (instant) strip.style.transition = 'none';
      strip.style.transform = `translateX(calc(${slid} * (var(--sq-slat) + var(--sq-gap))))`;
      if (instant) {
        void strip.offsetWidth; // aplica sem animar antes de devolver as transições
        strip.style.transition = '';
        cards.forEach((c) => { c.el.style.transition = ''; });
      }
      const open = openIndex();
      panels.forEach((p, i) => {
        const shown = i === open;
        p.classList.toggle('is-shown', shown);
        p.setAttribute('aria-hidden', String(!shown));
      });
    };

    const makeCard = (slide) => {
      const s = slides[slide];
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'squeeze__card';
      el.setAttribute('role', 'tab');
      el.setAttribute('aria-controls', 'squeeze-panel');
      el.setAttribute('aria-label', `${s.nome}, ${s.situacao}`);
      el.innerHTML = `
        <img src="${s.image}" alt="" loading="lazy" decoding="async" draggable="false">
        <span class="squeeze__overlay" aria-hidden="true">
          <span><span class="squeeze__name">${s.nome}</span><span class="squeeze__status">${s.situacao}</span></span>
          <span class="badge badge--on-dark">Imagem ilustrativa</span>
        </span>`;
      const card = { slide, el };
      el.addEventListener('mousemove', () => {
        const col = cards.indexOf(card) + column;
        const next = col >= 0 && col <= 3 ? col : -1;
        if (next !== hover) { hover = next; layout(); }
      });
      el.addEventListener('click', () => {
        const col = cards.indexOf(card) + column;
        if (col > 0) step(col);
      });
      return card;
    };

    const settle = () => {
      const keep = cards.slice(-column, -column + visible);
      cards.forEach((c) => { if (!keep.includes(c)) c.el.remove(); });
      cards = keep;
      column = 0;
      slid = 0;
      layout(true);
    };

    const step = (by) => {
      if (count < 2 || by === 0) return;
      clearTimeout(timer);
      const hadFocus = strip.contains(document.activeElement);
      if (by > 0) {
        for (let k = 0; k < by; k++) {
          const card = makeCard(wrap(cards[cards.length - 1].slide + 1));
          cards.push(card);
          strip.append(card.el);
        }
        layout(true);          // o cartão novo entra fora da tela, já com largura de ripa
        column -= by;
        slid -= by;
        layout();
      } else {
        const n = -by;
        for (let k = 0; k < n; k++) {
          const card = makeCard(wrap(cards[0].slide - 1));
          cards.unshift(card);
          strip.prepend(card.el);
        }
        column -= n;           // os novos entram como ripas escondidas à esquerda
        slid -= n;
        layout(true);
        column += n;
        slid += n;
        layout();
      }
      if (hadFocus) cards[-column]?.el.focus({ preventScroll: true });
      timer = setTimeout(settle, ms + 30);
    };

    const go = (to) => {
      const here = openIndex();
      if (to === here) return;
      const fwd = wrap(to - here);
      step(fwd <= count / 2 ? fwd : fwd - count);
    };

    // Textos abaixo da faixa, um por projeto, que trocam com fade
    const panels = slides.map((s) => {
      const p = document.createElement('div');
      p.className = 'squeeze__panel';
      p.innerHTML = `
        <p class="squeeze__copy"><strong>${s.nome}.</strong> ${s.titulo} <span>${s.descricao}</span></p>
        <dl class="squeeze__meta">
          <div><dt>Área</dt><dd>${s.area}</dd></div>
          <div><dt>Cidade</dt><dd>${s.cidade}</dd></div>
          <div><dt>Etapa</dt><dd>${s.situacao}</dd></div>
          <div><dt>Arquitetura</dt><dd>${s.arquitetura}</dd></div>
        </dl>`;
      panelsEl.append(p);
      return p;
    });

    for (let p = 0; p < visible; p++) {
      const card = makeCard(wrap(p));
      cards.push(card);
      strip.append(card.el);
    }
    layout(true);

    $('[data-squeeze-prev]').addEventListener('click', () => step(-1));
    $('[data-squeeze-next]').addEventListener('click', () => step(1));
    root.addEventListener('mouseleave', () => { if (hover !== -1) { hover = -1; layout(); } });
    strip.addEventListener('keydown', (e) => {
      const by = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!by) return;
      e.preventDefault();
      step(by);
    });

    // Arrastar com o dedo
    let startX = null;
    strip.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') startX = e.clientX; });
    strip.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    });
    strip.addEventListener('pointercancel', () => { startX = null; });

    root.squeezeGo = go;
  });

  /* ---------- Etapas: a rolagem conduz ----------
     Desktop: a seção fica presa e cada trecho da rolagem abre uma etapa.
     Telas menores ou movimento reduzido: lista que aparece ao entrar na tela. */
  run('Etapas', () => {
    const section = $('[data-process]');
    if (!section) return;
    const track = $('.process__track', section);
    const steps = $$('[data-step]', section);
    const railBtns = $$('[data-rail-go]', section);
    const meter = $$('[data-meter] span', section);
    const N = steps.length;
    const desktop = window.matchMedia('(min-width: 1100px)');
    const pinned = () => desktop.matches && !reduceMotion.matches;
    let active = -1;
    let queued = false;

    const setActive = (i) => {
      if (i === active) return;
      active = i;
      steps.forEach((s, k) => {
        s.classList.toggle('is-active', k === i);
        s.classList.toggle('is-before', k < i);
      });
      railBtns.forEach((b, k) => {
        b.classList.toggle('is-active', k === i);
        b.classList.toggle('is-done', k < i);
        if (k === i) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
    };

    const update = () => {
      queued = false;
      if (!pinned()) return;
      const travel = track.offsetHeight - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / travel)) : 0;
      const x = p * N;
      section.style.setProperty('--process-p', p.toFixed(4));
      setActive(Math.min(N - 1, Math.floor(x)));
      meter.forEach((m, k) => m.style.setProperty('--f', Math.min(1, Math.max(0, x - k)).toFixed(3)));
    };

    railBtns.forEach((b, i) => b.addEventListener('click', () => {
      const travel = track.offsetHeight - window.innerHeight;
      const top = track.getBoundingClientRect().top + window.scrollY + travel * ((i + 0.5) / N);
      window.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }));

    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    setActive(0);
    update();

    // Lista: cada etapa aparece ao entrar na tela
    const seen = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-seen'); seen.unobserve(e.target); } });
    }, { threshold: 0.25 });
    steps.forEach((s) => seen.observe(s));
  });

  /* ---------- SitePanelDemo ---------- */
  run('Painel da obra', () => {
    const data = window.PAINEL_DEMO;
    const panel = $('[data-panel]');
    if (!data || !panel) return;

    const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: n % 1 ? 2 : 0 });
    const avg = Math.round(data.etapas.reduce((s, e) => s + e.pct, 0) / data.etapas.length);
    const status = (pct) => pct >= 100 ? ['done', 'Concluída'] : pct > 0 ? ['doing', 'Em andamento'] : ['todo', 'A iniciar'];

    const tabs = $$('[data-tab]', panel);
    const panels = Object.fromEntries($$('[data-tabpanel]', panel).map((p) => [p.dataset.tabpanel, p]));
    const finTab = tabs.find((t) => t.dataset.tab === 'financeiro');
    const contractBtns = $$('[data-contract]');
    let contract = 'fechado';
    let current = 'resumo';
    let seen = false;

    $('[data-panel-title]', panel).textContent = data.obra;
    $('[data-panel-date]', panel).textContent = data.diario;

    const render = {
      resumo() {
        const money = contract === 'fechado'
          ? `<div class="tile"><p class="tile__label">Parcelas</p><p class="tile__value">${data.fechado.parcelasPagas} de ${data.fechado.parcelasTotal} pagas</p><p class="tile__sub">${data.fechado.proximaParcela}</p></div>`
          : `<div class="tile"><p class="tile__label">Custo realizado</p><p class="tile__value">${brl(data.administracao.realizado)}</p><p class="tile__sub">de ${brl(data.administracao.previsto)} previstos no orçamento de referência</p></div>`;
        return `
          <div class="summary">
            <div class="tile">
              <p class="tile__label">Avanço geral</p>
              <p class="tile__big">${avg}%</p>
              <div class="bar"><span style="--w:${avg}%"></span></div>
              <p class="tile__sub">Semana ${data.semana} de ${data.semanas} do cronograma</p>
            </div>
            <div class="summary__stack">
              <div class="tile"><p class="tile__label">Etapa atual</p><p class="tile__value">${data.etapaAtual}</p></div>
              ${money}
            </div>
            <div class="tile tile--span">
              <p class="tile__label">Próxima semana</p>
              <ul class="next-list">${data.proximaSemana.map((t) => `<li>${t}</li>`).join('')}</ul>
            </div>
          </div>`;
      },
      etapas() {
        return `<ul class="phase-list">${data.etapas.map((e, i) => {
          const [cls, label] = status(e.pct);
          return `<li class="phase">
            <span class="phase__name">${e.nome}</span>
            <span class="status status--${cls}">${label}</span>
            <span class="phase__pct">${e.pct}%</span>
            <div class="bar ${cls === 'done' ? 'bar--done' : ''}" role="presentation"><span style="--w:${Math.max(e.pct, 0)}%;--d:${i * 60}ms"></span></div>
          </li>`;
        }).join('')}</ul>`;
      },
      fotos() {
        return `<div class="photos">${data.fotos.map((f) => `
          <figure class="photo">
            <div class="photo__img"><img src="${f.src}" alt="${f.alt}" loading="lazy" decoding="async" width="640" height="480"><span class="badge badge--on-dark">Imagem ilustrativa</span></div>
            <figcaption><time>${f.data}</time>${f.legenda}</figcaption>
          </figure>`).join('')}</div>`;
      },
      financeiro() {
        const a = data.administracao;
        return `
          <div class="fin-stats">
            <div class="tile"><p class="tile__label">Orçamento de referência</p><p class="tile__value">${brl(a.previsto)}</p></div>
            <div class="tile"><p class="tile__label">Realizado</p><p class="tile__value">${brl(a.realizado)}</p></div>
            <div class="tile"><p class="tile__label">Taxa de administração (${Math.round(a.taxa * 100)}%)</p><p class="tile__value">${brl(a.realizado * a.taxa)}</p></div>
          </div>
          <div class="table-scroll">
            <table class="data-table">
              <caption>Últimas compras — notas no nome do cliente</caption>
              <thead><tr><th scope="col">Data</th><th scope="col">Item</th><th scope="col">Nota</th><th scope="col" class="num">Valor</th></tr></thead>
              <tbody>${a.compras.map((c) => `<tr><td>${c.data}</td><td>${c.item}</td><td>${c.nf}</td><td class="num">${brl(c.valor)}</td></tr>`).join('')}</tbody>
            </table>
          </div>`;
      },
    };

    const renderTable = () => {
      const rows = data.etapas.map((e) => `<tr><th scope="row">${e.nome}</th><td>${status(e.pct)[1]}</td><td class="num">${e.pct}%</td></tr>`).join('');
      $('[data-panel-table]', panel).innerHTML = `
        <div class="table-scroll"><table class="data-table">
          <caption>${data.obra} — avanço por etapa (dados fictícios). Avanço geral: ${avg}%. Semana ${data.semana} de ${data.semanas}.</caption>
          <thead><tr><th scope="col">Etapa</th><th scope="col">Situação</th><th scope="col" class="num">Avanço</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`;
    };

    const animate = (el) => {
      el.classList.remove('is-animated');
      if (!seen) return;
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-animated')));
    };

    const show = (name, focus = false) => {
      current = name;
      tabs.forEach((t) => {
        const on = t.dataset.tab === name;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      Object.entries(panels).forEach(([key, el]) => {
        el.hidden = key !== name;
        if (key === name) { el.innerHTML = render[key](); animate(el); }
      });
    };

    tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.tab)));
    $('[role="tablist"]', panel).addEventListener('keydown', (e) => {
      const visible = tabs.filter((t) => !t.hidden);
      const i = visible.findIndex((t) => t.dataset.tab === current);
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: visible.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      show(visible[(next + visible.length) % visible.length].dataset.tab, true);
    });

    const setContract = (value, focus = false) => {
      contract = value;
      contractBtns.forEach((b) => {
        const on = b.dataset.contract === value;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      finTab.hidden = value !== 'administracao';
      show(current === 'financeiro' && finTab.hidden ? 'resumo' : current);
    };
    contractBtns.forEach((b) => b.addEventListener('click', () => setContract(b.dataset.contract)));
    $('[data-contract-toggle]').addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      setContract(contract === 'fechado' ? 'administracao' : 'fechado', true);
    });

    renderTable();
    setContract('fechado');

    new IntersectionObserver(([entry], obs) => {
      if (!entry.isIntersecting) return;
      seen = true;
      animate(panels[current]);
      obs.disconnect();
    }, { threshold: 0.35 }).observe(panel);
  });

  /* ---------- SunShadeDiagram ---------- */
  run('Diagrama do beiral', () => {
    const svg = $('[data-sun]');
    const range = $('[data-sun-range]');
    if (!svg || !range) return;
    const desc = $('[data-sun-desc]');
    const disc = $('[data-sun-disc]', svg);
    const ray = $('[data-sun-ray]', svg);
    const shadow = $('[data-sun-shadow]', svg);
    const patch = $('[data-sun-patch]', svg);
    const arc = $('.sun__arc', svg);

    // Geometria do corte (unidades do viewBox)
    const TIP = { x: 210, y: 160 };   // ponta do beiral
    const WALL = 300;                 // face externa da fachada
    const GLASS = { top: 200, bottom: 370, x: 310 };
    const GROUND = 380;
    const R = 118;                    // distância do sol à ponta do beiral
    const ALT_SUMMER = 82, ALT_WINTER = 48; // ilustrativo
    const rad = (d) => (d * Math.PI) / 180;

    const pt = (alt) => ({ x: TIP.x - R * Math.cos(rad(alt)), y: TIP.y - R * Math.sin(rad(alt)) });
    const a0 = pt(ALT_SUMMER), a1 = pt(ALT_WINTER);
    arc.setAttribute('d', `M${a0.x.toFixed(1)} ${a0.y.toFixed(1)} A${R} ${R} 0 0 0 ${a1.x.toFixed(1)} ${a1.y.toFixed(1)}`);

    const update = () => {
      const t = Number(range.value) / 100;
      const alt = ALT_SUMMER + (ALT_WINTER - ALT_SUMMER) * t;
      const tan = Math.tan(rad(alt));
      const sun = pt(alt);
      disc.setAttribute('transform', `translate(${sun.x.toFixed(1)} ${sun.y.toFixed(1)})`);

      const hitY = TIP.y + (WALL - TIP.x) * tan; // onde o raio rente ao beiral toca a fachada
      let end, shade;
      if (hitY >= GROUND) {
        const gx = TIP.x + (GROUND - TIP.y) / tan;
        end = { x: gx, y: GROUND };
        shade = `${TIP.x},${TIP.y} ${WALL},${TIP.y} ${WALL},${GROUND} ${gx.toFixed(1)},${GROUND}`;
        patch.setAttribute('points', '0,0');
      } else {
        const floorTop = GLASS.x + (GROUND - Math.max(hitY, GLASS.top)) / tan;
        const floorBottom = GLASS.x + (GROUND - GLASS.bottom) / tan;
        end = { x: floorTop, y: GROUND };
        shade = `${TIP.x},${TIP.y} ${WALL},${TIP.y} ${WALL},${hitY.toFixed(1)}`;
        patch.setAttribute('points', hitY < GLASS.bottom
          ? `${GLASS.x},${Math.max(hitY, GLASS.top).toFixed(1)} ${GLASS.x},${GLASS.bottom} ${floorBottom.toFixed(1)},${GROUND} ${floorTop.toFixed(1)},${GROUND}`
          : '0,0');
      }
      shadow.setAttribute('points', shade);
      ray.setAttribute('x1', sun.x.toFixed(1));
      ray.setAttribute('y1', sun.y.toFixed(1));
      ray.setAttribute('x2', end.x.toFixed(1));
      ray.setAttribute('y2', end.y.toFixed(1));

      const shaded = Math.round(Math.min(1, Math.max(0, (hitY - GLASS.top) / (GLASS.bottom - GLASS.top))) * 100);
      const season = t < 0.34 ? 'Verão' : t > 0.66 ? 'Inverno' : 'Meia-estação';
      const text = shaded >= 100
        ? 'o sol alto não alcança a janela: o beiral sombreia o vidro inteiro e o calor fica do lado de fora.'
        : `o sol mais baixo passa por baixo do beiral: ${shaded}% da janela fica na sombra e o resto aquece o piso da sala.`;
      desc.textContent = `${season}: ${text}`;
      range.setAttribute('aria-valuetext', `${season}, ${shaded}% da janela na sombra`);
    };

    const narrow = window.matchMedia('(max-width: 599px)');
    const frame = () => svg.setAttribute('viewBox', narrow.matches ? '100 0 540 420' : '0 0 640 440');
    narrow.addEventListener('change', frame);
    frame();
    range.addEventListener('input', update);
    update();
  });

  /* ---------- MultiStepForm ---------- */
  run('Formulário', () => {
    const form = $('[data-form]');
    if (!form) return;
    const steps = $$('[data-form-step]', form);
    const stepLabel = $('[data-form-step-label]', form);
    const progress = $('[data-form-progress]', form);
    const progressbar = $('[role="progressbar"]', form);
    const live = $('[data-form-live]', form);
    const success = $('[data-form-success]', form);
    let step = 1;

    const whats = $('#f-whats', form);
    whats.addEventListener('input', () => {
      let d = whats.value.replace(/\D/g, '').slice(0, 11);
      if (d.length > 6) d = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      else if (d.length > 2) d = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      whats.value = d;
    });

    const rules = {
      1: [
        ['#f-nome', (v) => v.trim().length >= 2, 'Informe seu nome.', '#e-nome'],
        ['#f-whats', (v) => /^\d{10,11}$/.test(v.replace(/\D/g, '')), 'Informe um WhatsApp com DDD.', '#e-whats'],
        ['#f-email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), 'Informe um e-mail válido.', '#e-email'],
      ],
      2: [
        ['#f-local', (v) => v.trim().length >= 2, 'Informe a cidade e o condomínio.', '#e-local'],
        ['#f-projeto', (v) => v !== '', 'Escolha a situação do projeto.', '#e-projeto'],
        ['#f-quando', (v) => v !== '', 'Escolha quando quer começar.', '#e-quando'],
        ['#f-link', (v, el) => v === '' || el.checkValidity(), 'Use um link completo, começando com https://', '#e-link'],
        ['#f-lgpd', (v, el) => el.checked, 'Para continuar, autorize o contato.', '#e-lgpd'],
      ],
    };

    const validate = (n) => {
      let firstInvalid = null;
      rules[n].forEach(([sel, test, msg, errSel]) => {
        const el = $(sel, form);
        const err = $(errSel, form);
        const ok = test(el.value, el);
        el.setAttribute('aria-invalid', String(!ok));
        if (ok) { err.textContent = ''; el.removeAttribute('aria-describedby'); }
        else {
          err.textContent = msg;
          el.setAttribute('aria-describedby', err.id);
          firstInvalid ??= el;
        }
      });
      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    };

    const goTo = (n) => {
      step = n;
      steps.forEach((s) => { s.hidden = Number(s.dataset.formStep) !== n; });
      stepLabel.textContent = `Passo ${n} de 2`;
      progress.style.width = `${n * 50}%`;
      progressbar.setAttribute('aria-valuenow', String(n));
      live.textContent = n === 1 ? 'Passo 1 de 2: seus dados.' : 'Passo 2 de 2: seu lote e seu projeto.';
      $('input, select', steps[n - 1]).focus();
    };

    $('[data-form-next]', form).addEventListener('click', () => { if (validate(1)) goTo(2); });
    $('[data-form-back]', form).addEventListener('click', () => goTo(1));
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && step === 1 && e.target.matches('input')) {
        e.preventDefault();
        if (validate(1)) goTo(2);
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (step === 1) { if (validate(1)) goTo(2); return; }
      const bot = $('[name="empresa"]', form).value !== '';
      if (!bot && !validate(2)) return;
      // Demonstração: aqui entraria o envio (Route Handler + Zod + Resend + Turnstile)
      steps.forEach((s) => { s.hidden = true; });
      stepLabel.textContent = 'Concluído';
      progress.style.width = '100%';
      success.hidden = false;
      live.textContent = $('p', success).textContent;
      success.focus();
    });
  });

  /* ---------- MobileCtaBar: some com o teclado aberto e perto do formulário ---------- */
  run('Barra do celular', () => {
    const bar = $('[data-mobile-bar]');
    if (!bar) return;
    // Some no hero (que já tem os próprios botões), perto do formulário,
    // no rodapé e enquanto o teclado está aberto.
    const hidden = new Set(['hero']);
    const sync = () => bar.classList.toggle('is-hidden', hidden.size > 0);
    const watch = (sel, key, threshold = 0) => {
      const el = $(sel);
      if (!el) return;
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) hidden.add(key); else hidden.delete(key);
        sync();
      }, { threshold, rootMargin: key === 'hero' ? '0px 0px -35% 0px' : '0px' }).observe(el);
    };
    watch('[data-hero]', 'hero');
    watch('#agendar', 'form', 0.15);
    watch('.site-footer', 'footer');
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('input, select, textarea')) hidden.add('typing'); else hidden.delete('typing');
      sync();
    });
    document.addEventListener('focusout', () => { hidden.delete('typing'); requestAnimationFrame(sync); });
    sync();
  });
})();
