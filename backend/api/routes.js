import express from 'express'
import * as controller from './controller.js'

const router = express.Router();

router.get("/login", controller.login);
router.post("/register", controller.register);

router.get("/getunread", controller.getUnread);
router.get("/getSource", controller.getSource);

router.post("/answer", controller.answer);
router.get("/generateanswer", controller.generateAnswer);

router.get("/tweak", controller.tweak);

export { router }


