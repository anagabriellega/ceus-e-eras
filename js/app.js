// Navegação entre "O céu" e "Dinossauros" pelo endereço (#v=ceu&..., #v=dinos, #v=dino&n=Nome).
(function () {
  "use strict";
  const C = window.CONFIG || {};
  if (C.titulo) { document.getElementById("titulo").textContent = C.titulo; document.title = C.titulo; }
  document.getElementById("mensagem").textContent = C.mensagem || "";

  let viewAtual = null;

  function mostrar(view) {
    if (view === viewAtual) return;
    viewAtual = view;
    document.querySelectorAll(".view").forEach(v => { v.hidden = v.id !== "view-" + view; });
    document.querySelectorAll(".aba").forEach(a => a.setAttribute("aria-selected", String(a.dataset.view === view)));
    if (view === "ceu") Ceu.desenhar();
  }

  function rota() {
    const p = new URLSearchParams(location.hash.slice(1));
    const v = p.get("v") || "ceu";
    if (v === "dino") {
      mostrar("dinos");
      if (Dinos.aberto() !== p.get("n")) Dinos.abrir(p.get("n"));
      return;
    }
    Dinos.fechar(true);
    if (v === "dinos") mostrar("dinos");
    else { mostrar("ceu"); Ceu.aplicarParams(p); }
  }

  Ceu.init(params => {
    if (viewAtual !== "ceu") return;
    const h = "#" + new URLSearchParams(Object.assign({ v: "ceu" }, params)).toString();
    if (location.hash !== h) history.replaceState(null, "", h);
  });
  Dinos.init();
  window.addEventListener("hashchange", rota);
  rota();
})();
