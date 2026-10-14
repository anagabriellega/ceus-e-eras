// Dicionário de dinossauros: catálogo local (Wikidata) + textos e imagens buscados na Wikipédia.
(function () {
  "use strict";

  // Fichas escritas à mão para os favoritos (o resto vem da Wikipédia).
  // ma = [início, fim] em milhões de anos atrás
  const FAV = [
    { n: "Tyrannosaurus", sig: "lagarto tirano rei", per: "Cretáceo Superior", ma: [68, 66], dieta: "Carnívoro", tam: "até ~12 m", onde: "América do Norte",
      cur: "Tinha uma das mordidas mais fortes de qualquer animal terrestre que já existiu — capaz de esmagar ossos." },
    { n: "Triceratops", sig: "cara com três chifres", per: "Cretáceo Superior", ma: [68, 66], dieta: "Herbívoro", tam: "~9 m", onde: "América do Norte",
      cur: "Conviveu com o T. rex — e existem ossos de Triceratops com marcas de mordida de tiranossauro." },
    { n: "Velociraptor", sig: "ladrão veloz", per: "Cretáceo Superior", ma: [75, 71], dieta: "Carnívoro", tam: "~2 m (do tamanho de um peru grande)", onde: "Mongólia e China",
      cur: "Tinha penas! E um fóssil achado em 1971 mostra um Velociraptor travado em luta com um Protoceratops: os dois morreram juntos." },
    { n: "Stegosaurus", sig: "lagarto com telhado", per: "Jurássico Superior", ma: [155, 145], dieta: "Herbívoro", tam: "~9 m", onde: "Estados Unidos e Portugal",
      cur: "Viveu tão antes do T. rex que o tempo entre os dois é maior do que entre o T. rex e nós." },
    { n: "Brachiosaurus", sig: "lagarto braço", per: "Jurássico Superior", ma: [154, 150], dieta: "Herbívoro", tam: "~22 m", onde: "Estados Unidos",
      cur: "As patas da frente eram mais longas que as de trás (daí o “braço” do nome). De pescoço erguido, alcançava a altura de um prédio de 4 andares." },
    { n: "Diplodocus", sig: "trave dupla", per: "Jurássico Superior", ma: [154, 152], dieta: "Herbívoro", tam: "~25 m", onde: "Estados Unidos",
      cur: "Réplicas do esqueleto, apelidado de “Dippy”, foram doadas pelo milionário Andrew Carnegie a museus do mundo todo — inclusive ao de La Plata, na Argentina." },
    { n: "Brontosaurus", sig: "lagarto trovão", per: "Jurássico Superior", ma: [155, 150], dieta: "Herbívoro", tam: "~22 m", onde: "Estados Unidos",
      cur: "Por mais de um século foi tratado como o mesmo bicho que o Apatosaurus. Em 2015 um estudo devolveu a ele o status de gênero próprio." },
    { n: "Spinosaurus", sig: "lagarto com espinhos", per: "Cretáceo Superior", ma: [99, 93], dieta: "Peixes e outras presas", tam: "~14 m", onde: "Norte da África",
      cur: "Os fósseis originais, de 1915, foram destruídos num bombardeio em Munique, em 1944. Vivia em rios e era um grande pescador." },
    { n: "Allosaurus", sig: "lagarto diferente", per: "Jurássico Superior", ma: [155, 145], dieta: "Carnívoro", tam: "~9,5 m", onde: "Estados Unidos e Portugal",
      cur: "Era o grande predador do Jurássico, uns 80 milhões de anos antes do T. rex aparecer." },
    { n: "Ankylosaurus", sig: "lagarto rígido", per: "Cretáceo Superior", ma: [68, 66], dieta: "Herbívoro", tam: "6–8 m", onde: "América do Norte",
      cur: "Era coberto por placas de osso, como uma armadura, e tinha uma clava na ponta da cauda." },
    { n: "Parasaurolophus", sig: "quase Saurolophus", per: "Cretáceo Superior", ma: [76, 73], dieta: "Herbívoro", tam: "~9,5 m", onde: "América do Norte",
      cur: "A crista oca na cabeça funcionava como um instrumento de sopro: provavelmente fazia sons graves para se comunicar." },
    { n: "Pachycephalosaurus", sig: "lagarto de cabeça grossa", per: "Cretáceo Superior", ma: [70, 66], dieta: "Herbívoro (talvez onívoro)", tam: "~4,5 m", onde: "América do Norte",
      cur: "O topo do crânio tinha até 25 cm de osso maciço." },
    { n: "Iguanodon", sig: "dente de iguana", per: "Cretáceo Inferior", ma: [126, 122], dieta: "Herbívoro", tam: "~10 m", onde: "Europa",
      cur: "Foi um dos primeiros dinossauros a ganhar nome (1825). No começo acharam que o espinho do polegar era um chifre no nariz!" },
    { n: "Archaeopteryx", sig: "asa antiga", per: "Jurássico Superior", ma: [151, 149], dieta: "Pequenos animais", tam: "~50 cm", onde: "Alemanha",
      cur: "Meio ave, meio dinossauro: tinha penas e asas, mas também dentes, garras e uma cauda de osso comprida. Ajudou a mostrar que as aves descendem dos dinossauros." },
    { n: "Microraptor", sig: "pequeno ladrão", per: "Cretáceo Inferior", ma: [125, 120], dieta: "Carnívoro", tam: "~80 cm", onde: "China",
      cur: "Tinha penas nos braços e nas pernas, como se fossem quatro asas. Pelas penas fossilizadas, sabe-se que era preto e brilhante, como um corvo." },
    { n: "Oviraptor", sig: "ladrão de ovos", per: "Cretáceo Superior", ma: [75, 71], dieta: "Onívoro", tam: "~1,6 m", onde: "Mongólia",
      cur: "Ganhou esse nome porque foi achado sobre um ninho e acharam que estava roubando ovos. Décadas depois descobriram que os ovos eram da própria espécie: ele estava chocando." },
    { n: "Therizinosaurus", sig: "lagarto ceifador", per: "Cretáceo Superior", ma: [71, 68], dieta: "Herbívoro", tam: "~9 m", onde: "Mongólia",
      cur: "Tinha garras de uns 50 cm nas mãos — as maiores conhecidas —, mas provavelmente as usava para puxar galhos e comer plantas." },
    { n: "Dilophosaurus", sig: "lagarto de duas cristas", per: "Jurássico Inferior", ma: [193, 183], dieta: "Carnívoro", tam: "~7 m", onde: "Estados Unidos",
      cur: "No filme Jurassic Park ele cospe veneno e abre uma gola no pescoço. Isso foi invenção do cinema: não há nada disso nos fósseis." },
    { n: "Baryonyx", sig: "garra pesada", per: "Cretáceo Inferior", ma: [130, 125], dieta: "Peixes", tam: "~9 m", onde: "Inglaterra",
      cur: "Foi achado em 1983 por um caçador de fósseis amador. Dentro da barriga havia escamas de peixe — a prova do que ele comia." },
    { n: "Argentinosaurus", sig: "lagarto da Argentina", per: "Cretáceo Superior", ma: [97, 93], dieta: "Herbívoro", tam: "~30–35 m", onde: "Argentina",
      cur: "Um dos maiores animais que já andaram em terra firme: pode ter passado de 70 toneladas." },
    { n: "Giganotosaurus", sig: "lagarto gigante do sul", per: "Cretáceo Superior", ma: [99, 97], dieta: "Carnívoro", tam: "~12–13 m", onde: "Argentina",
      cur: "Rivalizava com o T. rex em tamanho, mas viveu uns 30 milhões de anos antes dele, em outro continente." },
    { n: "Carnotaurus", sig: "touro carnívoro", per: "Cretáceo Superior", ma: [72, 69], dieta: "Carnívoro", tam: "~8 m", onde: "Argentina",
      cur: "Tinha dois chifres acima dos olhos e bracinhos ainda menores, proporcionalmente, que os do T. rex. Até impressões da pele ficaram preservadas." },
    // ---- do Brasil ----
    { n: "Staurikosaurus", sig: "lagarto do Cruzeiro do Sul", per: "Triássico Superior", ma: [234, 232], dieta: "Carnívoro", tam: "~2 m", onde: "Rio Grande do Sul", br: true,
      cur: "Um dos dinossauros mais antigos do mundo. O nome homenageia o Cruzeiro do Sul, constelação que só se vê do hemisfério sul.", ceu: true },
    { n: "Buriolestes", sig: "ladrão de Buriol", per: "Triássico Superior", ma: [234, 232], dieta: "Carnívoro", tam: "~1,5 m", onde: "Rio Grande do Sul", br: true,
      cur: "Um pequeno caçador, parente bem antigo dos saurópodes: os descendentes da sua linhagem viraram gigantes como o Argentinosaurus." },
    { n: "Irritator", sig: "o irritante", per: "Cretáceo Inferior", ma: [113, 110], dieta: "Peixes", tam: "~6,5 m", onde: "Chapada do Araripe (CE)", br: true,
      cur: "O nome é uma piada: o crânio foi vendido com partes falsas de gesso, e os cientistas ficaram irritados ao descobrir. O nome da espécie, challengeri, homenageia o Professor Challenger, do livro O Mundo Perdido." },
    { n: "Santanaraptor", sig: "ladrão de Santana", per: "Cretáceo Inferior", ma: [113, 110], dieta: "Carnívoro", tam: "~1,3 m", onde: "Chapada do Araripe (CE)", br: true,
      cur: "Um caçador pequenino, possivelmente parente distante dos tiranossauros. O fóssil preservou até fibras musculares — coisa raríssima." },
    { n: "Oxalaia", sig: "de Oxalá", per: "Cretáceo Superior", ma: [100, 94], dieta: "Peixes", tam: "~12–14 m", onde: "Ilha do Cajual (MA)", br: true,
      cur: "O nome homenageia Oxalá, orixá das religiões afro-brasileiras. É o maior dinossauro carnívoro já achado no Brasil, parente do Spinosaurus." },
    { n: "Pycnonemosaurus", sig: "lagarto da mata densa", per: "Cretáceo Superior", ma: [72, 66], dieta: "Carnívoro", tam: "~9 m", onde: "Mato Grosso", br: true,
      cur: "Parente brasileiro do Carnotaurus. “Mata densa” é uma referência ao próprio nome do Mato Grosso." },
    { n: "Maxakalisaurus", sig: "lagarto dos Maxakali", per: "Cretáceo Superior", ma: [80, 72], dieta: "Herbívoro", tam: "~13 m", onde: "Minas Gerais", br: true,
      cur: "Homenageia o povo indígena Maxakali, de Minas Gerais. Era um titanossauro, o grupo de pescoçudos que dominou a América do Sul no fim da era dos dinossauros." },
    { n: "Austroposeidon", sig: "Poseidon do sul", per: "Cretáceo Superior", ma: [72, 66], dieta: "Herbívoro", tam: "~25 m", onde: "São Paulo", br: true,
      cur: "O maior dinossauro já descrito no Brasil. Os ossos foram coletados nos anos 1950 e só foram estudados e batizados em 2016." }
  ];
  const NAO_DINOS = /pter|ptero|mosa|plesio|ictio|ichthyo|dimetro|megalodon|mamute|mammoth|smilodon|tigre/i;

  const DADOS = window.DINOS_DATA || []; // [nome, imagem, pt, en, ano, qid]
  const POR_NOME = new Map(DADOS.map(d => [d[0], d]));
  const FAV_POR_NOME = new Map(FAV.map(f => [f.n, f]));
  const POR_PAGINA = 48;

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const thumb = (file, w) => file ? "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(file) + "?width=" + w : "";
  const fmtMa = ma => ma[0] === ma[1] ? `${ma[0]}` : `${ma[0]}–${ma[1]}`;

  let filtro = "fav", busca = "", lista = [], mostrados = 0;

  // ---------- grade ----------
  function calcularLista() {
    const q = norm(busca.trim());
    if (q) return DADOS.filter(d => norm(d[0]).includes(q) || (d[2] && norm(d[2]).includes(q))).map(d => d[0]);
    if (filtro === "fav") return FAV.filter(f => !f.br).map(f => f.n);
    if (filtro === "br") return FAV.filter(f => f.br).map(f => f.n);
    return DADOS.map(d => d[0]);
  }

  function card(nome) {
    const d = POR_NOME.get(nome) || [nome, "", "", "", 0];
    const f = FAV_POR_NOME.get(nome);
    const img = d[1]
      ? `<img loading="lazy" src="${esc(thumb(d[1], 330))}" alt="">`
      : `<span class="sem-foto" aria-hidden="true">${esc(nome[0])}</span>`;
    const sub = f ? `“${esc(f.sig)}” · ${fmtMa(f.ma)} mi de anos` : (d[4] ? `descrito em ${d[4]}` : "");
    return `<a class="card" href="#v=dino&n=${encodeURIComponent(nome)}"><span class="card-img">${img}</span><span class="card-nome">${esc(nome)}</span><span class="card-sub">${sub}</span></a>`;
  }

  function renderGrade(reset) {
    const grade = $("dino-grade");
    if (reset) { lista = calcularLista(); mostrados = 0; grade.innerHTML = ""; }
    const prox = lista.slice(mostrados, mostrados + POR_PAGINA);
    grade.insertAdjacentHTML("beforeend", prox.map(card).join(""));
    mostrados += prox.length;
    $("dino-mais").hidden = mostrados >= lista.length;

    const dica = $("dino-dica");
    if (busca.trim()) {
      if (!lista.length && NAO_DINOS.test(busca)) dica.textContent = "Esse não está aqui porque não era dinossauro! Pterossauros (os “pterodáctilos”), répteis marinhos como o mosassauro e o plesiossauro, e mamíferos pré-históricos são outros grupos de bichos.";
      else dica.textContent = lista.length ? `${lista.length} encontrado${lista.length > 1 ? "s" : ""}` : "Nenhum dinossauro com esse nome no catálogo.";
    } else if (filtro === "todos") dica.textContent = `${DADOS.length} gêneros de dinossauros já descritos pela ciência, em ordem alfabética.`;
    else if (filtro === "br") dica.textContent = "Dinossauros que viveram onde hoje é o Brasil.";
    else dica.textContent = "Alguns dos mais famosos. Use a busca ou “Todos” para ver o catálogo completo.";
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("ativo", !busca.trim() && c.dataset.f === filtro));
  }

  // ---------- Wikipédia ----------
  async function wikiTexto(lang, titulo) {
    const u = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&explaintext=1&exsectionformat=wiki&redirects=1&titles=${encodeURIComponent(titulo)}`;
    const j = await (await fetch(u)).json();
    const page = Object.values(j.query.pages)[0];
    return { titulo: page.title, texto: page.extract || "" };
  }
  async function wikiImagens(lang, titulo) {
    const u = `https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(titulo.replace(/ /g, "_"))}`;
    const j = await (await fetch(u)).json();
    return (j.items || [])
      .filter(i => i.type === "image" && i.srcset && i.srcset.length && !/\.svg$/i.test(i.title) && !/icon|logo|stub/i.test(i.title))
      .slice(0, 24)
      .map(i => ({
        src: "https:" + i.srcset[0].src,
        grande: "https:" + i.srcset[i.srcset.length - 1].src,
        legenda: i.caption ? i.caption.text : "",
        pagina: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(i.title.replace(/ /g, "_"))}`
      }));
  }

  const PULAR = /^(refer[eê]ncias|notas|liga[cç][oõ]es externas|ver tamb[eé]m|bibliografia|galeria|references|notes|external links|see also|further reading|bibliography|gallery|sources|citations|fontes)$/i;
  function secoes(txt) {
    const out = [{ h: null, lvl: 1, body: [] }];
    txt.split("\n").forEach(linha => {
      const m = linha.match(/^(={2,})\s*(.+?)\s*\1\s*$/);
      if (m) out.push({ h: m[2], lvl: m[1].length, body: [] });
      else if (linha.trim()) out[out.length - 1].body.push(linha.trim());
    });
    // agrupa subseções dentro das seções de nível 2 e remove as que não interessam
    const grupos = [];
    let pulando = false;
    out.forEach(s => {
      if (s.lvl <= 2) {
        pulando = !!(s.h && PULAR.test(s.h));
        if (!pulando) grupos.push({ h: s.h, partes: [{ h: null, body: s.body }] });
      } else if (!pulando && grupos.length) {
        grupos[grupos.length - 1].partes.push({ h: s.h, body: s.body });
      }
    });
    return grupos.filter(g => g.partes.some(p => p.body.length));
  }
  const paragrafos = linhas => linhas.map(l => `<p>${esc(l)}</p>`).join("");

  // ---------- detalhe ----------
  let abertoNome = null, req = 0;

  // onde ele fica na Era dos Dinossauros (Triássico 252–201, Jurássico 201–145, Cretáceo 145–66 milhões de anos)
  function linhaDoTempo(ma) {
    const esq = (252 - ma[0]) / 186 * 100, larg = Math.max(0.8, (ma[0] - ma[1]) / 186 * 100);
    return `<div class="bloco"><h3>Na linha do tempo</h3>
      <div class="linha-tempo" role="img" aria-label="Viveu entre ${ma[0]} e ${ma[1]} milhões de anos atrás">
        <span class="lt-tri">Triássico</span><span class="lt-jur">Jurássico</span><span class="lt-cre">Cretáceo</span>
        <i class="lt-marca" style="left:${esq.toFixed(1)}%;width:${larg.toFixed(1)}%"></i>
      </div>
      <div class="lt-eixo"><span>252 milhões de anos</span><span>201</span><span>145</span><span>66 (o asteroide)</span></div></div>`;
  }

  // comparação do comprimento dele com uma pessoa de 1,70 m
  const QUADRUPEDES = /Triceratops|Stegosaurus|Brachiosaurus|Diplodocus|Brontosaurus|Ankylosaurus|Argentinosaurus|Austroposeidon|Maxakalisaurus|Iguanodon|Parasaurolophus/;
  const SILHUETA = {
    quadrupede: "M0,0.55 C0.15,0.5 0.25,0.3 0.42,0.28 C0.55,0.26 0.65,0.3 0.72,0.25 C0.8,0.18 0.88,0.1 0.97,0.12 C1,0.13 1,0.2 0.96,0.22 C0.88,0.24 0.82,0.32 0.75,0.42 C0.7,0.5 0.66,0.55 0.62,0.58 L0.62,1 L0.55,1 L0.53,0.66 L0.4,0.66 L0.38,1 L0.31,1 L0.3,0.6 C0.2,0.62 0.1,0.6 0,0.55 Z",
    bipede: "M0,0.36 C0.15,0.3 0.3,0.2 0.45,0.2 C0.55,0.2 0.65,0.22 0.72,0.2 L0.8,0.08 C0.86,0.04 0.95,0.06 1,0.12 L1,0.2 L0.9,0.22 L0.96,0.28 L0.86,0.3 C0.8,0.32 0.76,0.38 0.72,0.46 L0.76,0.52 L0.74,0.55 L0.68,0.5 C0.64,0.56 0.6,0.58 0.58,0.6 L0.62,0.96 L0.7,1 L0.56,1 L0.5,0.66 L0.46,0.64 L0.48,0.96 L0.55,1 L0.42,1 L0.38,0.6 C0.25,0.5 0.12,0.42 0,0.36 Z"
  };

  function tamanhoHTML(tam, nome) {
    const nums = [...tam.matchAll(/(\d+(?:,\d+)?)\s*(?:[–-]\s*(\d+(?:,\d+)?))?\s*(cm|m)\b/g)];
    if (!nums.length) return "";
    const n = nums[nums.length - 1];
    const L = parseFloat((n[2] || n[1]).replace(",", ".")) / (n[3] === "cm" ? 100 : 1);
    const h = Math.min(Math.max(L * (QUADRUPEDES.test(nome) ? 0.32 : 0.36), 0.25), 9);
    const W = L + 1.6, H = Math.max(2.1, h + 0.3);
    const dino = SILHUETA[QUADRUPEDES.test(nome) ? "quadrupede" : "bipede"];
    return `<div class="bloco"><h3>Do tamanho de…</h3>
      <svg viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}" width="100%" style="max-height:220px" role="img" aria-label="Comparação de tamanho com uma pessoa">
        <g fill="#f4a3b8" transform="translate(0.3 ${(H - 1.7).toFixed(2)})">
          <circle cx="0.22" cy="0.13" r="0.12"/><rect x="0.08" y="0.28" width="0.28" height="0.72" rx="0.1"/>
          <rect x="0.1" y="0.9" width="0.1" height="0.8" rx="0.05"/><rect x="0.24" y="0.9" width="0.1" height="0.8" rx="0.05"/>
        </g>
        <path d="${dino}" fill="#9fd3a3" transform="translate(1.2 ${(H - h).toFixed(2)}) scale(${L.toFixed(2)} ${h.toFixed(2)})"/>
        <line x1="0" x2="${W.toFixed(2)}" y1="${H}" y2="${H}" stroke="rgba(159,211,163,.4)" stroke-width="${(W / 300).toFixed(3)}"/>
      </svg>
      <p class="tamanho-legenda">Uma pessoa de 1,70 m ao lado de um bicho de ${String(L).replace(".", ",")} m de comprimento (desenho genérico, só para dar a escala).</p></div>`;
  }

  function fichaHTML(f, d) {
    if (!f) return d[4] ? `<dl class="ficha"><div><dt>Descrito em</dt><dd>${d[4]}</dd></div></dl>` : "";
    const meio = (f.ma[0] + f.ma[1]) / 2;
    const volta = Math.round(meio / 230 * 100);
    const lua = Math.round(meio * 38 / 100) * 100;
    return `
      <p class="significado">“${esc(f.sig)}”</p>
      <dl class="ficha">
        <div><dt>Quando viveu</dt><dd>${esc(f.per)} · ${fmtMa(f.ma)} milhões de anos atrás</dd></div>
        <div><dt>Alimentação</dt><dd>${esc(f.dieta)}</dd></div>
        <div><dt>Tamanho</dt><dd>${esc(f.tam)}</dd></div>
        <div><dt>Onde foi achado</dt><dd>${esc(f.onde)}</dd></div>
        ${d[4] ? `<div><dt>Descrito em</dt><dd>${d[4]}</dd></div>` : ""}
      </dl>
      <p class="curiosidade">${esc(f.cur)}</p>
      ${linhaDoTempo(f.ma)}
      ${tamanhoHTML(f.tam, f.n)}
      <div class="ceu-epoca">
        <h3>E o céu na época dele?</h3>
        <p>Bem diferente! As constelações de hoje não existiam, porque as estrelas se movem pela galáxia — e, desde então,
        o Sistema Solar já percorreu ${volta < 100 ? `uns ${volta}% de uma volta` : "mais de uma volta inteira"} em torno do centro da Via Láctea.
        A Lua estava cerca de ${lua.toLocaleString("pt-BR")} km mais perto da Terra, e os dias eram um pouquinho mais curtos.</p>
        ${f.ceu ? `<p><a href="#v=ceu&m=chao&az=180&alt=15">Ver o Cruzeiro do Sul no céu (olhando para o sul) →</a></p>` : ""}
      </div>`;
  }

  async function abrir(nome) {
    if (!nome) return;
    const d = POR_NOME.get(nome);
    const f = FAV_POR_NOME.get(nome);
    const modal = $("dino-modal"), box = $("dino-detalhe");
    abertoNome = nome;
    modal.hidden = false;
    document.body.classList.add("travado");
    if (!d) {
      box.innerHTML = `<h2 id="dino-nome">${esc(nome)}</h2><p>Não achei esse nome no catálogo.</p>`;
      return;
    }
    const meu = ++req;
    const capa = d[1] ? `<img class="capa" src="${esc(thumb(d[1], 960))}" alt="${esc(nome)}">` : "";
    box.innerHTML = `
      ${capa}
      <h2 id="dino-nome">${esc(nome)}</h2>
      ${fichaHTML(f, d)}
      <div id="dino-texto" class="texto"><p class="carregando">Buscando a história dele na Wikipédia…</p></div>
      <div id="dino-galeria"></div>`;
    box.parentElement.scrollTop = 0;

    const lang = d[2] ? "pt" : "en";
    const titulo = d[2] || d[3];
    try {
      const { titulo: tit, texto } = await wikiTexto(lang, titulo);
      if (meu !== req) return;
      const gs = secoes(texto);
      const link = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(tit.replace(/ /g, "_"))}`;
      const traduzir = `https://${lang}-m-wikipedia-org.translate.goog/wiki/${encodeURIComponent(tit.replace(/ /g, "_"))}?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt-BR`;
      let html = lang === "en"
        ? `<p class="aviso">Esse ainda não tem verbete em português, então o texto está em inglês. <a href="${traduzir}" target="_blank" rel="noopener">Ler traduzido →</a></p>`
        : "";
      if (gs.length) {
        html += paragrafos(gs[0].h ? [] : gs[0].partes[0].body);
        gs.filter(g => g.h).slice(0, 10).forEach(g => {
          html += `<details><summary>${esc(g.h)}</summary>${g.partes.map(p => (p.h ? `<h4>${esc(p.h)}</h4>` : "") + paragrafos(p.body)).join("")}</details>`;
        });
      } else html += "<p>A Wikipédia ainda não tem um texto sobre ele.</p>";
      html += `<p class="fonte">Texto: <a href="${link}" target="_blank" rel="noopener">Wikipédia${lang === "en" ? " em inglês" : ""}</a> (CC BY-SA)</p>`;
      $("dino-texto").innerHTML = html;
    } catch (e) {
      if (meu === req) $("dino-texto").innerHTML = `<p>Não consegui falar com a Wikipédia agora. Verifique a internet e tente de novo.</p>`;
    }

    try {
      // a versão em inglês costuma ter mais fotos (fósseis, esqueletos, reconstituições)
      const imgs = await wikiImagens(d[3] ? "en" : "pt", d[3] || d[2]);
      if (meu !== req || !imgs.length) return;
      $("dino-galeria").innerHTML = `<h3>Fósseis, esqueletos e reconstituições</h3><div class="galeria">${imgs.map((im, i) =>
        `<button type="button" class="foto" data-i="${i}"><img loading="lazy" src="${esc(im.src)}" alt="${esc(im.legenda)}"></button>`).join("")}</div>`;
      $("dino-galeria").querySelectorAll(".foto").forEach(b => b.addEventListener("click", () => ampliar(imgs[+b.dataset.i])));
    } catch (e) { /* sem galeria */ }
  }

  function ampliar(im) {
    const lb = $("lightbox");
    $("lightbox-img").src = im.grande;
    $("lightbox-img").alt = im.legenda;
    $("lightbox-legenda").innerHTML = `${esc(im.legenda)} <a href="${im.pagina}" target="_blank" rel="noopener">autor e licença</a>`;
    lb.hidden = false;
  }

  function fechar(silencioso) {
    if ($("dino-modal").hidden) return;
    $("dino-modal").hidden = true;
    $("lightbox").hidden = true;
    document.body.classList.remove("travado");
    abertoNome = null;
    req++;
    if (!silencioso) location.hash = "v=dinos";
  }

  function init() {
    document.querySelectorAll(".chip[data-f]").forEach(c => c.addEventListener("click", () => {
      filtro = c.dataset.f; busca = ""; $("dino-busca").value = "";
      renderGrade(true);
    }));
    let t;
    $("dino-busca").addEventListener("input", e => {
      clearTimeout(t);
      t = setTimeout(() => { busca = e.target.value; renderGrade(true); }, 150);
    });
    $("dino-mais").addEventListener("click", () => renderGrade(false));
    $("dino-surpresa").addEventListener("click", () => {
      const bons = DADOS.filter(d => d[1] && d[2]); // com foto e verbete em português
      const d = bons[Math.floor(Math.random() * bons.length)];
      location.hash = "v=dino&n=" + encodeURIComponent(d[0]);
    });
    document.querySelectorAll("[data-fechar]").forEach(b => b.addEventListener("click", () => fechar()));
    $("lightbox").addEventListener("click", e => { if (e.target.tagName !== "A") $("lightbox").hidden = true; });
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if (!$("lightbox").hidden) $("lightbox").hidden = true;
      else fechar();
    });
    renderGrade(true);
  }

  window.Dinos = { init, abrir, fechar, aberto: () => abertoNome, _FAV: FAV };
})();
