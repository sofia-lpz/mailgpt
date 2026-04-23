import express from 'express'
import * as controller from './controller.js'

const router = express.Router();

router.get("/login", controller.login);
router.post("/register", controller.register);

router.get("/unread", controller.getUnread);
router.get("/getSource", controller.getSource);

router.post("/answer", controller.answer);
router.get("/generateanswer", controller.generateAnswer);

router.get("/tweak", controller.tweak);

// dashboard

//by day/week/month
router.get("/emailsreceived", controller.getEmailsReceived);
router.get("/emailsanswered", controller.getEmailsAnswered);

//numbers
router.get("/pendingEmails", controller.getPendingEmails);

router.get("/avgResponseTime", controller.getAvgResponseTime);
router.get("/medianResponseTime", controller.getMedianResponseTime);

router.get("/volumeTrend", controller.getVolumeTrend);
router.get("/responseRateTrend", controller.getResponseRateTrend);
router.get("/busiestHours", controller.getBusiestHours);

export { router }

