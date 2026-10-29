/* Projetos FICTÍCIOS para o carrossel da seção Projetos (SqueezeCarousel).
   Casas, escritórios, datas e áreas são inventados; as imagens são ilustrativas. */
(() => {
  const img = (id) => `https://images.unsplash.com/${id}?w=1400&q=70&auto=format&fit=crop`;
  window.PROJETOS_DEMO = [
    {
      nome: 'Casa Jatobá',
      titulo: 'Sobrado com laje em balanço sobre a área da piscina.',
      descricao: 'O beiral de madeira faz sombra na sala de estar no verão e deixa o sol entrar no inverno.',
      area: '620 m²', cidade: 'Goiânia', situacao: 'Entregue · nov 2025', arquitetura: 'Vão Arquitetura',
      image: img('photo-1613490493576-7fde63acd811'),
      alt: 'Sobrado branco com forro de madeira no beiral e piscina em frente',
    },
    {
      nome: 'Casa Aroeira',
      titulo: 'Volume de madeira e fachada escura voltada para o jardim.',
      descricao: 'Esquadrias do piso ao teto e brises de madeira no pavimento superior.',
      area: '380 m²', cidade: 'Aparecida de Goiânia', situacao: 'Entregue · mar 2026', arquitetura: 'Atelier Seriema',
      image: img('photo-1600566753190-17f0baa2a6c3'),
      alt: 'Casa contemporânea com volume revestido de madeira e fachada preta',
    },
    {
      nome: 'Casa Ipê',
      titulo: 'Sobrado com volume de madeira e pé-direito duplo na sala.',
      descricao: 'Em obra: a alvenaria do pavimento superior fecha nesta semana. Diário toda sexta.',
      area: '460 m²', cidade: 'Goiânia', situacao: 'Em obra · Alvenaria', arquitetura: 'Estúdio Taipa',
      image: img('photo-1600047509807-ba8f99d2cdde'),
      alt: 'Casa branca com volume revestido de madeira e grandes janelas',
    },
    {
      nome: 'Casa Buriti',
      titulo: 'Fachada em placas escuras e ripado de madeira na entrada.',
      descricao: 'Estrutura concluída; a cobertura começa no próximo mês.',
      area: '340 m²', cidade: 'Senador Canedo', situacao: 'Em obra · Estrutura', arquitetura: 'Estúdio Cobogó',
      image: img('photo-1600585154526-990dced4db0d'),
      alt: 'Casa de fachada escura com ripado de madeira iluminado ao entardecer',
    },
    {
      nome: 'Casa Pequi',
      titulo: 'Casa térrea em L abraçando a piscina.',
      descricao: 'Planta compacta, com todos os quartos voltados para o nascente.',
      area: '300 m²', cidade: 'Trindade', situacao: 'Entregue · jul 2025', arquitetura: 'Estúdio Taipa',
      image: img('photo-1512917774080-9991f1c4c750'),
      alt: 'Casa térrea branca com grandes portas de vidro abertas para a piscina',
    },
    {
      nome: 'Casa Baru',
      titulo: 'Dois pavimentos em balanço, com terraço sobre a garagem.',
      descricao: 'Estudo do lote concluído; projeto em aprovação no condomínio.',
      area: '520 m²', cidade: 'Goiânia', situacao: 'Aprovações', arquitetura: 'Atelier Seriema',
      image: img('photo-1580587771525-78b9dba3b914'),
      alt: 'Casa moderna de dois pavimentos em balanço com piscina no jardim',
    },
    {
      nome: 'Casa Cagaita',
      titulo: 'Sobrado branco com guarda-corpos de vidro.',
      descricao: 'Orçamento executivo fechado por etapa; obra começa após as aprovações.',
      area: '700 m²', cidade: 'Goiânia', situacao: 'Orçamento e contrato', arquitetura: 'Vão Arquitetura',
      image: img('photo-1602343168117-bb8ffe3e2e9f'),
      alt: 'Sobrado branco com guarda-corpos de vidro e piscina',
    },
  ];
})();
