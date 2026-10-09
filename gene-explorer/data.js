/* Lattice prototype — fictional data. Real gene symbols, invented numbers. No client data. */
(function () {
  const rng = (seed) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };
  const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  const CATS = [
    { id: 'gen', name: 'Genetics', color: '#3fb9d8', dark: '#168aa6' },
    { id: 'exp', name: 'Expression', color: '#f2a33a', dark: '#c97a0c' },
    { id: 'prot', name: 'Proteomics', color: '#9488e0', dark: '#6a5cc4' },
    { id: 'net', name: 'Pathways & network', color: '#56c49b', dark: '#2f9a73' },
    { id: 'tract', name: 'Tractability', color: '#6d7699', dark: '#464e70' },
  ];
  const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));

  const AXES = [
    { id: 'gen', name: 'Genetic association', cat: 'gen' },
    { id: 'rare', name: 'Rare variants', cat: 'gen' },
    { id: 'expr', name: 'Tissue expression', cat: 'exp' },
    { id: 'cell', name: 'Cell-type specificity', cat: 'exp' },
    { id: 'prot', name: 'Proteomics', cat: 'prot' },
    { id: 'net', name: 'Network & function', cat: 'net' },
    { id: 'lit', name: 'Literature', cat: 'net' },
    { id: 'tract', name: 'Tractability', cat: 'tract' },
  ];
  const AXI = Object.fromEntries(AXES.map((a, i) => [a.id, i]));

  const COLS = [];
  const add = (cat, axis, names, prefix) => names.forEach((n) => COLS.push({ cat, axis, name: (prefix ? prefix + ' · ' : '') + n }));
  add('gen', 'gen', ['LDL-C', 'HDL-C', 'Triglycerides', 'Coronary artery disease', 'Type 2 diabetes', 'BMI', 'eGFR', 'ALT'], 'GWAS');
  add('gen', 'rare', ['Loss-of-function burden', 'Missense burden', 'Exome-wide association'], 'Rare variants');
  add('gen', 'gen', ['Mendelian randomisation', 'Colocalisation (eQTL)'], '');
  COLS.splice(COLS.length - 2, 2, { cat: 'gen', axis: 'gen', name: 'Mendelian randomisation' }, { cat: 'gen', axis: 'gen', name: 'Colocalisation' });
  add('exp', 'expr', ['Liver', 'Adipose', 'Whole blood', 'Kidney', 'Heart LV', 'Pancreas'], 'eQTL');
  add('exp', 'expr', ['MASH vs control', 'T2D vs control', 'CAD vs control'], 'Diff. expression');
  add('exp', 'cell', ['Hepatocyte', 'Macrophage', 'Endothelial'], 'Specificity');
  add('prot', 'prot', ['Plasma', 'Liver'], 'pQTL');
  add('prot', 'prot', ['Plasma', 'Tissue'], 'Abundance');
  add('prot', 'prot', ['PTM evidence', 'Interactome degree', 'Cis-pQTL colocalisation', 'Protein stability'], '');
  COLS.splice(COLS.length - 4, 4,
    { cat: 'prot', axis: 'prot', name: 'PTM evidence' }, { cat: 'prot', axis: 'prot', name: 'Interactome degree' },
    { cat: 'prot', axis: 'prot', name: 'Cis-pQTL colocalisation' }, { cat: 'prot', axis: 'prot', name: 'Protein stability' });
  add('net', 'net', ['Reactome enrichment', 'KEGG enrichment', 'GO biological process', 'Co-expression module', 'PPI centrality', 'Perturb-seq effect', 'CRISPR · lipid uptake', 'CRISPR · fitness', 'Mouse knockout phenotype'], '');
  COLS.splice(COLS.length - 9, 9, ...['Reactome enrichment', 'KEGG enrichment', 'GO biological process', 'Co-expression module', 'PPI centrality', 'Perturb-seq effect', 'CRISPR · lipid uptake', 'CRISPR · fitness', 'Mouse knockout phenotype'].map((n) => ({ cat: 'net', axis: 'net', name: n })));
  COLS.push({ cat: 'net', axis: 'lit', name: 'Literature co-mention' });
  ['Small-molecule tractable', 'Antibody tractable', 'Known drug', 'Clinical stage', 'Ligandability', 'Safety liability', 'Essentiality', 'Off-target risk'].forEach((n) => COLS.push({ cat: 'tract', axis: 'tract', name: n }));
  COLS.forEach((c) => (c.ai = AXI[c.axis]));

  /* ---------- gene pool ---------- */
  const REAL = `PCSK9 LDLR APOB APOE APOA1 APOC3 APOA5 ANGPTL3 ANGPTL4 ANGPTL8 LPL LIPC LIPG CETP LCAT ABCA1 ABCG1 ABCG5 ABCG8 NPC1L1 HMGCR HMGCS1 SREBF1 SREBF2 SCAP INSIG1 INSIG2 MBTPS1 MBTPS2 LDLRAP1 MYLIP SORT1 TM6SF2 PNPLA3 MBOAT7 GCKR HSD17B13 MARC1 CIDEB DGAT1 DGAT2 FASN ACACA ACACB SCD ELOVL6 PPARA PPARG PPARD RXRA NR1H3 NR1H2 NR1H4 FGF19 FGF21 FGFR4 KLB CYP7A1 CYP8B1 CYP27A1 SLC10A1 SLC10A2 SLC51A SLCO1B1 SLCO1B3 ABCB11 ABCC2 GPBAR1 INS INSR IRS1 IRS2 AKT1 AKT2 PIK3CA PIK3R1 PTEN FOXO1 GCK SLC2A2 SLC2A4 G6PC PCK1 PCK2 GLP1R GIPR GCG DPP4 TCF7L2 KCNJ11 ABCC8 HNF1A HNF1B HNF4A PDX1 NEUROD1 MAFA SLC30A8 CDKAL1 CDKN2A CDKN2B IGF2BP2 JAZF1 THADA PROX1 ADCY5 MTNR1B FTO MC4R LEPR LEP POMC AGRP NPY SIM1 BDNF PCSK1 GNAS UCP1 PRDM16 PPARGC1A CIDEA ADIPOQ ADIPOR1 ADIPOR2 RETN CFD PLIN1 PLIN2 LIPE PNPLA2 ABHD5 CD36 FABP4 FABP1 FABP5 CPT1A CPT1B CPT2 ACADM ACADL ACADVL HADHA HADHB ECHS1 ACOX1 EHHADH PEX19 PEX5 CAT SOD1 SOD2 GPX1 GPX4 NFE2L2 KEAP1 HMOX1 NQO1 TXN TXNRD1 C3 C5 C1QA C1QB C1QC CFB CFH CFI CD55 CD59 SERPING1 NLRP3 NLRP1 PYCARD CASP1 IL1B IL18 IL6 IL6R IL6ST TNF TNFRSF1A IFNG IFNGR1 JAK1 JAK2 STAT3 STAT1 NFKB1 RELA IKBKB TLR4 MYD88 IRAK4 CCL2 CCR2 CX3CR1 TREM2 LGALS3 CD68 MARCO MSR1 SCARB1 OLR1 LRP1 LRP6 VLDLR TGFB1 TGFBR1 TGFBR2 SMAD2 SMAD3 SMAD4 COL1A1 COL1A2 COL3A1 ACTA2 PDGFRB LOX LOXL2 TIMP1 MMP2 MMP9 CTGF SERPINE1 F2 F7 F8 F9 F10 F11 F12 FGA FGB FGG VWF PLG ITGA2B ITGB3 P2RY12 GP6 KCNQ1 KCNH2 SCN5A KCNE1 RYR2 CACNA1C ATP2A2 PLN MYH7 MYBPC3 TNNT2 TTN LMNA NOS3 VEGFA KDR FLT1 ANGPT1 TEK NOTCH1 NOTCH3 DLL4 JAG1 WNT3A CTNNB1 APC GSK3B LRP5 SOST DKK1 TFRC FTH1 FTL HAMP HFE SLC40A1 SLC11A2 TMPRSS6 BMP6 SMPD1 SPTLC1 SPTLC2 CERS2 CERS6 DEGS1 UGCG SGMS1 ASAH1 ATF6 ERN1 EIF2AK3 XBP1 DDIT3 HSPA5 CALR ULK1 ATG5 ATG7 BECN1 MAP1LC3B SQSTM1 MTOR RPTOR TSC2 PRKAA1 PRKAA2 PRKAB1 STK11 SIRT1 SIRT3 CLOCK ARNTL PER2 CRY1 NR1D1 RORA CYP2C9 CYP3A4 CYP2E1 UGT1A1 ALB TTR SERPINA1 AGT REN ACE AGTR1 NR3C2 SCNN1A SLC12A1 SLC12A3 SLC22A2 SLC22A6 SLC5A2 SLC34A1 UMOD PKD1 PKD2 NPHS1 NPHS2 CUBN LRP2 OSR1`.split(/\s+/);
  const POOL = [...new Set(REAL)];
  const famous = new Set(POOL.slice(0, 70));
  (function extra() {
    const r = rng(77);
    const fam = ['SLC22A', 'SLC25A', 'SLC16A', 'CYP4F', 'KLF', 'ZNF', 'TMEM', 'CCDC', 'ARHGEF', 'RAB', 'ABHD', 'ACSL', 'AKR1C', 'GPR', 'HSD17B', 'FAM', 'LINC', 'PRKC', 'MAP3K', 'DUSP', 'SLC35A', 'CYP2', 'ZBTB', 'PLEKH', 'LRRC', 'KIAA', 'C1orf', 'SPATA', 'TBC1D'];
    const seen = new Set(POOL);
    while (POOL.length < 2400) {
      const s = fam[Math.floor(r() * fam.length)] + (1 + Math.floor(r() * 950));
      if (!seen.has(s)) { seen.add(s); POOL.push(s); }
    }
  })();

  /* ---------- genes ---------- */
  const GENES = {};
  POOL.forEach((sym, idx) => {
    const r = rng(hash(sym));
    const f = famous.has(sym);
    const lat = CATS.map((c) => {
      let v = Math.pow(r(), 1.25);
      if (f && (c.id === 'gen' || c.id === 'tract')) v = 0.35 + v * 0.65;
      return v;
    });
    const lit = f ? 0.65 + r() * 0.35 : Math.pow(r(), 1.8);
    const cells = COLS.map((col) => {
      const ci = CATS.findIndex((c) => c.id === col.cat);
      const st = col.axis === 'lit' ? lit : lat[ci];
      if (r() > 0.18 + 0.78 * st) return null;
      const mag = clamp(st * 0.55 + r() * 0.5 + 0.05);
      const dir = col.cat === 'tract' ? (r() < 0.9 ? 1 : -1) : r() < 0.62 ? 1 : -1;
      return [mag, dir, mag > 0.52 ? 1 : 0];
    });
    const ax = AXES.map((a, i) => {
      const idxs = COLS.map((c, k) => (c.ai === i ? k : -1)).filter((k) => k >= 0);
      return clamp((idxs.reduce((s, k) => s + (cells[k] ? cells[k][0] : 0), 0) / idxs.length) * 1.2);
    });
    const catScore = CATS.map((c) => {
      const is = AXES.map((a, i) => (a.cat === c.id ? i : -1)).filter((i) => i >= 0);
      return is.reduce((s, i) => s + ax[i], 0) / is.length;
    });
    GENES[sym] = { sym, lat, lit, cells, ax, catScore, groups: [] };
  });

  /* ---------- therapeutic areas, diseases, papers (all fictional) ---------- */
  const AREAS = [
    { id: 'cv', name: 'Cardiovascular', diseases: ['Coronary artery disease', 'Atrial fibrillation', 'Heart failure', 'Hypertension'] },
    { id: 'meta', name: 'Diabetes & metabolism', diseases: ['Type 2 diabetes', 'MASH / fatty liver', 'Obesity', 'Dyslipidaemia'] },
    { id: 'onc', name: 'Oncology', diseases: ['Colorectal cancer', 'Breast cancer', 'Hepatocellular carcinoma', 'Lung adenocarcinoma'] },
    { id: 'kid', name: 'Kidney', diseases: ['Chronic kidney disease', 'Diabetic nephropathy', 'Polycystic kidney disease'] },
    { id: 'neu', name: 'Neurology', diseases: ['Alzheimer’s disease', 'Parkinson’s disease', 'Multiple sclerosis'] },
    { id: 'imm', name: 'Immunology', diseases: ['Rheumatoid arthritis', 'Crohn’s disease', 'Psoriasis'] },
  ];
  const DIS = {};
  const REALSET = new Set(REAL);
  AREAS.forEach((a) => {
    a.diseases = a.diseases.map((name) => {
      const id = a.id + '-' + hash(name).toString(36);
      const r = rng(hash(name) + 5);
      const theme = CATS.map(() => 0.25 + r() * 0.75);
      const known = POOL.filter((s) => REALSET.has(s)).map((sym) => ({ sym, a: GENES[sym].lat.reduce((s, v, i) => s + v * theme[i], 0) + (famous.has(sym) ? 0.5 : 0) + r() * 1.1 }))
        .sort((x, y) => y.a - x.a).slice(0, 64).map((x) => x.sym);
      return (DIS[id] = { id, name, area: a.id, known, papers: [] });
    });
  });
  const SURN = ['Lindqvist', 'Okafor', 'Marchetti', 'Tanaka', 'Novak', 'Haddad', 'Silva', 'Brandt', 'Kowalski', 'Mukherjee', 'Fontaine', 'Abara', 'Petrov', 'Yilmaz', 'Duarte', 'Nakamura'];
  const JOUR = ['Journal of Genomic Medicine', 'Translational Genetics Review', 'Human Variation Letters', 'Systems Biology of Disease', 'Annals of Functional Genomics'];
  const TYPES = [
    { name: 'GWAS', t: (d, n, k) => `Genome-wide meta-analysis of ${d} in ${n.toLocaleString()} individuals identifies ${k} risk loci` },
    { name: 'GWAS', t: (d, n) => `Multi-ancestry association study of ${d} across ${n.toLocaleString()} participants` },
    { name: 'Rare variants', t: (d, n) => `Exome sequencing of ${n.toLocaleString()} cases reveals rare coding variants in ${d}` },
    { name: 'Rare variants', t: (d) => `Gene-burden analysis of loss-of-function variants and ${d} risk` },
    { name: 'Functional screen', t: (d) => `Genome-scale CRISPR screen identifies regulators of cell state in ${d}` },
    { name: 'Single-cell', t: (d) => `A single-cell atlas of disease-relevant tissue in ${d}` },
    { name: 'Proteomics', t: (d) => `Mendelian randomisation of plasma proteins and ${d} risk` },
  ];
  Object.values(DIS).forEach((d) => {
    const r = rng(hash(d.id) + 11);
    const n = 8 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const ty = TYPES[Math.floor(r() * TYPES.length)];
      const size = 4 + Math.floor(r() * 14);
      const genes = [...new Set(Array.from({ length: size }, () => d.known[Math.floor(Math.pow(r(), 1.5) * d.known.length)]))];
      const samples = Math.round((15 + r() * 480) * 200) * 5;
      d.papers.push({ id: d.id + '-p' + i, title: ty.t(d.name.toLowerCase(), samples, genes.length), type: ty.name, authors: SURN[Math.floor(r() * SURN.length)] + ' et al.', journal: JOUR[Math.floor(r() * JOUR.length)], year: 2016 + Math.floor(r() * 10), cites: Math.floor(Math.pow(r(), 2) * 900), genes });
    }
    d.papers.sort((a, b) => b.genes.length - a.genes.length);
    d.papers.forEach((p, i) => (p.recommended = i < 3));
  });

  /* ---------- the fixed gene-group universe (same for everyone, independent of any investigation) ---------- */
  const LABELS = ['Lipid transport', 'Bile acid metabolism', 'Insulin signalling', 'Inflammatory response', 'Extracellular matrix', 'Ion channel activity', 'Mitochondrial respiration', 'Cell-cycle control', 'Wnt signalling', 'Complement cascade', 'Ubiquitin ligase complex', 'Glycosylation', 'Autophagy', 'Cytoskeleton organisation', 'Solute transport', 'Transcriptional regulation', 'Cytokine signalling', 'Lipid biosynthesis', 'Oxidative stress response', 'Angiogenesis', 'Iron homeostasis', 'Kinase cascade', 'Nuclear receptor signalling', 'Peroxisome function'];
  const SMALL = [5, 6, 8, 9, 12, 14, 17, 21, 24, 29, 31, 38, 43, 52, 58, 67, 76, 85, 89, 94];
  const UNIVERSE = (function () {
    const r = rng(20261006), used = new Set(), out = [];
    while (out.length < 240) {
      const num = 1 + Math.floor(r() * 99999);
      if (used.has(num)) continue; used.add(num);
      const theme = CATS.map(() => 0.1 + r() * 0.9);
      const size = r() < 0.7 ? 100 : SMALL[Math.floor(r() * SMALL.length)];
      const members = POOL.map((sym) => { const l = GENES[sym].lat, tot = l.reduce((s, v) => s + v, 0) + 0.01; return { sym, a: (0.9 * l.reduce((s, v, i) => s + v * theme[i], 0)) / tot + (0.18 * tot) / 5 + r() * 0.75 }; })
        .sort((a, b) => b.a - a.a).slice(0, size).map((x) => x.sym);
      out.push({ id: 'G' + String(num).padStart(6, '0'), num, size, members, cohesion: clamp(0.4 + r() * 0.55), seed: out.length, label: LABELS[Math.floor(r() * LABELS.length)] });
    }
    out.sort((a, b) => a.num - b.num);
    return out;
  })();
  const GBYID = Object.fromEntries(UNIVERSE.map((g) => [g.id, g]));
  const GENEGROUPS = {};
  UNIVERSE.forEach((g) => g.members.forEach((m) => (GENEGROUPS[m] = GENEGROUPS[m] || []).push(g.id)));

  /* interaction edges: fixed per group (cheap), layout only computed on demand */
  function edgesOf(g) {
    if (g.edges) return g;
    const r = rng(500 + g.seed * 13), n = g.members.length, edges = [], k = g.cohesion * 2.2 + 0.7;
    for (let i = 0; i < n; i++) {
      const cnt = Math.max(1, Math.round(k * (0.4 + r())));
      for (let j = 0; j < cnt; j++) { let t = Math.floor(Math.pow(r(), 1.6) * n); if (t === i) t = (t + 1) % n; edges.push([i, t, 0.3 + r() * 0.7]); }
    }
    g.adj = g.members.map(() => []);
    edges.forEach(([a, b, s]) => { g.adj[a].push([b, s]); g.adj[b].push([a, s]); });
    g.idx = Object.fromEntries(g.members.map((m, i) => [m, i]));
    g.edges = edges; return g;
  }
  function layoutOf(g) {
    if (g.layout) return g.layout;
    edgesOf(g);
    const r = rng(900 + g.seed), n = g.members.length, W = 760, H = 470, edges = g.edges;
    const pos = g.members.map((_, i) => { const a = (i / n) * Math.PI * 2, rr = 120 + r() * 80; return [W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr * 0.7, 0, 0]; });
    const area = n < 10 ? 0.55 : 1;
    for (let it = 0; it < 240; it++) {
      for (let i = 0; i < n; i++) { pos[i][2] = 0; pos[i][3] = 0; }
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1]; const d2 = dx * dx + dy * dy + 0.01, d = Math.sqrt(d2), f = (1500 * area) / d2;
        pos[i][2] += (dx / d) * f; pos[i][3] += (dy / d) * f; pos[j][2] -= (dx / d) * f; pos[j][3] -= (dy / d) * f;
      }
      edges.forEach(([a, b, s]) => { const dx = pos[b][0] - pos[a][0], dy = pos[b][1] - pos[a][1]; const d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = (d - 40) * 0.02 * (0.5 + s); pos[a][2] += (dx / d) * f; pos[a][3] += (dy / d) * f; pos[b][2] -= (dx / d) * f; pos[b][3] -= (dy / d) * f; });
      for (let i = 0; i < n; i++) {
        pos[i][2] += (W / 2 - pos[i][0]) * 0.012; pos[i][3] += (H / 2 - pos[i][1]) * 0.016;
        pos[i][0] = clamp(pos[i][0] + clamp(pos[i][2], -12, 12), 24, W - 24); pos[i][1] = clamp(pos[i][1] + clamp(pos[i][3], -12, 12), 24, H - 24);
      }
    }
    return (g.layout = { W, H, pos });
  }

  /* ---------- investigation context: what the chosen papers say about which genes are known ---------- */
  const ctxCache = {};
  function context(inv) {
    const dis = DIS[inv.disease];
    const papers = dis ? dis.papers.filter((x) => inv.papers.includes(x.id)) : [];
    const key = (inv.disease || '') + '|' + papers.map((x) => x.id).sort().join(',');
    if (ctxCache[key]) return ctxCache[key];
    const K = new Map();
    papers.forEach((p) => p.genes.forEach((s) => K.set(s, (K.get(s) || 0) + 1)));
    const effCache = {};
    const ctx = { key, papers, K, disease: dis };
    /* disease-specific view of a gene: genetics comes from the papers (high if known, low if not) */
    ctx.eff = (sym) => {
      if (effCache[sym]) return effCache[sym];
      const ge = GENES[sym], c = K.get(sym) || 0;
      const cells = ge.cells.map((cell, i) => {
        if (COLS[i].axis !== 'gen') return cell;
        if (c) return [clamp(0.6 + 0.08 * c + (cell ? cell[0] * 0.2 : 0)), 1, 1];
        return cell ? [cell[0] * 0.5, cell[1], cell[0] * 0.5 > 0.5 ? 1 : 0] : null;
      });
      const ax = AXES.map((_, i) => { const ix = COLS.map((x, k) => (x.ai === i ? k : -1)).filter((k) => k >= 0); return clamp((ix.reduce((s, k) => s + (cells[k] ? cells[k][0] : 0), 0) / ix.length) * 1.2); });
      const catScore = CATS.map((cc) => { const is = AXES.map((a, i) => (a.cat === cc.id ? i : -1)).filter((i) => i >= 0); return is.reduce((s, i) => s + ax[i], 0) / is.length; });
      return (effCache[sym] = { cells, ax, catScore, known: c });
    };
    const N = POOL.length;
    const rows = UNIVERSE.map((g) => {
      const known = g.members.filter((m) => K.has(m));
      const exp = (g.size * K.size) / N;
      const prof = AXES.map((_, i) => g.members.reduce((s, m) => s + ctx.eff(m).ax[i], 0) / g.size);
      const catMean = CATS.map((c) => { const is = AXES.map((a, i) => (a.cat === c.id ? i : -1)).filter((i) => i >= 0); return is.reduce((s, i) => s + prof[i], 0) / is.length; });
      return { id: g.id, g, size: g.size, label: g.label, cohesion: g.cohesion, members: g.members, known, nK: known.length, exp, enr: exp ? known.length / exp : 0, z: (known.length - exp) / Math.sqrt(exp + 0.01), prof, catMean,
        tractable: g.members.filter((m) => ctx.eff(m).ax[AXI.tract] > 0.5).length,
        novel: g.members.filter((m) => !K.has(m) && GENES[m].lit < 0.3 && ctx.eff(m).ax[AXI.gen] > 0.3).length };
    });
    const gm = CATS.map((_, i) => rows.reduce((a, g) => a + g.catMean[i], 0) / rows.length);
    const sd = CATS.map((_, i) => Math.sqrt(rows.reduce((a, g) => a + (g.catMean[i] - gm[i]) ** 2, 0) / rows.length) || 1);
    const am = AXES.map((_, i) => rows.reduce((a, g) => a + g.prof[i], 0) / rows.length);
    const asd = AXES.map((_, i) => Math.sqrt(rows.reduce((a, g) => a + (g.prof[i] - am[i]) ** 2, 0) / rows.length) || 1);
    rows.forEach((g) => {
      const z = g.catMean.map((v, i) => (v - gm[i]) / sd[i]); g.dom = CATS[z.indexOf(Math.max(...z))].id;
      const o = g.prof.map((v, i) => [(v - am[i]) / asd[i], i]).sort((a, b) => b[0] - a[0]); g.top = [o[0][1], o[1][1]];
    });
    ctx.rows = rows; ctx.by = Object.fromEntries(rows.map((r) => [r.id, r])); ctx.avg = am;
    /* closeness of a gene to the known genes in a group (1 = is known, else best interaction strength) */
    ctx.prox = (row, sym) => {
      if (K.has(sym)) return 1;
      const g = edgesOf(row.g); row.px = row.px || {}; if (row.px[sym] != null) return row.px[sym];
      const i = g.idx[sym]; let best = 0.12;
      g.adj[i].forEach(([j, s]) => { if (K.has(g.members[j])) best = Math.max(best, s); else g.adj[j].forEach(([k, s2]) => { if (K.has(g.members[k])) best = Math.max(best, s * s2 * 0.7); }); });
      return (row.px[sym] = best);
    };
    ctx.closest = (row, sym) => { const g = edgesOf(row.g), i = g.idx[sym]; return g.adj[i].filter(([j]) => K.has(g.members[j])).sort((a, b) => b[1] - a[1]).map(([j, s]) => [g.members[j], s]); };
    ctxCache[key] = ctx; return ctx;
  }
  function rescore(ctx, w) {
    const R = ctx.rows;
    const ev = R.map((g) => { let num = 0, den = 0; AXES.forEach((a, i) => { num += w[a.cat] * g.prof[i]; den += w[a.cat]; }); return (num / (den || 1)) * (0.78 + 0.22 * g.size / 100); });
    const px = R.map((g) => { const v = g.members.filter((m) => !ctx.K.has(m)).map((m) => ctx.prox(g, m)).sort((a, b) => b - a).slice(0, 10); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; });
    const mm = (arr) => { const lo = Math.min(...arr), hi = Math.max(...arr); return arr.map((v) => (v - lo) / (hi - lo || 1)); };
    const z = mm(R.map((g) => g.z)), e = mm(ev), c = mm(R.map((g) => g.cohesion)), p = mm(px);
    R.forEach((g, i) => { g.score = Math.round(38 + 59 * (0.45 * z[i] + 0.25 * e[i] + 0.15 * c[i] + 0.15 * p[i])); });
    [...R].sort((a, b) => b.score - a.score).forEach((g, i) => (g.rank = i + 1));
  }
  function geneScore(ctx, sym, w) { const e = ctx.eff(sym); let num = 0, den = 0; CATS.forEach((c, i) => { num += w[c.id] * e.catScore[i]; den += w[c.id]; }); return num / (den || 1); }
  /* overall gene score in a group: weighted evidence (genetics from the papers) plus closeness to known genes */
  const gscore = (ctx, row, sym, w) => 0.62 * clamp(geneScore(ctx, sym, w) * 1.35) + 0.38 * ctx.prox(row, sym);
  const WHY = (ctx, g) => {
    const [a, b] = g.top.map((i) => AXES[i].name.toLowerCase());
    return `${g.nK} known gene${g.nK === 1 ? '' : 's'} (${g.enr ? g.enr.toFixed(1) : '0'}× expected); strong ${a} and ${b}.`;
  };
  const SIZE_NOTE = (g) => (g.size === 100 ? 'Capped at 100 genes' : g.size + ' genes');

  window.DB = { CATS, CAT, AXES, AXI, COLS, GENES, AREAS, DIS, POOL, UNIVERSE, GBYID, GENEGROUPS, context, rescore, geneScore, gscore, edgesOf, layoutOf, WHY, SIZE_NOTE, clamp, hash, rng };
})();
