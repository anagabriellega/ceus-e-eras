// Busca de lugares: todos os municípios do Brasil (lista local) + cidades do mundo (geocodificação da Open-Meteo).
(function () {
  "use strict";
  const M = window.MUNICIPIOS;
  const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const UFS = M.uf.map(u => u.toLowerCase());
  const LISTA = M.m.map(r => ({
    nome: `${r[0]} (${M.uf[r[1]]})`, chave: norm(r[0]), uf: UFS[r[1]],
    lat: r[2], lon: r[3], tz: M.tz[r[4]], capital: !!r[5]
  }));

  function buscarLocal(q, max) {
    q = norm(q.trim());
    if (!q) return [];
    let nomeQ = q, ufQ = null;
    const m = q.match(/^(.*?)[\s,\/()-]+([a-z]{2})\)?$/); // "uniao pi", "uniao/pi", "uniao (pi)"
    if (m && UFS.includes(m[2])) { nomeQ = m[1].trim(); ufQ = m[2]; }
    const res = [];
    for (const c of LISTA) {
      if (ufQ && c.uf !== ufQ) continue;
      const i = c.chave.indexOf(nomeQ);
      if (i < 0) continue;
      res.push([(c.chave === nomeQ ? 0 : i === 0 ? 1 : 2) - (c.capital ? 0.5 : 0), c]);
    }
    return res.sort((a, b) => a[0] - b[0] || a[1].chave.length - b[1].chave.length).slice(0, max || 8).map(x => x[1]);
  }

  async function buscarMundo(q) {
    const u = "https://geocoding-api.open-meteo.com/v1/search?count=8&language=pt&format=json&name=" + encodeURIComponent(q.trim());
    const j = await (await fetch(u)).json();
    return (j.results || []).filter(r => r.country_code !== "BR").map(r => ({
      nome: r.name + (r.admin1 && r.admin1 !== r.name ? ", " + r.admin1 : "") + (r.country ? " — " + r.country : ""),
      lat: +r.latitude.toFixed(4), lon: +r.longitude.toFixed(4), tz: r.timezone || "UTC"
    }));
  }

  function distanciaKm(lat1, lon1, lat2, lon2) {
    const R = Math.PI / 180;
    const a = Math.sin((lat2 - lat1) * R / 2) ** 2 + Math.cos(lat1 * R) * Math.cos(lat2 * R) * Math.sin((lon2 - lon1) * R / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(a));
  }
  function maisProximo(lat, lon) {
    let best = null, bd = Infinity;
    for (const c of LISTA) {
      const d = distanciaKm(lat, lon, c.lat, c.lon);
      if (d < bd) { bd = d; best = c; }
    }
    return { cidade: best, km: bd };
  }
  const porNome = nome => LISTA.find(c => c.nome === nome) || buscarLocal(nome, 1)[0] || null;
  const lugar = c => ({ nome: c.nome, lat: c.lat, lon: c.lon, tz: c.tz });

  function minhaLocalizacao() {
    return new Promise((ok, erro) => {
      if (!navigator.geolocation) return erro(new Error("Seu navegador não permite pegar a localização."));
      navigator.geolocation.getCurrentPosition(pos => {
        const lat = +pos.coords.latitude.toFixed(4), lon = +pos.coords.longitude.toFixed(4);
        const { cidade, km } = maisProximo(lat, lon);
        const tz = km < 80 ? cidade.tz : (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
        ok({ nome: km < 30 ? `Minha localização · ${cidade.nome}` : "Minha localização", lat, lon, tz });
      }, e => erro(new Error(e.code === 1
        ? "Você não deu permissão para usar a localização. Dá pra liberar no cadeado ao lado do endereço do site."
        : "Não consegui descobrir a localização agora.")), { enableHighAccuracy: true, timeout: 15000 });
    });
  }

  // ---------- campo de busca com lista de sugestões ----------
  function seletor(input, lista, onPick) {
    let itens = [], ativo = -1, seq = 0, t;
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

    function mostrar(locais, mundo, carregando) {
      itens = [{ geo: true, nome: "Usar minha localização exata" }].concat(locais, mundo || []);
      ativo = -1;
      let html = `<li role="option" data-i="0" class="geo">◎ Usar minha localização exata</li>`;
      if (locais.length) html += `<li class="grupo">Brasil</li>` + locais.map((c, i) => `<li role="option" data-i="${i + 1}">${esc(c.nome)}</li>`).join("");
      if (mundo && mundo.length) html += `<li class="grupo">Mundo</li>` + mundo.map((c, i) => `<li role="option" data-i="${i + 1 + locais.length}">${esc(c.nome)}</li>`).join("");
      if (carregando) html += `<li class="grupo">procurando no mundo…</li>`;
      if (!locais.length && !(mundo && mundo.length) && !carregando && input.value.trim()) html += `<li class="grupo">nada encontrado</li>`;
      lista.innerHTML = html;
      lista.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }
    function fechar() { lista.hidden = true; ativo = -1; input.setAttribute("aria-expanded", "false"); }
    function escolher(i) {
      const it = itens[i];
      if (!it) return;
      fechar();
      input.blur();
      if (it.geo) {
        input.value = "procurando você…";
        minhaLocalizacao().then(l => { input.value = l.nome; onPick(l); }, e => { input.value = input.dataset.atual || ""; alert(e.message); });
      } else {
        input.value = it.nome;
        onPick(lugar(it));
      }
    }
    function marcar(i) {
      const lis = lista.querySelectorAll("li[role=option]");
      ativo = (i + lis.length) % lis.length;
      lis.forEach((li, k) => li.classList.toggle("ativo", k === ativo));
      lis[ativo] && lis[ativo].scrollIntoView({ block: "nearest" });
    }

    input.addEventListener("focus", () => { input.select(); mostrar(buscarLocal(input.value === input.dataset.atual ? "" : input.value)); });
    input.addEventListener("input", () => {
      const q = input.value, meu = ++seq;
      const locais = buscarLocal(q);
      clearTimeout(t);
      if (q.trim().length >= 3) {
        mostrar(locais, [], true);
        t = setTimeout(() => buscarMundo(q).then(m => { if (meu === seq) mostrar(locais, m); }, () => { if (meu === seq) mostrar(locais, []); }), 350);
      } else mostrar(locais);
    });
    input.addEventListener("keydown", e => {
      if (lista.hidden) return;
      if (e.key === "ArrowDown") { e.preventDefault(); marcar(ativo + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); marcar(ativo - 1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const lis = lista.querySelectorAll("li[role=option]");
        const alvo = ativo >= 0 ? lis[ativo] : lis[1] || lis[0];
        if (alvo) escolher(+alvo.dataset.i);
      } else if (e.key === "Escape") { fechar(); input.value = input.dataset.atual || ""; input.blur(); }
    });
    lista.addEventListener("mousedown", e => {
      const li = e.target.closest("li[role=option]");
      if (li) { e.preventDefault(); escolher(+li.dataset.i); }
    });
    input.addEventListener("blur", () => setTimeout(() => {
      if (document.activeElement !== input) { fechar(); if (input.value !== "procurando você…") input.value = input.dataset.atual || ""; }
    }, 150));
    return {
      definir(l) { input.value = input.dataset.atual = l.nome; },
      usarLocalizacao() { itens = [{ geo: true }]; escolher(0); }
    };
  }

  window.Lugares = { buscarLocal, buscarMundo, maisProximo, porNome, lugar, minhaLocalizacao, seletor };
})();
