/* Dados FICTÍCIOS de demonstração do painel da obra (SitePanelDemo).
   Nenhum valor aqui representa obra, cliente ou preço real. */
window.PAINEL_DEMO = {
  obra: 'Casa Ipê',
  diario: 'Diário de sexta, 23 out 2026',
  semana: 18,
  semanas: 40,
  etapaAtual: 'Alvenaria',
  proximaSemana: [
    'Fechar a alvenaria do pavimento superior',
    'Montar a forma da laje de cobertura',
    'Passar eletrodutos nas paredes do térreo',
  ],
  etapas: [
    { nome: 'Serviços preliminares', pct: 100 },
    { nome: 'Fundação', pct: 100 },
    { nome: 'Estrutura', pct: 100 },
    { nome: 'Alvenaria', pct: 72 },
    { nome: 'Instalações', pct: 20 },
    { nome: 'Cobertura', pct: 15 },
    { nome: 'Esquadrias', pct: 0 },
    { nome: 'Revestimentos', pct: 0 },
    { nome: 'Acabamentos', pct: 0 },
  ],
  fotos: [
    { src: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=640&q=65&auto=format&fit=crop', alt: 'Parede de tijolos em construção em um ambiente interno', data: '23 out 2026', legenda: 'Alvenaria do pavimento superior' },
    { src: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=640&q=65&auto=format&fit=crop', alt: 'Eletricista de capacete instalando caixa elétrica', data: '23 out 2026', legenda: 'Caixas elétricas do térreo' },
    { src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=640&q=65&auto=format&fit=crop', alt: 'Operários montando armação de aço', data: '16 out 2026', legenda: 'Armação das vigas' },
    { src: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=640&q=65&auto=format&fit=crop', alt: 'Laje com armação vista de cima, com equipe ao lado', data: '9 out 2026', legenda: 'Preparação da laje' },
  ],
  fechado: {
    parcelasPagas: 7,
    parcelasTotal: 18,
    proximaParcela: 'A parcela 8 é liberada com a conclusão da alvenaria.',
  },
  administracao: {
    previsto: 1840000,
    realizado: 742380,
    taxa: 0.12,
    compras: [
      { data: '22 out', item: 'Blocos cerâmicos — 6.000 un.', nf: 'NF 004512', valor: 14820 },
      { data: '21 out', item: 'Argamassa — 180 sacos', nf: 'NF 118733', valor: 6120 },
      { data: '17 out', item: 'Eletrodutos e caixas', nf: 'NF 052201', valor: 3984.5 },
      { data: '14 out', item: 'Aço CA-50 — 2,1 t', nf: 'NF 330918', valor: 16380 },
    ],
  },
};
