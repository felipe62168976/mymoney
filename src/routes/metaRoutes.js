const router = require('express').Router();
const ctrl = require('../controllers/metaController');

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.post('/:id/depositar', ctrl.depositar);
router.delete('/:id', ctrl.excluir);

module.exports = router;
