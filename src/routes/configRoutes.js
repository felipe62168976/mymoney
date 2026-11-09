const router = require('express').Router();
const ctrl = require('../controllers/configController');

router.get('/categorias', ctrl.listarCategorias);
router.post('/categorias', ctrl.criarCategoria);
router.delete('/categorias/:id', ctrl.excluirCategoria);
router.put('/perfil', ctrl.atualizarPerfil);
router.put('/senha', ctrl.alterarSenha);

module.exports = router;
