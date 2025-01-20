const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');

router.get('/check-admin', userController.checkAdmin);

module.exports = router;
