let express = require('express');
const multer = require('multer')
let router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index.html');
});

router.get("/health", function (req, res) {
  res.send("OK!");
});

router.get("/version", function (req, res) {
  res.json({"version": "0.0.1"});
});

// Redirect
const request = require('request');
BASE_URL = "http://app-was-alb-1501545287.us-west-2.elb.amazonaws.com"

CLASSIFIY_IMAGE = "/classify/image"
HEALTH = "/health"
router.get("/was/health", function (req, res) {
  let url = BASE_URL + HEALTH
  request.get({
    url: url,
  },function(err,response,body){
    console.log(body)
    return res.json({"was-health":JSON.parse(body)})
  })
});

router.post('/classify/image', multer().single('file'), function(req, res) {
  console.log("/classify/sentence")
  let url = BASE_URL + CLASSIFIY_IMAGE
  let formData = {
    //file field need set options 'contentType' and 'filename' for formData
    'file':{
      value:req.file.buffer,
      options:{
          contentType:req.file.mimetype,
          filename:req.file.originalname
      }
    }
  }
  request.post({
      url: url,
      formData: formData
    },function(err,response,body){
    console.log(body)
    return res.json(JSON.parse(body))
  })
});

module.exports = router;