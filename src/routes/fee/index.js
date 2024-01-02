const express = require("express");
const fee = require("../../controller/fee");
const router = express.Router();


router.get("/", fee.main);
// for exploring the class
router.get("/class/:id", fee.class);
// for fee portal
router.get("/portal", fee.portal);
router.get("/portal/class/:id", fee.portalClass);
// add fee form
router.post('/addfee', fee.addFee);
// update fee form
router.patch('/updatefee', fee.updateFee);
// find fee doc attributes.
router.get('/portal/:id', fee.findFee);
// Send fees to the students enrolled in that specific class
router.post('/sendfee/:id', fee.sendFee);
// just for check single page for student and show all their fees. 
router.get('/student/:id', fee.singleStudent);
// paying fee
router.patch('/student', fee.payingStudent);
module.exports = router;
