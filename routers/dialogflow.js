const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const constants = require('../constants');
const dialogflow = require('../helpers/dialogflow');

router.use(bodyParser.json());

router.post('/', function (req, res) {
  console.log(JSON.stringify(req.body));
  if (constants.APIAI_REQUIRE_AUTH) {
    if (req.headers['auth-token'] !== constants.APIAI_AUTH_TOKEN) {
      return res.status(401).send('Unauthorized')
    }
  };

  // and some validation too
  if (!req.body || !req.body.result || !req.body.result.parameters) {
    return res.status(400).send('Bad Request. hombre.')
  }

  dialogflow.processWebhook(req.body).then(function(result){

    // the most basic response
    var resp = {
      source: 'webhook',
      speech: result.botResponse,
      displayText: result.botResponse,
      contextOut: [{name:"loginRequired", "lifespan":5, "parameters":{"isRequired": result.loginRequired}}],
      data: { loginRequired: result.loginRequired}
    };

    res.status(200).json(resp);
  });


});

module.exports = router
