// O céu de qualquer data e lugar: calcula as posições com a Astronomy Engine e desenha
// - "Vista do chão": como alguém em pé naquele lugar vê o céu (arrastar para girar, rolar/pinçar para zoom)
// - "Céu inteiro": mapa da cúpula toda (zênite no centro, horizonte na borda)
(function () {
  "use strict";
  const A = window.Astronomy, D = window.SKY_DATA, R = Math.PI / 180;

  const CONST_PT = {
    And: "Andrômeda", Ant: "Máquina Pneumática", Aps: "Ave do Paraíso", Aqr: "Aquário", Aql: "Águia", Ara: "Altar",
    Ari: "Áries", Aur: "Cocheiro", Boo: "Boieiro", Cae: "Cinzel", Cam: "Girafa", Cnc: "Câncer", CVn: "Cães de Caça",
    CMa: "Cão Maior", CMi: "Cão Menor", Cap: "Capricórnio", Car: "Quilha", Cas: "Cassiopeia", Cen: "Centauro",
    Cep: "Cefeu", Cet: "Baleia", Cha: "Camaleão", Cir: "Compasso", Col: "Pomba", Com: "Cabeleira de Berenice",
    CrA: "Coroa Austral", CrB: "Coroa Boreal", Crv: "Corvo", Crt: "Taça", Cru: "Cruzeiro do Sul", Cyg: "Cisne",
    Del: "Delfim", Dor: "Dourado", Dra: "Dragão", Equ: "Cavalo Menor", Eri: "Erídano", For: "Fornalha", Gem: "Gêmeos",
    Gru: "Grou", Her: "Hércules", Hor: "Relógio", Hya: "Hidra", Hyi: "Hidra Macho", Ind: "Índio", Lac: "Lagarto",
    Leo: "Leão", LMi: "Leão Menor", Lep: "Lebre", Lib: "Libra", Lup: "Lobo", Lyn: "Lince", Lyr: "Lira", Men: "Mesa",
    Mic: "Microscópio", Mon: "Unicórnio", Mus: "Mosca", Nor: "Esquadro", Oct: "Oitante", Oph: "Ofiúco", Ori: "Órion",
    Pav: "Pavão", Peg: "Pégaso", Per: "Perseu", Phe: "Fênix", Pic: "Pintor", Psc: "Peixes", PsA: "Peixe Austral",
    Pup: "Popa", Pyx: "Bússola", Ret: "Retículo", Sge: "Flecha", Sgr: "Sagitário", Sco: "Escorpião", Scl: "Escultor",
    Sct: "Escudo", Ser: "Serpente", Sex: "Sextante", Tau: "Touro", Tel: "Telescópio", Tri: "Triângulo",
    TrA: "Triângulo Austral", Tuc: "Tucano", UMa: "Ursa Maior", UMi: "Ursa Menor", Vel: "Vela", Vir: "Virgem",
    Vol: "Peixe Voador", Vul: "Raposa"
  };
  const PLANETAS = [
    ["Mercury", "Mercúrio", "#d8cbb4", 2.6],
    ["Venus", "Vênus", "#fff3cf", 4.2],
    ["Mars", "Marte", "#ff8f63", 3.2],
    ["Jupiter", "Júpiter", "#f4dcae", 4],
    ["Saturn", "Saturno", "#eedb9c", 3.4]
  ];
  // chuvas de meteoros: [mês, dia do pico, nome]
  const CHUVAS = [[1, 3, "Quadrântidas"], [4, 22, "Líridas"], [5, 6, "Eta Aquáridas"], [7, 30, "Delta Aquáridas"],
    [8, 12, "Perseidas"], [10, 21, "Oriônidas"], [11, 17, "Leônidas"], [12, 14, "Gemínidas"]];
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const DIRECOES = ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"];
  const CARDEAIS = [["Norte", 0], ["NE", 45], ["Leste", 90], ["SE", 135], ["Sul", 180], ["SO", 225], ["Oeste", 270], ["NO", 315]];

  // ---------- datas e fusos horários ----------
  const pad = n => String(n).padStart(2, "0");
  function utcFromParts(y, mo, d, h, mi, s) {
    const dt = new Date(0);
    dt.setUTCFullYear(y, mo - 1, d); // setUTCFullYear não confunde anos 0–99 com 1900–1999
    dt.setUTCHours(h, mi, s || 0, 0);
    return dt.getTime();
  }
  const fmtCache = {};
  function partsIn(ms, tz) {
    const f = fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", era: "short",
      year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric"
    }));
    const p = {};
    f.formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; });
    let y = +p.year;
    if (/^B/.test(p.era)) y = 1 - y;
    return { y, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second };
  }
  function offsetMs(ms, tz) {
    const p = partsIn(ms, tz);
    return utcFromParts(p.y, p.mo, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
  }
  // hora "de parede" num fuso -> instante UTC (respeita horários de verão antigos etc.)
  function localToUtc(y, mo, d, h, mi, tz) {
    const guess = utcFromParts(y, mo, d, h, mi);
    const first = guess - offsetMs(guess, tz);
    return guess - offsetMs(first, tz);
  }
  function horaLocal(date, tz) {
    const p = partsIn(date.getTime(), tz);
    return pad(p.h) + ":" + pad(p.mi);
  }
  function dataExtenso(d) {
    const [y, m, dd] = d.split("-").map(Number);
    return dd + " de " + MESES[m - 1] + " de " + y;
  }
  const isoData = (y, mo, d) => `${String(y).padStart(4, "0")}-${pad(mo)}-${pad(d)}`;

  // ---------- vetores ----------
  function vec(raDeg, decDeg) {
    const a = raDeg * R, d = decDeg * R, c = Math.cos(d);
    return [c * Math.cos(a), c * Math.sin(a), Math.sin(d)];
  }
  const NS = D.stars.length / 4;
  const SV = new Float64Array(NS * 3);
  for (let i = 0; i < NS; i++) SV.set(vec(D.stars[i * 4], D.stars[i * 4 + 1]), i * 3);
  const NAMED = D.named.map(([ra, dec, mag, nome]) => ({ v: vec(ra, dec), mag, nome }));
  const LINES = D.lines.map(([id, ls]) => ({ id, ls: ls.map(l => l.map(([a, d]) => vec(a, d))) }));
  const LABELS = D.labels.map(([id, ra, dec]) => ({ id, nome: CONST_PT[id] || id, v: vec(ra, dec) }));
  const ALNILAM = NAMED.find(s => s.nome === "Alnilam");

  // Via Láctea: modelo simples de brilho em coordenadas galácticas (faixa mais larga e clara no centro,
  // Grande Fenda escura e o Saco de Carvão ao lado do Cruzeiro do Sul), amostrado em pontos da esfera.
  const GAL = [[-0.0548755604, -0.8734370902, -0.4838350155], [0.4941094279, -0.44482963, 0.7469822445], [-0.867666149, -0.1980763734, 0.4559837762]];
  function brilhoVia(v) {
    const g = GAL.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
    const b = Math.asin(g[2]) / R, l = Math.atan2(g[1], g[0]) / R;
    const largura = 6 + 7 * Math.exp(-((l / 30) ** 2));
    let I = Math.exp(-((b / largura) ** 2));
    I *= 0.3 + 0.7 * Math.exp(-((l / 55) ** 2)) + 0.25 * Math.exp(-(((l - 80) / 22) ** 2)) + 0.3 * Math.exp(-(((l + 75) / 18) ** 2));
    I *= 1 - 0.55 * Math.exp(-(((b - 1.5) / 2.4) ** 2)) * Math.exp(-(((l - 30) / 32) ** 2));
    I *= 1 - 0.6 * Math.exp(-((l + 59) ** 2 + (b + 0.5) ** 2) / 6.25);
    return I;
  }
  const VIA = [];
  (function () {
    const N = 18000, ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const z = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - z * z), th = ga * i;
      const v = [r * Math.cos(th), r * Math.sin(th), z];
      const I = brilhoVia(v);
      if (I > 0.06) VIA.push(v[0], v[1], v[2], I);
    }
  })();
  const SPRITE = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(215,222,255,1)");
    gr.addColorStop(0.45, "rgba(200,210,255,0.4)");
    gr.addColorStop(1, "rgba(200,210,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return c;
  })();

  // morros no horizonte (em graus de altura), só para a vista do chão ficar com cara de paisagem
  const morro = az => {
    const a = az * R;
    return Math.max(0.2, 1.3 + 0.9 * Math.sin(3 * a + 0.5) + 0.6 * Math.sin(7 * a + 2.1) + 0.3 * Math.sin(13 * a + 4) + 0.15 * Math.sin(29 * a + 1));
  };

  // J2000 equatorial -> horizontal (x = norte, y = oeste, z = zênite)
  const toHor = (m, x, y, z) => [
    m[0][0] * x + m[1][0] * y + m[2][0] * z,
    m[0][1] * x + m[1][1] * y + m[2][1] * z,
    m[0][2] * x + m[1][2] * y + m[2][2] * z
  ];
  const horFromAltAz = (alt, az) => [Math.cos(alt * R) * Math.cos(az * R), -Math.cos(alt * R) * Math.sin(az * R), Math.sin(alt * R)];

  function bvColor(bv) {
    if (bv < 0) return [170, 191, 255];
    if (bv < 0.3) return [202, 215, 255];
    if (bv < 0.6) return [248, 247, 255];
    if (bv < 0.9) return [255, 244, 234];
    if (bv < 1.4) return [255, 214, 170];
    return [255, 196, 120];
  }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, a) => a === undefined ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function nomeFase(p) {
    if (p < 6 || p >= 354) return "Lua nova";
    if (p < 84) return "Lua crescente";
    if (p < 96) return "Quarto crescente";
    if (p < 174) return "Crescente gibosa";
    if (p < 186) return "Lua cheia";
    if (p < 264) return "Minguante gibosa";
    if (p < 276) return "Quarto minguante";
    return "Lua minguante";
  }
  const direcao = az => DIRECOES[Math.round(az / 45) % 8];
  const altura = alt => alt < 15 ? "baixinho no horizonte" : alt < 50 ? "a meia altura" : "alto no céu";

  // ---------- cálculo da cena ----------
  const cacheDia = new Map();
  function cena(st) {
    const L = st.lugar;
    const [y, mo, d] = st.d.split("-").map(Number);
    const [h, mi] = st.t.split(":").map(Number);
    const date = new Date(localToUtc(y, mo, d, h, mi, L.tz));
    const t = A.MakeTime(date);
    const obs = new A.Observer(L.lat, L.lon, 0);
    const m = A.Rotation_EQJ_HOR(t, obs).rot;
    const corpo = body => {
      const eq = A.Equator(body, t, obs, true, true);
      const hz = A.Horizon(t, obs, eq.ra, eq.dec, "");
      return { alt: hz.altitude, az: hz.azimuth, h: horFromAltAz(hz.altitude, hz.azimuth) };
    };
    const sol = corpo(A.Body.Sun);
    const lua = corpo(A.Body.Moon);
    lua.fase = A.MoonPhase(t);
    lua.ilum = A.Illumination(A.Body.Moon, t).phase_fraction;
    const planetas = PLANETAS.map(([b, nome, cor, raio]) =>
      Object.assign(corpo(A.Body[b]), { nome, cor, raio, mag: A.Illumination(A.Body[b], t).mag }));

    const chave = [st.d, L.lat, L.lon, L.tz].join("|");
    let dia = cacheDia.get(chave);
    if (!dia) {
      dia = eventosDoDia(y, mo, d, L, obs);
      cacheDia.set(chave, dia);
      if (cacheDia.size > 60) cacheDia.delete(cacheDia.keys().next().value);
    }
    return { d: st.d, t: st.t, lugar: L, date, obs, m, sol, lua, planetas, dia };
  }

  function eventosDoDia(y, mo, d, L, obs) {
    const ini = localToUtc(y, mo, d, 0, 0, L.tz), fim = ini + 86400000;
    const t0 = A.MakeTime(new Date(ini));
    const noDia = time => !!time && time.date.getTime() >= ini && time.date.getTime() < fim;
    const rs = (body, dir) => { try { const r = A.SearchRiseSet(body, obs, dir, t0, 1); return noDia(r) ? r.date : null; } catch (e) { return null; } };
    const ev = { solNasce: rs(A.Body.Sun, +1), solPoe: rs(A.Body.Sun, -1), luaNasce: rs(A.Body.Moon, +1), luaPoe: rs(A.Body.Moon, -1), avisos: [] };
    const hora = time => horaLocal(time.date, L.tz);
    const ontem = A.MakeTime(new Date(ini - 86400000));
    const TIPO = { penumbral: "penumbral (bem sutil)", partial: "parcial", total: "total", annular: "anular" };

    try {
      const le = A.SearchLunarEclipse(ontem);
      if (noDia(le.peak)) {
        const eq = A.Equator(A.Body.Moon, le.peak, obs, true, true);
        const vis = A.Horizon(le.peak, obs, eq.ra, eq.dec, "").altitude > 0;
        ev.avisos.push(`Nesse dia teve <strong>eclipse lunar ${TIPO[le.kind] || le.kind}</strong>${le.kind === "total" ? " — a Lua fica avermelhada" : ""}, com o máximo às ${hora(le.peak)}. ${vis ? "Dava para ver daqui!" : "Mas daqui a Lua estava abaixo do horizonte."}`);
      }
    } catch (e) { /* sem eclipse */ }
    try {
      const ls = A.SearchLocalSolarEclipse(ontem, obs);
      if (noDia(ls.peak.time) && ls.peak.altitude > 0) {
        ev.avisos.push(`Nesse dia teve <strong>eclipse solar</strong> visível daqui (${ls.kind === "partial" ? "parcial" : TIPO[ls.kind] || ls.kind}), com o máximo às ${hora(ls.peak.time)}.`);
      } else {
        const gs = A.SearchGlobalSolarEclipse(ontem);
        if (noDia(gs.peak)) ev.avisos.push(`Nesse dia teve <strong>eclipse solar ${TIPO[gs.kind] || gs.kind}</strong> em outra parte do mundo (não dava para ver daqui).`);
      }
    } catch (e) { /* sem eclipse */ }

    const hoje = utcFromParts(y, mo, d, 12, 0);
    CHUVAS.forEach(([cm, cd, nome]) => {
      const dias = Math.abs(hoje - utcFromParts(y, cm, cd, 12, 0)) / 86400000;
      if (dias <= 2) ev.avisos.push(`Era época da chuva de meteoros <strong>${nome}</strong> (pico por volta de ${pad(cd)}/${pad(cm)}).`);
    });

    try {
      const s = A.Seasons(y), sul = L.lat < 0;
      [[s.mar_equinox, sul ? "o equinócio de outono" : "o equinócio de primavera", ""],
       [s.jun_solstice, sul ? "o solstício de inverno" : "o solstício de verão", sul ? ": a noite mais longa do ano" : ": o dia mais longo do ano"],
       [s.sep_equinox, sul ? "o equinócio de primavera" : "o equinócio de outono", ""],
       [s.dec_solstice, sul ? "o solstício de verão" : "o solstício de inverno", sul ? ": o dia mais longo do ano" : ": a noite mais longa do ano"]]
        .forEach(([tm, nome, extra]) => { if (noDia(tm)) ev.avisos.push(`Nesse dia foi <strong>${nome}</strong>${Math.abs(L.lat) > 8 ? extra : ""}.`); });
    } catch (e) { /* ok */ }
    return ev;
  }

  // ---------- projeções ----------
  function projetor(vista, W, H) {
    const cx = W / 2, cy = H / 2;
    if (vista.modo === "cupula") {
      const size = Math.min(W, H), Rd = size / 2 - size * 0.06;
      return {
        cupula: true, cx, cy, Rd,
        p(h) { const k = 1 / (1 + h[2]); return { x: cx + Rd * h[1] * k, y: cy - Rd * h[0] * k, s: Rd * k, z: h[2] }; }
      };
    }
    const F = (W / 2) / (2 * Math.tan(vista.fov * R / 4));
    const d = horFromAltAz(vista.alt, vista.az);
    const r = horFromAltAz(0, vista.az + 90);
    const u = [r[1] * d[2] - r[2] * d[1], r[2] * d[0] - r[0] * d[2], r[0] * d[1] - r[1] * d[0]];
    return {
      cupula: false, cx, cy, F,
      p(h) {
        const x = h[0] * r[0] + h[1] * r[1] + h[2] * r[2];
        const y = h[0] * u[0] + h[1] * u[1] + h[2] * u[2];
        const z = h[0] * d[0] + h[1] * d[1] + h[2] * d[2];
        const k = 2 / (1 + z);
        return { x: cx + F * k * x, y: cy - F * k * y, s: F * k, z };
      }
    };
  }

  // rótulos sem sobreposição: os mais importantes primeiro, os que não cabem ficam de fora
  function criarRotulos(ctx) {
    const caixas = [], fila = [];
    const bate = b => caixas.some(c => b.x < c.x + c.w && b.x + b.w > c.x && b.y < c.y + c.h && b.y + b.h > c.y);
    return {
      bloquear(x, y, r) { caixas.push({ x: x - r, y: y - r, w: 2 * r, h: 2 * r }); },
      add(txt, x, y, o) { fila.push(Object.assign({ txt, x, y }, o)); },
      desenhar() {
        fila.sort((a, b) => a.prio - b.prio);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        fila.forEach(r => {
          ctx.font = r.font;
          const w = ctx.measureText(r.txt).width, h = r.tam, o = r.off || 0;
          const tent = r.centro ? [[-w / 2, -h / 2]] : [[o, -h / 2], [-w - o, -h / 2], [-w / 2, o * 0.7], [-w / 2, -h - o * 0.7]];
          for (const [dx, dy] of tent) {
            const b = { x: r.x + dx, y: r.y + dy, w, h };
            if (!bate(b)) { caixas.push(b); ctx.fillStyle = r.cor; ctx.fillText(r.txt, b.x, b.y); return; }
          }
        });
      }
    };
  }

  // ---------- desenho ----------
  // vista: {modo, az, alt, fov}; opts: {linhas, nomes, via, dia, escala}; hits: alvos do tooltip (opcional)
  function desenhar(ctx, W, H, sc, opts, hits, vista) {
    const pr = projetor(vista, W, H);
    const cup = pr.cupula;
    const T = opts.escala || (cup ? Math.max(0.78, pr.Rd / 340) : clamp(W / 1000, 0.85, 1.2)); // tamanho dos textos
    const S = cup ? pr.Rd / 340 : clamp(W / 1000, 0.8, 1.3) * clamp(Math.sqrt(100 / vista.fov), 0.75, 2); // tamanho das estrelas
    const serif = `"Fraunces", Georgia, serif`, sans = `"DM Sans", system-ui, sans-serif`;
    const na = (p, m) => p.z > -0.9 && p.x > -m && p.x < W + m && p.y > -m && p.y < H + m; // na tela?
    const rot = criarRotulos(ctx);

    const diaF = clamp((sc.sol.alt + 12) / 12, 0, 1); // 0 = noite fechada, 1 = dia
    const claro = opts.dia ? diaF : 0;
    const tinta = opts.dia ? diaF : diaF * 0.35;
    const brilho = 1 - claro * 0.8;
    const ceu = (noite, tint, diaC) => mix(mix(noite, tint, tinta), diaC, claro);
    const topo = ceu([5, 8, 26], [18, 30, 70], [60, 112, 182]);
    const baixo = ceu([22, 30, 70], [44, 62, 118], [165, 202, 236]);

    ctx.save();
    if (cup) {
      const g = ctx.createRadialGradient(pr.cx, pr.cy, 0, pr.cx, pr.cy, pr.Rd);
      g.addColorStop(0, rgb(topo));
      g.addColorStop(1, rgb(baixo));
      ctx.beginPath();
      ctx.arc(pr.cx, pr.cy, pr.Rd, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.clip();
    } else {
      const yh = clamp(pr.p(horFromAltAz(0, vista.az)).y, 1, H * 4);
      const g = ctx.createLinearGradient(0, Math.min(0, yh - H), 0, yh);
      g.addColorStop(0, rgb(topo));
      g.addColorStop(1, rgb(baixo));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Via Láctea
    if (opts.via) {
      const luaAtrapalha = sc.lua.alt > 0 ? 1 - 0.45 * sc.lua.ilum : 1;
      const a0 = 0.13 * (1 - claro) * (1 - tinta * 0.5) * luaAtrapalha;
      if (a0 > 0.01) {
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < VIA.length; i += 4) {
          const h = toHor(sc.m, VIA[i], VIA[i + 1], VIA[i + 2]);
          if (h[2] < -0.02) continue;
          const p = pr.p(h);
          const rr = 0.046 * p.s;
          if (!na(p, rr)) continue;
          ctx.globalAlpha = Math.min(1, VIA[i + 3] * a0 * clamp(h[2] * 6 + 0.25, 0, 1));
          ctx.drawImage(SPRITE, p.x - rr, p.y - rr, rr * 2, rr * 2);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    }

    // linhas das constelações
    if (opts.linhas) {
      ctx.strokeStyle = `rgba(140,165,255,${0.4 * brilho})`;
      ctx.lineWidth = Math.max(1, 1.1 * T);
      ctx.beginPath();
      LINES.forEach(c => c.ls.forEach(l => {
        let prev = null;
        l.forEach(v => {
          const h = toHor(sc.m, v[0], v[1], v[2]);
          const p = pr.p(h);
          const ok = h[2] > -0.3 && p.z > -0.5;
          if (ok && prev && Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y) < W) { ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); }
          prev = ok ? p : null;
        });
      }));
      ctx.stroke();
    }

    // estrelas
    for (let i = 0; i < NS; i++) {
      const h = toHor(sc.m, SV[i * 3], SV[i * 3 + 1], SV[i * 3 + 2]);
      if (h[2] < -0.01) continue;
      const p = pr.p(h);
      if (!na(p, 10)) continue;
      const mag = D.stars[i * 4 + 2];
      const perto = clamp(0.35 + h[2] * 7, 0, 1); // somem um pouco perto do horizonte
      const a = clamp(0.3 + (6 - mag) * 0.17, 0.25, 1) * perto * brilho;
      const r = Math.max(0.45, 0.35 + (6.2 - mag) * 0.5) * S;
      const cor = bvColor(D.stars[i * 4 + 3]);
      if (mag < 1.5) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        glow.addColorStop(0, rgb(cor, 0.35 * a));
        glow.addColorStop(1, rgb(cor, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - r * 4, p.y - r * 4, r * 8, r * 8);
      }
      ctx.fillStyle = rgb(cor, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // nomes de constelações e estrelas (vão para a fila de rótulos)
    LABELS.forEach(l => {
      const h = toHor(sc.m, l.v[0], l.v[1], l.v[2]);
      if (h[2] < 0.07) return;
      const p = pr.p(h);
      if (!na(p, 0)) return;
      if (opts.nomes) rot.add(l.nome, p.x, p.y, { font: `italic ${Math.round(12 * T)}px ${serif}`, tam: 14 * T, cor: `rgba(185,195,255,${0.62 * brilho + 0.15})`, prio: 20, centro: true });
      if (hits) hits.push({ x: p.x, y: p.y, r: 24 * T, titulo: l.nome, sub: "constelação" });
    });
    NAMED.forEach(s => {
      const h = toHor(sc.m, s.v[0], s.v[1], s.v[2]);
      if (h[2] < 0.01) return;
      const p = pr.p(h);
      if (!na(p, 0)) return;
      if (opts.nomes && s.mag < (cup ? 1.3 : 2)) rot.add(s.nome, p.x, p.y, { font: `${Math.round(11 * T)}px ${sans}`, tam: 13 * T, off: 6 * T, cor: `rgba(255,236,200,${0.75 * brilho + 0.1})`, prio: 5 + s.mag });
      if (hits) hits.push({ x: p.x, y: p.y, r: 11 * T, titulo: s.nome, sub: "estrela · magnitude " + s.mag.toFixed(1).replace(".", ",") });
    });
    if (opts.nomes && ALNILAM) {
      const h = toHor(sc.m, ALNILAM.v[0], ALNILAM.v[1], ALNILAM.v[2]);
      const p = pr.p(h);
      if (h[2] > 0.03 && na(p, 0)) rot.add("Três Marias", p.x, p.y + 16 * T, { font: `${Math.round(11 * T)}px ${sans}`, tam: 13 * T, cor: `rgba(255,190,210,${0.8 * brilho + 0.1})`, prio: 4, centro: true });
    }

    // planetas
    sc.planetas.forEach(pl => {
      if (pl.alt < -0.5) return;
      const p = pr.p(pl.h);
      if (!na(p, 20)) return;
      const r = pl.raio * Math.max(S, 0.8);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.5);
      glow.addColorStop(0, pl.cor + "88");
      glow.addColorStop(1, pl.cor + "00");
      ctx.fillStyle = glow;
      ctx.fillRect(p.x - r * 3.5, p.y - r * 3.5, r * 7, r * 7);
      ctx.fillStyle = pl.cor;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      rot.bloquear(p.x, p.y, r + 1);
      if (opts.nomes) rot.add(pl.nome, p.x, p.y, { font: `600 ${Math.round(12 * T)}px ${sans}`, tam: 14 * T, off: r + 4 * T, cor: pl.cor, prio: 2 });
      if (hits) hits.push({ x: p.x, y: p.y, r: 13 * T, titulo: pl.nome, sub: "planeta · " + direcao(pl.az) + ", " + Math.round(pl.alt) + "° acima do horizonte" });
    });

    // Sol
    if (sc.sol.alt > -1) {
      const p = pr.p(sc.sol.h), r = 11 * Math.max(S, 0.8);
      if (na(p, 60)) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
        glow.addColorStop(0, "rgba(255,226,140,0.9)");
        glow.addColorStop(1, "rgba(255,226,140,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - r * 5, p.y - r * 5, r * 10, r * 10);
        ctx.fillStyle = "#fff4cc";
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        rot.bloquear(p.x, p.y, r + 2);
        if (opts.nomes) rot.add("Sol", p.x, p.y, { font: `600 ${Math.round(12 * T)}px ${sans}`, tam: 14 * T, off: r + 5 * T, cor: "#ffe7a8", prio: 0 });
        if (hits) hits.push({ x: p.x, y: p.y, r: 18 * T, titulo: "Sol", sub: Math.round(sc.sol.alt) + "° acima do horizonte" });
      }
    }

    // Lua (com a fase, e o lado iluminado virado para o Sol)
    if (sc.lua.alt > -1) {
      const p = pr.p(sc.lua.h), r = 9 * Math.max(S, 0.8);
      if (na(p, 40)) {
        const hl = sc.lua.h, hs = sc.sol.h;
        const dot = hl[0] * hs[0] + hl[1] * hs[1] + hl[2] * hs[2];
        const dir = [hs[0] - dot * hl[0], hs[1] - dot * hl[1], hs[2] - dot * hl[2]];
        const n = Math.hypot(dir[0], dir[1], dir[2]) || 1;
        const q = pr.p([hl[0] + 0.01 * dir[0] / n, hl[1] + 0.01 * dir[1] / n, hl[2] + 0.01 * dir[2] / n]);
        const ang = Math.atan2(q.y - p.y, q.x - p.x);
        const k = sc.lua.ilum;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        glow.addColorStop(0, `rgba(235,235,255,${0.35 * k})`);
        glow.addColorStop(1, "rgba(235,235,255,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - r * 4, p.y - r * 4, r * 8, r * 8);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(ang);
        ctx.fillStyle = "rgba(40,44,70,0.95)";
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4f1e6";
        ctx.beginPath();
        ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
        ctx.ellipse(0, 0, Math.abs(r * (1 - 2 * k)), r, 0, Math.PI / 2, -Math.PI / 2, k < 0.5);
        ctx.fill();
        ctx.restore();
        rot.bloquear(p.x, p.y, r + 1);
        if (opts.nomes) rot.add("Lua", p.x, p.y, { font: `600 ${Math.round(12 * T)}px ${sans}`, tam: 14 * T, off: r + 5 * T, cor: "#f4f1e6", prio: 1 });
        if (hits) hits.push({ x: p.x, y: p.y, r: 18 * T, titulo: nomeFase(sc.lua.fase), sub: Math.round(k * 100) + "% iluminada" });
      }
    }

    if (cup) {
      rot.desenhar();
      ctx.restore();
      // horizonte e pontos cardeais
      ctx.strokeStyle = "rgba(242,200,121,0.55)";
      ctx.lineWidth = Math.max(1, 1.5 * T);
      ctx.beginPath(); ctx.arc(pr.cx, pr.cy, pr.Rd, 0, Math.PI * 2); ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      [["N", 0], ["NE", 45], ["L", 90], ["SE", 135], ["S", 180], ["SO", 225], ["O", 270], ["NO", 315]].forEach(([txt, az]) => {
        const grande = txt.length === 1;
        const rr = pr.Rd + (grande ? 17 : 15) * T;
        ctx.font = `${grande ? 600 : 400} ${Math.round((grande ? 15 : 10.5) * T)}px ${sans}`;
        ctx.fillStyle = grande ? "rgba(242,200,121,0.95)" : "rgba(242,200,121,0.55)";
        ctx.fillText(txt, pr.cx - rr * Math.sin(az * R), pr.cy - rr * Math.cos(az * R));
      });
      return;
    }

    // ---- chão (vista do chão) ----
    const pts = [];
    if (vista.alt >= 20) {
      for (let az = 0; az <= 360; az += 1.5) pts.push(pr.p(horFromAltAz(morro(az), az)));
    } else {
      for (let a = -180; a <= 180; a += 1.5) {
        const az = vista.az + a, p = pr.p(horFromAltAz(morro(az), az));
        if (p.z > -0.75) pts.push(p);
      }
    }
    const linha = () => pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    // brilho da atmosfera logo acima do horizonte
    const yh = pr.p(horFromAltAz(0, vista.az)).y;
    if (vista.alt < 20 && yh > 0) {
      const alto = 150 * T;
      const gb = ctx.createLinearGradient(0, yh - alto, 0, yh);
      gb.addColorStop(0, "rgba(60,85,150,0)");
      gb.addColorStop(1, `rgba(70,95,160,${0.3 * (1 - claro) + 0.1})`);
      ctx.fillStyle = gb;
      ctx.fillRect(0, yh - alto, W, alto + 40 * T);
    }
    // o chão em si
    const gc = ctx.createLinearGradient(0, Math.max(0, Math.min(yh, H)), 0, H + 1);
    gc.addColorStop(0, rgb(mix([16, 26, 24], [52, 72, 52], claro)));
    gc.addColorStop(1, rgb(mix([5, 9, 8], [26, 38, 28], claro)));
    ctx.fillStyle = gc;
    ctx.beginPath();
    if (vista.alt >= 20) {
      ctx.rect(-1e5, -1e5, 2e5 + W, 2e5 + H);
      linha();
      ctx.closePath();
      ctx.fill("evenodd");
    } else if (pts.length) {
      linha();
      ctx.lineTo(pts[pts.length - 1].x, H + 1e4);
      ctx.lineTo(pts[0].x, H + 1e4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath(); linha();
    ctx.strokeStyle = "rgba(150,170,220,0.28)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    rot.desenhar();

    // direções no chão
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    CARDEAIS.forEach(([txt, az]) => {
      const p = pr.p(horFromAltAz(-1.5, az));
      if (p.z < 0.15 || !na(p, 0)) return;
      const grande = txt.length > 2;
      ctx.font = `${grande ? 600 : 400} ${Math.round((grande ? 15 : 12) * T)}px ${sans}`;
      ctx.fillStyle = grande ? "rgba(242,200,121,0.95)" : "rgba(242,200,121,0.6)";
      ctx.fillText(txt, p.x, p.y + 6 * T);
    });
    ctx.restore();
  }

  // ---------- painel de informações ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }
  const cartao = (titulo, corpo) => `<article class="cartao"><h3>${titulo}</h3>${corpo}</article>`;

  function infoHTML(sc) {
    const tz = sc.lugar.tz, ev = sc.dia, out = [];
    const sa = sc.sol.alt;
    let estado;
    if (sa > 0) estado = "<strong>Era dia.</strong> As estrelas estavam lá, só escondidas pela luz do Sol. O mapa mostra como seria sem a claridade (ligue “claridade do dia” para ver o céu azul).";
    else if (sa > -6) estado = "<strong>Crepúsculo</strong>: o céu ainda clarinho, com as primeiras estrelas aparecendo.";
    else if (sa > -18) estado = "<strong>Começo ou fim da noite</strong>: já dava para ver as estrelas mais brilhantes.";
    else estado = "<strong>Noite fechada.</strong> Céu escuro, cheio de estrelas.";
    out.push(cartao("Nesse momento", `<p>${estado}</p>`));

    const l = sc.lua;
    const luaHoras = [ev.luaNasce && "nasceu às " + horaLocal(ev.luaNasce, tz), ev.luaPoe && "se pôs às " + horaLocal(ev.luaPoe, tz)].filter(Boolean);
    out.push(cartao("Lua", `<p>${nomeFase(l.fase)}, ${Math.round(l.ilum * 100)}% iluminada${l.alt > 0
      ? ` — a ${direcao(l.az)}, ${altura(l.alt)}.`
      : ", mas abaixo do horizonte nesse horário."}</p>${luaHoras.length ? `<p class="sub">Nesse dia ela ${luaHoras.join(" e ")}.</p>` : ""}`));

    const vis = sc.planetas.filter(p => p.alt > 0);
    out.push(cartao("Planetas no céu", vis.length
      ? "<ul>" + vis.map(p => `<li><span class="bolinha" style="background:${p.cor};color:${p.cor}"></span><span><strong>${p.nome}</strong>: a ${direcao(p.az)}, ${altura(p.alt)}${p.mag < -1.5 && sa < -3 ? " — brilhando muito" : ""}</span></li>`).join("") + "</ul>"
      : "<p>Nenhum planeta brilhante acima do horizonte.</p>"));

    if (ev.solNasce || ev.solPoe) {
      out.push(cartao("Sol nesse dia", `<p>${[ev.solNasce && "Nasceu às " + horaLocal(ev.solNasce, tz), ev.solPoe && "se pôs às " + horaLocal(ev.solPoe, tz)].filter(Boolean).join(" e ")}.</p>`));
    }

    const dest = ev.avisos.slice();
    const C = window.CONFIG || {};
    if (C.dataEspecial && C.dataEspecial === sc.d && C.legendaEspecial) dest.unshift(`<strong>${esc(C.legendaEspecial)}</strong> ♡`);
    const acima = v => toHor(sc.m, v[0], v[1], v[2])[2] > 0.05;
    const crux = LABELS.find(x => x.id === "Cru");
    if (acima(crux.v)) dest.push(`O <strong>Cruzeiro do Sul</strong> estava no céu. Um dos dinossauros mais antigos do mundo, achado no Rio Grande do Sul, foi batizado em homenagem a ele: <a href="#v=dino&n=Staurikosaurus">conheça o Staurikosaurus</a>.`);
    if (ALNILAM && acima(ALNILAM.v)) dest.push("As <strong>Três Marias</strong> (o cinturão de Órion) estavam visíveis.");
    const visiveis = NAMED.filter(s => toHor(sc.m, s.v[0], s.v[1], s.v[2])[2] > 0.1).sort((a, b) => a.mag - b.mag);
    if (visiveis.length && sa < -3) dest.push(`A estrela mais brilhante no céu era <strong>${esc(visiveis[0].nome)}</strong>.`);
    if (dest.length) out.push(cartao("Destaques", dest.map(d => `<p>${d}</p>`).join("")));
    return out.join("");
  }

  // ---------- interface ----------
  const $ = id => document.getElementById(id);
  const el = {};
  const st = {
    d: "", t: "", lugar: null,
    modo: "chao", az: 180, alt: 15, fov: 110,
    linhas: true, nomes: true, via: true, dia: false
  };
  let sc = null, hits = [], onChange = () => { }, iniciado = false, seletor = null, pedido = 0, ultimoInfo = 0, tocando = false;

  function lugarPadrao() {
    const C = window.CONFIG || {};
    const c = window.Lugares.porNome(C.lugarPadrao || "União (PI)") || window.Lugares.porNome("São Paulo (SP)");
    return window.Lugares.lugar(c);
  }
  function agora(tz) {
    const p = partsIn(Date.now(), tz);
    return { d: isoData(p.y, p.mo, p.d), t: `${pad(p.h)}:${pad(p.mi)}` };
  }
  const altPadrao = () => window.innerWidth < 640 ? 25 : 15; // na tela em pé, olhar um pouco mais para cima
  const coordTxt = L => `${Math.abs(L.lat).toFixed(2).replace(".", ",")}° ${L.lat >= 0 ? "N" : "S"}, ${Math.abs(L.lon).toFixed(2).replace(".", ",")}° ${L.lon >= 0 ? "L" : "O"}`;

  function params() {
    const L = st.lugar;
    return { d: st.d, t: st.t, n: L.nome, lat: L.lat, lon: L.lon, tz: L.tz, m: st.modo, az: Math.round(st.az), alt: Math.round(st.alt) };
  }

  function dimensionar() {
    const c = el.canvas, W = Math.max(260, Math.floor(el.caixa.getBoundingClientRect().width));
    const H = st.modo === "cupula" ? W : Math.round(W < 640 ? W * 1.1 : clamp(W * 0.58, 380, 700));
    const dpr = window.devicePixelRatio || 1;
    if (c._w !== W || c._h !== H || c._dpr !== dpr) {
      c.style.width = W + "px"; c.style.height = H + "px";
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      c._w = W; c._h = H; c._dpr = dpr;
    }
    return { W, H, dpr };
  }

  function desenharTela() {
    pedido = 0;
    if (!sc) return;
    const { W, H, dpr } = dimensionar();
    const ctx = el.canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    hits = [];
    desenhar(ctx, W, H, sc, st, hits, st);
  }
  const agendar = () => { if (!pedido) pedido = requestAnimationFrame(desenharTela); };

  // recalcula posições (mudou data, hora ou lugar)
  function atualizar(rapido) {
    if (!st.d || !st.t || !st.lugar) return;
    try { sc = cena(st); } catch (e) {
      el.info.innerHTML = `<article class="cartao"><p>Não consegui calcular essa data (${esc(e.message)}).</p></article>`;
      return;
    }
    el.legenda.innerHTML = `${esc(st.lugar.nome)} · ${dataExtenso(st.d)}, ${st.t.replace(":", "h")}<span>${coordTxt(st.lugar)}</span>`;
    const agoraMs = performance.now();
    if (!rapido || agoraMs - ultimoInfo > 400) {
      ultimoInfo = agoraMs;
      el.info.innerHTML = infoHTML(sc);
      onChange(params());
    }
    if (rapido) agendar();
    else { if (pedido) cancelAnimationFrame(pedido); desenharTela(); }
  }

  function escreverForm() {
    el.data.value = st.d;
    el.hora.value = st.t;
    if (seletor) seletor.definir(st.lugar);
    el.linhas.checked = st.linhas; el.nomes.checked = st.nomes; el.via.checked = st.via; el.dia.checked = st.dia;
    document.querySelectorAll("[data-modo]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.modo === st.modo)));
    el.caixa.classList.toggle("cupula", st.modo === "cupula");
    $("ceu-nota").hidden = st.modo !== "cupula";
  }

  function moverMinutos(delta) {
    const [y, mo, d] = st.d.split("-").map(Number);
    const [h, mi] = st.t.split(":").map(Number);
    const dt = new Date(utcFromParts(y, mo, d, h, mi) + delta * 60000);
    st.d = isoData(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
    st.t = `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`;
    el.data.value = st.d;
    el.hora.value = st.t;
  }

  function parar() {
    tocando = false;
    el.play.textContent = "▶ Acelerar o tempo";
    el.play.setAttribute("aria-pressed", "false");
    atualizar();
  }
  function tocar() {
    tocando = true;
    el.play.textContent = "❚❚ Parar";
    el.play.setAttribute("aria-pressed", "true");
    let antes = performance.now();
    const passo = agoraMs => {
      if (!tocando) return;
      const minutos = Math.max(1, Math.round((agoraMs - antes) / 1000 * 60)); // ~1 hora de céu por segundo
      antes = agoraMs;
      moverMinutos(minutos);
      atualizar(true);
      requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  function tooltip(cx, cy) {
    const r = el.canvas.getBoundingClientRect();
    const x = cx - r.left, y = cy - r.top;
    let best = null, bd = Infinity;
    hits.forEach(hh => {
      const dd = Math.hypot(hh.x - x, hh.y - y);
      if (dd < hh.r && dd < bd) { bd = dd; best = hh; }
    });
    if (!best) { el.tip.hidden = true; return; }
    el.tip.innerHTML = `<strong>${esc(best.titulo)}</strong><span>${esc(best.sub)}</span>`;
    el.tip.hidden = false;
    const tw = el.tip.offsetWidth;
    el.tip.style.left = clamp(best.x - tw / 2, 4, r.width - tw - 4) + "px";
    el.tip.style.top = (best.y + 14) + "px";
  }

  function interacao() {
    const c = el.canvas, ponteiros = new Map();
    let moveu = false, pinca = null;
    const dist = () => { const [a, b] = [...ponteiros.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    const zoom = f => { st.fov = clamp(st.fov * f, 20, 150); agendar(); };

    c.addEventListener("pointerdown", e => {
      if (st.modo !== "chao" && e.pointerType === "mouse") return;
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
      moveu = false;
      if (ponteiros.size === 2) pinca = { d: dist(), fov: st.fov };
    });
    c.addEventListener("pointermove", e => {
      const p = ponteiros.get(e.pointerId);
      if (!p) { if (e.pointerType === "mouse") tooltip(e.clientX, e.clientY); return; }
      if (st.modo !== "chao") return;
      if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 4) moveu = true;
      if (ponteiros.size === 1 && moveu) {
        const gpp = st.fov / (c._w || c.getBoundingClientRect().width || 800);
        st.az = (st.az - (e.clientX - p.x) * gpp + 360) % 360;
        st.alt = clamp(st.alt + (e.clientY - p.y) * gpp, -10, 90);
      }
      p.x = e.clientX; p.y = e.clientY;
      if (ponteiros.size === 2 && pinca) { st.fov = clamp(pinca.fov * pinca.d / dist(), 20, 150); moveu = true; }
      if (moveu) { el.tip.hidden = true; el.dica.hidden = true; agendar(); }
    });
    const solta = e => {
      if (!ponteiros.has(e.pointerId)) return;
      ponteiros.delete(e.pointerId);
      if (ponteiros.size < 2) pinca = null;
      if (!moveu && e.type === "pointerup") tooltip(e.clientX, e.clientY);
      if (moveu && !ponteiros.size) onChange(params());
    };
    c.addEventListener("pointerup", solta);
    c.addEventListener("pointercancel", solta);
    c.addEventListener("click", e => { if (st.modo === "cupula") tooltip(e.clientX, e.clientY); });
    c.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") el.tip.hidden = true; });
    c.addEventListener("wheel", e => {
      if (st.modo !== "chao") return;
      e.preventDefault();
      zoom(Math.exp(e.deltaY * 0.0012));
    }, { passive: false });

    $("bussola").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.alt) st.alt = +b.dataset.alt;
      else { st.az = +b.dataset.az; st.alt = altPadrao(); }
      agendar(); onChange(params());
    });
    $("zoom").addEventListener("click", e => {
      const b = e.target.closest("button");
      if (b) zoom(b.dataset.z === "mais" ? 0.8 : 1.25);
    });
  }

  function baixarImagem() {
    if (!sc) return;
    const W = 1600, H = 2080;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#070a1c");
    bg.addColorStop(1, "#110c26");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(80, 110);
    desenhar(ctx, W - 160, W - 160, sc, Object.assign({}, st, { escala: 1.9 }), null, { modo: "cupula" });
    ctx.restore();
    const C = window.CONFIG || {};
    const L = st.lugar;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    let y = 1640;
    if (C.dataEspecial === st.d && C.legendaEspecial) {
      ctx.fillStyle = "#f4a3b8";
      ctx.font = `italic 400 40px "Fraunces", Georgia, serif`;
      ctx.fillText(C.legendaEspecial, W / 2, y);
      y += 30;
    }
    ctx.fillStyle = "#f2c879";
    ctx.font = `600 84px "Fraunces", Georgia, serif`;
    ctx.fillText(L.nome.replace(/^Minha localização · /, ""), W / 2, y + 70);
    ctx.fillStyle = "#ece8dc";
    ctx.font = `400 40px "DM Sans", system-ui, sans-serif`;
    ctx.fillText(`${dataExtenso(st.d)} · ${st.t.replace(":", "h")}`, W / 2, y + 150);
    ctx.fillStyle = "rgba(236,232,220,0.55)";
    ctx.font = `400 28px "DM Sans", system-ui, sans-serif`;
    ctx.fillText(coordTxt(L), W / 2, y + 205);
    c.toBlob(b => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `ceu-${st.d}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, "image/png");
  }

  function aplicarParams(p) {
    let mudou = false;
    const lat = parseFloat(p.get("lat")), lon = parseFloat(p.get("lon"));
    if (isFinite(lat) && isFinite(lon)) {
      const L = { nome: p.get("n") || coordTxt({ lat, lon }), lat, lon, tz: p.get("tz") || window.Lugares.maisProximo(lat, lon).cidade.tz };
      if (!st.lugar || L.lat !== st.lugar.lat || L.lon !== st.lugar.lon || L.tz !== st.lugar.tz || L.nome !== st.lugar.nome) { st.lugar = L; mudou = true; }
    }
    if (!st.lugar) { st.lugar = lugarPadrao(); mudou = true; }
    const d = p.get("d"), t = p.get("t");
    if (d && /^-?\d{4}-\d{2}-\d{2}$/.test(d) && d !== st.d) { st.d = d; mudou = true; }
    if (t && /^\d{2}:\d{2}$/.test(t) && t !== st.t) { st.t = t; mudou = true; }
    if (!st.d || !st.t) { Object.assign(st, agora(st.lugar.tz)); mudou = true; }
    const m = p.get("m");
    if (m === "chao" || m === "cupula") { if (m !== st.modo) { st.modo = m; mudou = true; } }
    if (p.get("az") !== null && isFinite(+p.get("az"))) st.az = (+p.get("az") + 360) % 360;
    if (p.get("alt") !== null && isFinite(+p.get("alt"))) st.alt = clamp(+p.get("alt"), -10, 90);
    if (!iniciado && p.get("az") === null) st.az = st.lugar.lat < 0 ? 180 : 0;
    if (!iniciado && p.get("alt") === null) st.alt = altPadrao();
    if (mudou || !iniciado) { iniciado = true; escreverForm(); atualizar(); }
    else { agendar(); onChange(params()); }
  }

  function init(cb) {
    onChange = cb || onChange;
    el.data = $("ceu-data"); el.hora = $("ceu-hora"); el.canvas = $("ceu-canvas"); el.tip = $("ceu-tip");
    el.legenda = $("ceu-legenda"); el.info = $("ceu-info"); el.caixa = $("mapa-caixa"); el.dica = $("dica-arraste");
    el.linhas = $("opt-linhas"); el.nomes = $("opt-nomes"); el.via = $("opt-via"); el.dia = $("opt-dia"); el.play = $("btn-play");

    seletor = window.Lugares.seletor($("lugar-busca"), $("lugar-lista"), l => { st.lugar = l; escreverForm(); atualizar(); });

    el.data.addEventListener("change", () => { if (el.data.value) { st.d = el.data.value; atualizar(); } });
    el.hora.addEventListener("change", () => { if (el.hora.value) { st.t = el.hora.value; atualizar(); } });
    [["linhas", el.linhas], ["nomes", el.nomes], ["via", el.via], ["dia", el.dia]].forEach(([k, inp]) =>
      inp.addEventListener("change", () => { st[k] = inp.checked; agendar(); }));
    document.querySelectorAll("[data-modo]").forEach(b => b.addEventListener("click", () => {
      st.modo = b.dataset.modo; el.tip.hidden = true; escreverForm(); agendar(); onChange(params());
    }));
    $("hora-menos").addEventListener("click", () => { moverMinutos(-60); atualizar(); });
    $("hora-mais").addEventListener("click", () => { moverMinutos(60); atualizar(); });
    $("btn-agora").addEventListener("click", () => { if (tocando) parar(); Object.assign(st, agora(st.lugar.tz)); escreverForm(); atualizar(); });
    el.play.addEventListener("click", () => tocando ? parar() : tocar());

    const C = window.CONFIG || {};
    const be = $("btn-especial");
    if (C.dataEspecial) {
      be.hidden = false;
      be.textContent = C.legendaEspecial || "Nossa data";
      be.addEventListener("click", () => {
        if (tocando) parar();
        st.d = C.dataEspecial;
        st.t = C.horaEspecial || "21:00";
        const c = C.lugarEspecial && window.Lugares.porNome(C.lugarEspecial);
        if (c) st.lugar = window.Lugares.lugar(c);
        escreverForm(); atualizar();
      });
    }

    $("btn-link").addEventListener("click", ev => {
      const url = location.href, b = ev.currentTarget;
      const ok = () => { b.textContent = "Link copiado!"; setTimeout(() => { b.textContent = "Copiar link deste céu"; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, () => prompt("Copie o link:", url));
      else prompt("Copie o link:", url);
    });
    $("btn-baixar").addEventListener("click", baixarImagem);

    interacao();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(agendar, 100); });
    if (document.fonts) document.fonts.ready.then(agendar);
  }

  window.Ceu = {
    init, aplicarParams, desenhar: agendar, _cena: cena,
    _render: (ctx, W, H, vista) => desenhar(ctx, W, H, sc, st, null, Object.assign({}, st, vista)) // para testes
  };
})();
