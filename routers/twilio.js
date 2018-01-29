const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const dialogflow = require('../helpers/dialogflow');
const constants = require('../constants');
const twilio = require('twilio');
const client = new twilio(constants.TWILIO_ACCOUNT_SID, constants.TWILIO_AUTH_TOKEN);
const VoiceResponse = twilio.twiml.VoiceResponse;
// middleware that is specific to this router

router.use(bodyParser.urlencoded({extended: false}));
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  next()
})

router.get('/sms', function (req, res) {
  res.send('You must POST your request')
});

router.get('/voice', function (req, res) {
  res.send('You must POST your request')
});

// define the post route
router.post('/sms', function (req, res) {
  console.log(req.body);
  dialogflow.processMessage(req.body.Body, req.body.From, 'SMS',
    {
      id: req.body.From,
      name: req.body.From
    }).then(function(result){
     console.log('Sending response to SMS');
	 console.log(result.result.fulfillment.speech);
     if(result.result.fulfillment.speech != '')
     res.send("<Response><Message>" + result.result.fulfillment.speech + "</Message></Response>");
    });
});

router.post('/voice', function (req, res) {
  console.log(req.body);

     console.log('From Voice');
     var twiml = new VoiceResponse();
     twiml.say('Never gonna give you up.', {
       voice: 'alice'
     });


     // Render the response as XML in reply to the webhook request
     res.type('text/xml');
     res.send(twiml.toString());


});

module.exports = router
