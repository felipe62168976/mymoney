const criarController = require('./movimentoFactory');

module.exports = criarController({
  tabela: 'despesas',
  tipo: 'despesa',
  rotulo: 'Despesa',
  formas: ['Dinheiro', 'PIX', 'Cartão de crédito', 'Cartão de débito', 'Boleto', 'Transferência', 'Outro'],
});
