/* Torre Safira: maquete 3D do pavimento tipo.
   Paredes medidas na planta de projeto (CAD); m\u00f3veis posicionados pela planta humanizada do book,
   usando os modelos do Furniture Kit (Kenney, CC0). Coordenadas em "px de planta" (1 m = 133 px). */
(function () {
  const S = 1 / 133;
  const AX = 2476, AZ = 20;           // eixos de simetria do pavimento (px de planta)
  const T = THREE;

  /* ---------- texturas ---------- */
  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping;
    t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t;
  }
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const TEX = {};
  // porcelanato claro 90x90 com veios suaves (a textura cobre 2x2 placas = 1,8 m)
  function porcelainTex() {
    return TEX.porc || (TEX.porc = canvasTex(1024, 1024, (g, w, h) => {
      const n = 2, p = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const x = i * p, y = j * p, l = 91 + rnd() * 2.5;
        g.fillStyle = `hsl(36,10%,${l}%)`; g.fillRect(x, y, p, p);
        for (let k = 0; k < 14; k++) {          // nuvens
          const cx = x + rnd() * p, cy = y + rnd() * p, r = 40 + rnd() * 160;
          const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
          gr.addColorStop(0, `rgba(${rnd() < .5 ? "255,255,255" : "190,182,170"},${.05 + rnd() * .05})`); gr.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = gr; g.fillRect(x, y, p, p);
        }
        g.save(); g.beginPath(); g.rect(x, y, p, p); g.clip();
        for (let k = 0; k < 5; k++) {           // veios
          g.strokeStyle = `rgba(150,140,128,${.06 + rnd() * .08})`; g.lineWidth = .6 + rnd() * 1.6;
          let vx = x + rnd() * p, vy = y; g.beginPath(); g.moveTo(vx, vy);
          for (let s = 0; s < 6; s++) { const nx = vx + (rnd() - .4) * 120, ny = vy + p / 5; g.quadraticCurveTo(vx + (rnd() - .5) * 90, vy + p / 10, nx, ny); vx = nx; vy = ny; }
          g.stroke();
        }
        g.restore();
        g.strokeStyle = "rgba(170,162,150,.75)"; g.lineWidth = 2.2; g.strokeRect(x + 1.1, y + 1.1, p - 2.2, p - 2.2);
      }
    }));
  }
  // assoalho de carvalho (a textura cobre 2,4 m)
  function woodTex() {
    return TEX.wood || (TEX.wood = canvasTex(1024, 1024, (g, w, h) => {
      const rows = 12, ph = h / rows;
      for (let r = 0; r < rows; r++) {
        let x = -rnd() * w * .6;
        while (x < w) {
          const len = w * (.4 + rnd() * .45), l = 60 + rnd() * 9, s = 30 + rnd() * 10;
          g.fillStyle = `hsl(31,${s}%,${l}%)`; g.fillRect(x, r * ph, len, ph);
          for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(105,66,32,${.04 + rnd() * .07})`; g.lineWidth = .6 + rnd() * 1.6; const yy = r * ph + rnd() * ph; g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + len * .3, yy + (rnd() - .5) * 6, x + len * .6, yy + (rnd() - .5) * 6, x + len, yy); g.stroke(); }
          g.fillStyle = "rgba(70,42,20,.35)"; g.fillRect(x, r * ph, 2, ph);
          x += len;
        }
        g.fillStyle = "rgba(70,42,20,.32)"; g.fillRect(0, r * ph, w, 1.6);
      }
    }));
  }
  // sombra de contato (penumbra macia sob cada m\u00f3vel)
  function shadowTex() {
    return TEX.sh || (TEX.sh = canvasTex(128, 128, (g, w, h) => {
      for (let i = 0; i < 16; i++) {
        const m = 6 + i * 2.6; g.fillStyle = "rgba(0,0,0,.075)";
        const r = Math.max(2, 26 - i * 1.4); const x = m, y = m, ww = w - 2 * m, hh = h - 2 * m;
        g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.fill();
      }
    }));
  }

  /* ---------- materiais ---------- */
  function M(color, rough = .8, metal = 0, extra = {}) { return new T.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal, envMapIntensity: metal > .5 ? .9 : .4 }, extra)); }
  const MAT = {}, COLS = {};
  function initMats() {
    if (MAT.wall) return;
    Object.assign(MAT, {
      wall: M(0xefede9, .95), cap: M(0x15191f, .95, 0, { envMapIntensity: .05 }), slab: M(0x061633, .9, 0, { envMapIntensity: .1 }),
      fabric: M(0xe4ddd2, 1), navy: M(0x0f2b5c, .95, 0, { envMapIntensity: .15 }), gold: M(0xc9a46a, .85),
      walnut: M(0x6e4a2e, .55), oak: M(0xc09a6c, .6), lacquer: M(0xf1efeb, .4), greige: M(0xd7d0c4, .9),
      granite: M(0x2a2b2f, .28), marble: M(0xf4f2ee, .22), steel: M(0xc9ced4, .25, .85), black: M(0x17191d, .4, .25),
      ceramic: M(0xffffff, .15), linen: M(0xf7f5f0, .95), leaf: M(0x3f7d4d, .75), pot: M(0x8d8478, .8), screen: M(0x0a0c0f, .12, .3),
      rail: M(0x1c2129, .4, .6), rug: M(0xdcd5c9, 1),
      glass: new T.MeshPhysicalMaterial({ color: 0xe3edf4, roughness: .05, metalness: 0, transparent: true, opacity: .16, depthWrite: false, envMapIntensity: .5 }),
      lamp: new T.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: 1.1 }),
      shadow: new T.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, opacity: .8 }),
    });
  }
  const colMat = (hex, rough = .95) => COLS[hex] || (COLS[hex] = M(new T.Color(hex).getHex(), rough));
  function floorMat(kind, wM, dM) {
    const base = kind === "wood" ? woodTex() : porcelainTex(), t = base.clone(); t.needsUpdate = true;
    const tile = kind === "wood" ? 2.4 : 1.8; t.repeat.set(wM / tile, dM / tile);
    return M(0xffffff, kind === "wood" ? .55 : .26, 0, { map: t, envMapIntensity: kind === "wood" ? .35 : .55 });
  }

  /* ---------- primitivas ---------- */
  function bx(w, h, d, mat) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.castShadow = m.receiveShadow = true; return m; }
  function at(m, x, y, z) { m.position.set(x, y, z); return m; }
  function rect(g, x0, y0, x1, y1, yb, h, mat) { g.add(at(bx((x1 - x0) * S, h, (y1 - y0) * S, mat), (x0 + x1) / 2 * S, yb + h / 2, (y0 + y1) / 2 * S)); }
  function wallBox(g, x0, y0, x1, y1, yb, h, H) {
    if (h <= .001) return;
    const top = yb + h >= H - .001, mats = top ? [MAT.wall, MAT.wall, MAT.cap, MAT.wall, MAT.wall, MAT.wall] : MAT.wall;
    const m = new T.Mesh(new T.BoxGeometry((x1 - x0) * S, h, (y1 - y0) * S), mats);
    m.castShadow = m.receiveShadow = true; g.add(at(m, (x0 + x1) / 2 * S, yb + h / 2, (y0 + y1) / 2 * S));
  }
  // parede com aberturas (portas, janelas, porta de correr)
  function wall(g, x0, y0, x1, y1, H, openings = []) {
    const horiz = (x1 - x0) >= (y1 - y0), a0 = horiz ? x0 : y0, a1 = horiz ? x1 : y1;
    const seg = (s0, s1, yb, h) => horiz ? wallBox(g, s0, y0, s1, y1, yb, h, H) : wallBox(g, x0, s0, x1, s1, yb, h, H);
    const c = horiz ? (y0 + y1) / 2 * S : (x0 + x1) / 2 * S;
    const glass = (s0, s1, yb, h) => {
      const len = (s1 - s0) * S, mid = (s0 + s1) / 2 * S;
      g.add(at(new T.Mesh(new T.BoxGeometry(horiz ? len : .02, h, horiz ? .02 : len), MAT.glass), horiz ? mid : c, yb + h / 2, horiz ? c : mid));
      [yb + .02, yb + h - .02].forEach(y => g.add(at(new T.Mesh(new T.BoxGeometry(horiz ? len : .05, .04, horiz ? .05 : len), MAT.rail), horiz ? mid : c, y, horiz ? c : mid)));
      const posts = [s0 * S + .02, s1 * S - .02]; if (len > 1.2) posts.push(mid);
      posts.forEach(p => g.add(at(new T.Mesh(new T.BoxGeometry(horiz ? .04 : .05, h, horiz ? .05 : .04), MAT.rail), horiz ? p : c, yb + h / 2, horiz ? c : p)));
    };
    let cur = a0;
    openings.sort((a, b) => a[0] - b[0]).forEach(([o0, o1, kind]) => {
      seg(cur, o0, 0, H);
      if (kind === "door") { if (H > 2.1) seg(o0, o1, 2.1, H - 2.1); }
      else if (kind === "slide") { glass(o0, o1, 0, Math.min(H, 2.3)); if (H > 2.3) seg(o0, o1, 2.3, H - 2.3); }
      else { const sill = kind === "winHigh" ? 1.3 : .9; seg(o0, o1, 0, Math.min(sill, H)); if (H > sill) glass(o0, o1, sill, Math.min(H, 2.2) - sill); if (H > 2.2) seg(o0, o1, 2.2, H - 2.2); }
      cur = o1;
    });
    seg(cur, a1, 0, H);
  }

  /* ---------- apartamento (paredes do CAD, medidas no Final 01) ---------- */
  function apartment(H, ext) {
    const g = new T.Group(), R = ext ? 2128 : 1975;   // Final 03: cozinha avan\u00e7a ~1 m sobre o hall
    rect(g, 308, 8, 1975, 750, -.3, .3, MAT.slab); if (ext) rect(g, 1975, 200, R, 750, -.3, .3, MAT.slab); rect(g, 22, 8, 308, 372, -.3, .3, MAT.slab);
    const floors = [
      [335, 32, 1950, 360, "porc"], [735, 360, 888, 540, "porc"], [1700, 360, 1950, 722, "porc"],
      [735, 562, 1055, 722, "porc"], [1540, 383, 1700, 722, "porc"], [22, 32, 308, 372, "porc"],
      [335, 383, 712, 722, "wood"], [910, 383, 1515, 540, "wood"], [1078, 540, 1515, 722, "wood"],
    ];
    if (ext) floors.push([1950, 215, R - 18, 722, "porc"]);
    { const w = (R - 335) * S, d = (722 - 32) * S, base = new T.Mesh(new T.BoxGeometry(w, .016, d), floorMat("porc", w, d)); base.receiveShadow = true; g.add(at(base, (335 + R) / 2 * S, .008, (32 + 722) / 2 * S)); }
    floors.forEach(([x0, y0, x1, y1, k]) => { const w = (x1 - x0) * S, d = (y1 - y0) * S; const m = new T.Mesh(new T.BoxGeometry(w, .02, d), floorMat(k, w, d)); m.receiveShadow = true; g.add(at(m, (x0 + x1) / 2 * S, .01, (y0 + y1) / 2 * S)); });
    wall(g, 22, 8, R, 32, H);
    wall(g, 308, 722, R, 750, H, [[958, 1050, "winHigh"], [1205, 1380, "win"], [1555, 1650, "winHigh"], [1745, 1925, "win"]]);
    wall(g, 308, 32, 335, 750, H, [[78, 308, "slide"], [470, 665, "win"]]);
    if (ext) { wall(g, 1950, 32, 1975, 215, H, [[50, 170, "door"]]); wall(g, 1975, 200, R, 215, H); wall(g, R - 18, 215, R, 722, H); }
    else wall(g, 1950, 32, 1975, 722, H, [[50, 170, "door"]]);
    wall(g, 335, 360, 735, 383, H);
    wall(g, 712, 383, 735, 722, H, [[400, 510, "door"]]);
    wall(g, 888, 360, 1718, 383, H);
    wall(g, 888, 383, 910, 540, H, [[400, 510, "door"]]);
    wall(g, 735, 540, 1078, 562, H, [[755, 850, "door"]]);
    wall(g, 1055, 562, 1078, 722, H);
    wall(g, 1515, 383, 1540, 722, H, [[505, 600, "door"]]);
    wall(g, 1700, 383, 1718, 722, H);
    wallBox(g, 1665, 628, 1700, 722, 0, H, H);
    wallBox(g, 955, 562, 1055, 590, 0, H, H);
    // sacada: guarda-corpo de vidro
    wallBox(g, 22, 32, 36, 372, 0, .12, 1.1); wallBox(g, 22, 360, 308, 372, 0, .12, 1.1);
    [[30, 32, 33, 372], [22, 366, 308, 369]].forEach(([a, b, c, d]) => {
      const w = Math.max((c - a) * S, .02), dd = Math.max((d - b) * S, .02);
      g.add(at(new T.Mesh(new T.BoxGeometry(w, .95, dd), MAT.glass), (a + c) / 2 * S, .12 + .475, (b + d) / 2 * S));
      g.add(at(bx(w + .02, .04, dd + .02, MAT.rail), (a + c) / 2 * S, 1.09, (b + d) / 2 * S));
    });
    return g;
  }

  /* ---------- modelos Kenney ---------- */
  const MODELS = {}; let loading = null;
  const DEF = { wood: "walnut", woodDark: "black", metal: "black", metalDark: "black", metalMedium: "steel", metalLight: "ceramic", carpet: "fabric", carpetBlue: "fabric", carpetWhite: "linen", carpetDarker: "greige", glass: "glass", lamp: "lamp", plant: "leaf", _defaultMat: "greige" };
  function loadModels() {
    if (loading) return loading;
    const L = new T.GLTFLoader(), src = window.KENNEY_GLB || {};
    loading = Promise.all(Object.keys(src).map(n => new Promise(res => L.load(src[n], gl => {
      const sc = gl.scene; sc.updateMatrixWorld(true);
      const box = new T.Box3().setFromObject(sc); MODELS[n] = { scene: sc, min: box.min.clone(), size: box.getSize(new T.Vector3()) }; res();
    }, undefined, () => res()))));
    return loading;
  }
  // encaixa um modelo no ret\u00e2ngulo local w x d (frente para +Z), altura h
  function K(gr, w, d, name, o = {}) {
    const m = MODELS[name]; if (!m) return null;
    const obj = m.scene.clone(true), map = Object.assign({}, DEF, o.mats || {});
    obj.traverse(c => { if (c.isMesh) { const k = map[c.material && c.material.name]; c.material = (k && k.isMaterial) ? k : (MAT[k] || MAT.greige); c.castShadow = c.receiveShadow = true; } });
    const sx = w / m.size.x, sz = d / m.size.z, sy = o.ys || ((o.h || .8) / m.size.y);
    obj.scale.set(sx, sy, sz);
    obj.position.set(-(m.min.x + m.size.x / 2) * sx + (o.x || 0), -m.min.y * sy + (o.y || 0), -(m.min.z + m.size.z / 2) * sz + (o.z || 0));
    gr.add(obj); return obj;
  }
  // m\u00f3dulos lado a lado ao longo da largura local
  function tile(gr, w, d, names, o) { const n = names.length, mw = w / n; names.forEach((nm, i) => K(gr, mw, d, nm, Object.assign({}, o, { x: -w / 2 + mw * (i + .5) }))); }
  function contact(gr, w, d) { const p = new T.Mesh(new T.PlaneGeometry(w * 1.18 + .12, d * 1.18 + .12), MAT.shadow); p.rotation.x = -Math.PI / 2; p.position.y = .023; p.renderOrder = 1; gr.add(p); }

  const KIT = { wood: "lacquer", woodDark: "granite", metal: "black", metalDark: "black", metalLight: "steel", metalMedium: "steel", carpetWhite: "black", _defaultMat: "steel" };
  const BUILD = {
    rug: (g, w, d, c) => K(g, w, d, "rugRectangle", { h: .012, mats: { carpet: "rug", carpetDarker: "greige" } }),
    sofa: (g, w, d, c, H) => {
      K(g, w, d, "loungeDesignSofa", { h: .8, mats: { carpetBlue: colMat(c), metal: "black" } });
      [[-.28, "navy"], [.28, "gold"]].forEach(([f, m]) => { const p = K(g, .42, .16, "pillow", { h: .4, x: f * w, y: .36, z: -d / 2 + .3, mats: { carpet: m } }); if (p) p.rotation.x = -.22; });
    },
    chaise: (g, w, d, c) => K(g, w, d, "loungeSofaOttoman", { h: .42, mats: { carpet: colMat(c), wood: "black" } }),
    rack: (g, w, d) => { K(g, w, d, "cabinetTelevision", { h: .48, mats: { wood: "walnut" } }); K(g, Math.min(w * .78, 1.45), .1, "televisionModern", { h: .82, y: .48, mats: { metalDark: "screen", metal: "black" } }); },
    plant: (g, w, d) => K(g, w, d, "pottedPlant", { h: 1.15, mats: { wood: "pot", woodDark: "pot", plant: "leaf" } }),
    table: (g, w, d, c) => K(g, w, d, "table", { h: .76, mats: { wood: colMat(c, .45) } }),
    chair: (g, w, d, c) => K(g, w, d, "chairModernCushion", { h: .86, mats: { metal: "black", carpetBlue: c ? colMat(c) : "gold" } }),
    stool: (g, w, d) => K(g, w, d, "stoolBar", { h: .76, mats: { wood: "black", carpet: "fabric" } }),
    bar: (g, w, d) => tile(g, w, d, Array(Math.max(1, Math.round(w / .6))).fill("kitchenBar"), { h: 1.0, mats: { wood: "granite", woodDark: "granite", metal: "black" } }),
    kitchen: (g, w, d, c, H, mods) => tile(g, w, d, mods, { ys: .92 / .45, mats: KIT }),
    fridge: (g, w, d, c, H) => K(g, w, d, "kitchenFridgeBuiltIn", { h: Math.min(1.95, H - .02), mats: { wood: "oak", woodDark: "oak", metalLight: "steel", metal: "black", glass: "glass" } }),
    washer: (g, w, d) => K(g, w, d, "washer", { h: .86, mats: { metalLight: "ceramic", metal: "steel", metalMedium: "steel", metalDark: "black" } }),
    bed: (g, w, d, c) => { K(g, w, d, "bedDouble", { h: .95, mats: { wood: "walnut", carpetWhite: "linen", carpet: colMat(c), metal: "black" } }); g.add(at(bx(w * .98, .05, .42, MAT.navy), 0, .5, d / 2 - .36)); },
    night: (g, w, d) => { K(g, w, d, "cabinetBedDrawerTable", { h: .5, mats: { wood: "walnut", metal: "gold", _defaultMat: "walnut" } }); K(g, w * .5, d * .5, "lampRoundTable", { h: .42, y: .5, mats: { metal: "gold", lamp: "lamp" } }); },
    wardrobe: (g, w, d, c, H) => tile(g, w, d, Array(Math.max(1, Math.round(w / .55))).fill("bookcaseClosedDoors"), { h: Math.min(2.1, H - .02), mats: { wood: "lacquer", metal: "black" } }),
    vanity: (g, w, d) => tile(g, w, d, Array(Math.max(1, Math.round(w / .65))).fill("bathroomCabinetDrawer"), { h: .9, mats: { wood: "walnut", carpetWhite: "ceramic", metalDark: "black", metalLight: "steel" } }),
    wc: (g, w, d) => K(g, w, d, "toiletSquare", { h: .8, mats: { carpetWhite: "ceramic", metalLight: "ceramic", metalDark: "black", _defaultMat: "ceramic" } }),
    shower: (g, w, d, c, H) => K(g, w, d, "shower", { h: Math.min(2.05, H - .02), mats: { carpetWhite: "ceramic", metalDark: "black", glass: "glass", metal: "black" } }),
    roundtable: (g, w, d) => {
      K(g, w, d, "tableRound", { h: .75, mats: { wood: "walnut" } });
      [-1, 1].forEach(s => { const c = new T.Group(); K(c, .44, .44, "chairModernCushion", { h: .86, mats: { metal: "black", carpetBlue: "fabric" } }); c.position.x = s * (w / 2 + .2); c.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(c); });
    },
    bbq: (g, w, d, c, H) => {
      g.add(at(bx(w, .9, d, MAT.granite), 0, .45, 0));
      g.add(at(bx(w * .62, .02, d * .7, MAT.black), -w * .12, .91, 0));
      for (let i = 0; i < 6; i++) g.add(at(bx(w * .6, .012, .012, MAT.steel), -w * .12, .93, -d * .3 + i * d * .12));
      g.add(at(bx(w * .62, .34, .03, MAT.black), -w * .12, .62, d / 2 + .005));          // boca da churrasqueira
      const hy = Math.min(1.5, H - .5);
      K(g, w * .6, d * .9, "hoodModern", { h: .5, x: -w * .12, y: hy, mats: { metalMedium: "black", _defaultMat: "black" } });
      const ch = H - (hy + .5); if (ch > .05) g.add(at(bx(w * .34, ch, d * .45, MAT.black), -w * .12, hy + .5 + ch / 2, -d * .15));   // chamin\u00e9
    },
  };
  const NO_SHADOW = { rug: 1, plant: 1 };

  /* ---------- planta humanizada (refer\u00eancia de posi\u00e7\u00e3o dos m\u00f3veis e foto do hall) ---------- */
  const IMG = { w: 2400, h: 743, x0: 13, y0: 16, kx: 2372 / 4908, ky: 707 / 1460 };
  const toImg = (x, y) => [IMG.x0 + (x - 22) * IMG.kx, IMG.y0 + (y + 710) * IMG.ky];
  const fromImg = (x, y) => [22 + (x - IMG.x0) / IMG.kx, -710 + (y - IMG.y0) / IMG.ky];
  const SPEC = {"01":[[169,410,381,507,"rug","s",null,null],[177,378,347,411,"sofa","s",null,"#dacecb"],[177,411,233,458,"chaise","s",null,"#e5d9d4"],[178,512,300,533,"rack","n",null,null],[322,486,356,522,"plant","n",null,null],[469,410,612,472,"table","s",null,"#e2deda"],[484,382,512,410,"chair","s",null,"#a39188"],[525,382,556,410,"chair","s",null,"#a69188"],[566,382,597,410,"chair","s",null,"#a69188"],[484,472,512,500,"chair","n",null,"#a6a79f"],[525,472,556,500,"chair","n",null,"#a9a89e"],[566,472,597,500,"chair","n",null,"#a9a6a0"],[441,426,468,460,"chair","e",null,"#9d9d98"],[612,426,641,460,"chair","w",null,"#a59d9a"],[753,438,788,529,"bar","w",null,null],[728,460,753,488,"stool","e",null,null],[728,494,753,525,"stool","e",null,null],[853,463,906,491,"kitchen","s",["kitchenStoveElectric","kitchenCabinetDrawer"],null],[906,463,947,554,"kitchen","w",["kitchenCabinet","kitchenCabinetDrawer","kitchenSink"],null],[900,559,947,616,"fridge","w",null,null],[906,632,941,660,"washer","w",null,null],[906,666,941,704,"kitchen","w",["kitchenSink"],null],[175,572,312,707,"rug","n",null,null],[194,588,294,707,"bed","n",null,"#cbc3b9"],[167,685,195,707,"night","n",null,null],[316,613,350,710,"wardrobe","w",null,null],[367,682,406,707,"vanity","n",null,null],[422,669,445,707,"wc","n",null,null],[459,620,515,707,"shower","w",null,null],[522,613,553,710,"wardrobe","e",null,null],[566,576,725,697,"rug","s",null,null],[597,547,700,676,"bed","s",null,"#89807c"],[561,551,594,579,"night","s",null,null],[700,551,733,579,"night","s",null,null],[756,547,778,588,"wc","s",null,null],[793,547,824,657,"vanity","w",null,null],[752,640,806,707,"shower","n",null,null],[44,460,94,510,"roundtable","s",null,null],[48,376,126,407,"bbq","s",null,null]],"02":[[169,232,381,329,"rug","n",null,null],[178,206,300,227,"rack","s",null,null],[322,217,356,253,"plant","s",null,null],[469,267,612,329,"table","n",null,"#5a3822"],[484,329,512,357,"chair","n",null,"#6a6b66"],[525,329,556,357,"chair","n",null,"#676863"],[566,329,597,357,"chair","n",null,"#696a65"],[484,239,512,267,"chair","s",null,"#89887f"],[525,239,556,267,"chair","s",null,"#88847e"],[566,239,597,267,"chair","s",null,"#898781"],[441,279,468,313,"chair","e",null,"#6e6c67"],[612,279,641,313,"chair","w",null,"#635f54"],[753,210,788,301,"bar","w",null,null],[728,251,753,279,"stool","e",null,null],[728,214,753,245,"stool","e",null,null],[853,248,906,276,"kitchen","n",["kitchenStoveElectric","kitchenCabinetDrawer"],null],[906,185,947,276,"kitchen","w",["kitchenSink","kitchenCabinetDrawer","kitchenCabinet"],null],[900,123,947,180,"fridge","w",null,null],[906,79,941,107,"washer","w",null,null],[906,35,941,73,"kitchen","w",["kitchenSink"],null],[175,32,312,167,"rug","s",null,null],[194,32,294,151,"bed","s",null,"#b3afa7"],[167,32,195,54,"night","s",null,null],[316,29,350,126,"wardrobe","w",null,null],[367,32,406,57,"vanity","s",null,null],[422,32,445,70,"wc","s",null,null],[459,32,515,119,"shower","w",null,null],[522,29,553,126,"wardrobe","e",null,null],[566,42,725,163,"rug","n",null,null],[597,63,700,192,"bed","n",null,"#a39991"],[561,160,594,188,"night","n",null,null],[700,160,733,188,"night","n",null,null],[756,151,778,192,"wc","n",null,null],[793,82,824,192,"vanity","w",null,null],[752,32,806,99,"shower","s",null,null],[44,229,94,279,"roundtable","n",null,null],[48,332,126,363,"bbq","n",null,null],[186,294,342,360,"sofa","n",null,"#3d332f"]],"04":[[2017,410,2229,507,"rug","s",null,null],[2098,512,2220,533,"rack","n",null,null],[2042,486,2076,522,"plant","n",null,null],[1786,410,1929,472,"table","s",null,"#b78450"],[1886,382,1914,410,"chair","s",null,"#766756"],[1842,382,1873,410,"chair","s",null,"#736353"],[1801,382,1832,410,"chair","s",null,"#655648"],[1886,472,1914,500,"chair","n",null,"#655445"],[1842,472,1873,500,"chair","n",null,"#665544"],[1801,472,1832,500,"chair","n",null,"#635a4d"],[1930,426,1957,460,"chair","w",null,"#59493b"],[1757,426,1786,460,"chair","e",null,"#644d37"],[1610,438,1645,529,"bar","e",null,null],[1645,460,1670,488,"stool","w",null,null],[1645,494,1670,525,"stool","w",null,null],[1492,463,1545,491,"kitchen","s",["kitchenCabinetDrawer","kitchenStoveElectric"],null],[1451,463,1492,554,"kitchen","e",["kitchenCabinet","kitchenCabinetDrawer","kitchenSink"],null],[1451,559,1498,616,"fridge","e",null,null],[1457,632,1492,660,"washer","e",null,null],[1457,666,1492,704,"kitchen","e",["kitchenSink"],null],[2086,572,2223,707,"rug","n",null,null],[2104,588,2204,707,"bed","n",null,"#cac5c1"],[2203,685,2231,707,"night","n",null,null],[2048,613,2082,710,"wardrobe","e",null,null],[1992,682,2031,707,"vanity","n",null,null],[1953,669,1976,707,"wc","n",null,null],[1883,620,1939,707,"shower","e",null,null],[1845,613,1876,710,"wardrobe","w",null,null],[1673,576,1832,697,"rug","s",null,null],[1698,547,1801,676,"bed","s",null,"#89807c"],[1804,551,1837,579,"night","s",null,null],[1665,551,1698,579,"night","s",null,null],[1620,547,1642,588,"wc","s",null,null],[1574,547,1605,657,"vanity","e",null,null],[1592,640,1646,707,"shower","n",null,null],[2304,460,2354,510,"roundtable","s",null,null],[2272,376,2350,407,"bbq","s",null,null],[2046,382,2214,444,"sofa","s",null,"#c4b5a2"]],"03":[[2017,232,2229,329,"rug","n",null,null],[2098,206,2220,227,"rack","s",null,null],[2042,217,2076,253,"plant","s",null,null],[1786,267,1929,329,"table","n",null,"#ffffff"],[1886,329,1914,357,"chair","n",null,"#5f5e5a"],[1842,329,1873,357,"chair","n",null,"#51504f"],[1801,329,1832,357,"chair","n",null,"#54514a"],[1886,239,1914,267,"chair","s",null,"#6a6a6a"],[1842,239,1873,267,"chair","s",null,"#646464"],[1801,239,1832,267,"chair","s",null,"#776f6b"],[1930,279,1957,313,"chair","w",null,"#7d7975"],[1757,279,1786,313,"chair","e",null,"#7d7975"],[1610,210,1645,301,"bar","e",null,null],[1645,251,1670,279,"stool","w",null,null],[1645,214,1670,245,"stool","w",null,null],[2086,32,2223,167,"rug","s",null,null],[2104,32,2204,151,"bed","s",null,"#d1cec9"],[2203,32,2231,54,"night","s",null,null],[2048,29,2082,126,"wardrobe","e",null,null],[1992,32,2031,57,"vanity","s",null,null],[1953,32,1976,70,"wc","s",null,null],[1883,32,1939,119,"shower","e",null,null],[1845,29,1876,126,"wardrobe","w",null,null],[1673,42,1832,163,"rug","n",null,null],[1698,63,1801,192,"bed","n",null,"#a3998f"],[1804,160,1837,188,"night","n",null,null],[1665,160,1698,188,"night","n",null,null],[1620,151,1642,192,"wc","n",null,null],[1574,82,1605,192,"vanity","e",null,null],[1592,32,1646,99,"shower","s",null,null],[2304,229,2354,279,"roundtable","n",null,null],[2272,332,2350,363,"bbq","n",null,null],[2045,328,2219,362,"sofa","n",null,"#887c62"],[2041,276,2103,328,"chaise","n",null,"#a7987c"],[1387,28,1428,275,"kitchen","e",["kitchenCabinetDrawer","kitchenCabinet","kitchenCabinet","kitchenSink","kitchenStoveElectric","kitchenCabinet"],null],[1516,122,1566,181,"fridge","w",null,null],[1528,34,1559,62,"kitchen","w",["kitchenSink"],null],[1530,80,1560,108,"washer","w",null,null]]};

  function furniture(id, H) {
    const g = new T.Group();
    (SPEC[id] || []).forEach(([ix0, iy0, ix1, iy1, type, facing, mods, col]) => {
      const [x0, y0] = fromImg(ix0, iy0), [x1, y1] = fromImg(ix1, iy1);
      const cx = (x0 + x1) / 2 * S, cz = (y0 + y1) / 2 * S, ns = facing === "n" || facing === "s";
      const w = (ns ? x1 - x0 : y1 - y0) * S, d = (ns ? y1 - y0 : x1 - x0) * S;
      // m\u00f3dulos v\u00eam na ordem do mundo (O\u2192L ou N\u2192S); converte para a ordem local
      const list = mods ? ((facing === "n" || facing === "e") ? mods.slice().reverse() : mods) : null;
      const grp = new T.Group();
      if (!NO_SHADOW[type]) contact(grp, w, d);
      (BUILD[type] || (() => {}))(grp, w, d, col, H, list);
      grp.rotation.y = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[facing];
      grp.position.set(cx, .02, cz); g.add(grp);
    });
    return g;
  }

  let photoTex = null;
  function photoFloor(x0, y0, x1, y1, base) {
    if (!photoTex) { photoTex = new T.TextureLoader().load(base + "pavimento-claro.webp"); photoTex.encoding = T.sRGBEncoding; photoTex.anisotropy = 8; }
    const geo = new T.PlaneGeometry((x1 - x0) * S, (y1 - y0) * S);
    const [u0, v0] = toImg(x0, y0), [u1, v1] = toImg(x1, y1), uv = geo.attributes.uv;
    const U = [u0, u1, u0, u1].map(u => u / IMG.w), V = [v0, v0, v1, v1].map(v => 1 - v / IMG.h);
    for (let i = 0; i < 4; i++) uv.setXY(i, U[i], V[i]);
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: photoTex, transparent: true, alphaTest: .5, roughness: .85, envMapIntensity: .25 }));
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2 * S, .005, (y0 + y1) / 2 * S); m.receiveShadow = true;
    return m;
  }

  function mirror(obj, mx, mz) {
    const w = new T.Group(); w.add(obj);
    obj.position.set(-AX * S, 0, -AZ * S); w.scale.set(mx ? -1 : 1, 1, mz ? -1 : 1);
    const o = new T.Group(); o.add(w); w.position.set(AX * S, 0, AZ * S); return o;
  }

  const APTO = {
    finals: { "01": [0, 0], "02": [0, 1], "03": [1, 1], "04": [1, 0] },
    labels: [
      ["Sacada", 165, 345], ["Living", 470, 190], ["Jantar", 1055, 140], ["Cozinha", 1830, 130], ["Churrasqueira", 175, 130],
      ["Dormit\u00f3rio", 410, 530], ["Su\u00edte", 1350, 690], ["Banho", 800, 600], ["Banho su\u00edte", 1600, 560], ["Lavanderia", 1910, 600],
    ],
    async build(kind, H, base) {
      initMats(); await loadModels();
      const root = new T.Group(), labels = [];
      const addApt = (id) => {
        const [mx, mz] = APTO.finals[id];
        root.add(mirror(apartment(H, id === "03"), mx, mz));
        root.add(furniture(id, H));
        ((window.SAFIRA_ROOMS || {})[id] || []).forEach(r => {
          const [tx, ty] = fromImg(r.c[0], r.c[1]);
          labels.push({ text: `${r.n} \u00b7 ${r.a} m\u00b2`, pos: new T.Vector3(tx * S, .15, ty * S), apt: id });
        });
      };
      if (kind === "pav") {
        ["01", "02", "03", "04"].forEach(addApt);
        rect(root, 1975, -168, 2977, 560, -.3, .3, MAT.slab);
        root.add(photoFloor(1975, -168, 2977, 560, base || "img/"));     // hall, elevador e escada (foto da planta)
      } else addApt(kind);
      const box = new T.Box3().setFromObject(root), c = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
      root.position.set(-c.x, 0, -c.z); labels.forEach(l => { l.pos.x -= c.x; l.pos.z -= c.z; });
      return { group: root, size, labels: kind === "pav" ? [] : labels };
    },
  };
  window.APTO3D = APTO;
})();
