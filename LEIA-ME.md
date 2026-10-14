# Céus & Eras

Site com duas partes:

- **O céu**: escolha o lugar (qualquer um dos 5.570 municípios do Brasil, cidades do mundo ou a sua localização exata), o dia e a hora.
  - **Vista do chão**: como alguém em pé naquele lugar via o céu. Arraste para olhar em volta, use a roda do mouse ou o gesto de pinça para dar zoom, e os botões N/L/S/O/↑ para virar rápido.
  - **Céu inteiro**: o mapa da cúpula toda, bom para baixar como imagem (pôster).
  - Via Láctea, constelações em português, planetas, fase da Lua, nascer/pôr do Sol e da Lua, eclipses, chuvas de meteoros, solstícios e equinócios.
  - "Acelerar o tempo" faz o céu girar (cerca de 1 hora por segundo).
  - "Claridade do dia" mostra o céu azul quando o Sol está acima do horizonte. Desligado, o céu fica sempre escuro, para dar para ver as estrelas mesmo de dia.
- **Dinossauros**: 1.634 gêneros catalogados (Wikidata), com foto, história e galeria de fósseis puxadas da Wikipédia.
  Os favoritos têm ficha, linha do tempo e comparação de tamanho com uma pessoa.

## Como abrir

Dê dois cliques em `index.html`. Precisa de internet para as fotos e textos dos dinossauros e para buscar cidades fora do Brasil
(o céu e os municípios brasileiros funcionam offline).

A localização exata só funciona quando o site está publicado (https) ou aberto pelo próprio computador; o navegador pede permissão.

## Personalizar

Edite `js/config.js`:

- `titulo` e `mensagem`: o texto do topo.
- `lugarPadrao`: o lugar que aparece ao abrir (hoje, `"União (PI)"`).
- `dataEspecial` (ex.: `"2023-06-10"`), `horaEspecial`, `lugarEspecial`, `legendaEspecial`: cria um botão que mostra o céu daquele momento.

As fichas dos dinossauros favoritos estão no começo de `js/dinos.js` (lista `FAV`).

Depois de mudar algum arquivo, se o navegador continuar mostrando a versão antiga, aumente o número `?v=8` nos links do `index.html`.

## Arquivos

| arquivo | o que é |
|---|---|
| `js/sky.js` | cálculo e desenho do céu (vista do chão e céu inteiro) |
| `js/places.js` | busca de lugares e localização |
| `js/dinos.js` | catálogo, busca e ficha dos dinossauros |
| `js/app.js` | navegação entre as abas |
| `js/sky-data.js` | 5.044 estrelas (Hipparcos) e as 88 constelações, via d3-celestial |
| `js/places-data.js` | os municípios do Brasil com coordenadas (IBGE) |
| `js/dinos-data.js` | lista de dinossauros tirada do Wikidata |
| `js/astronomy.min.js` | biblioteca Astronomy Engine (MIT) |
