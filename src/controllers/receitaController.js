const criarController = require('./movimentoFactory');

module.exports = criarController({
  tabela: 'receitas',
  tipo: 'receita',
  rotulo: 'Receita',
  formas: ['Dinheiro', 'PIX', 'Transferência', 'Depósito', 'Cheque', 'Outro'],
});
