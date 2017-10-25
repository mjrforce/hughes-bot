const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const controller = require('./controller');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
// middleware that is specific to this router

router.use(bodyParser.urlencoded({extended: false}));
router.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  next()
})

// define the post route
router.post('/sms', function (req, res) {
  console.log(req.body);
  controller.processMessage(req.body.Body, req.body.From, 'SMS',
    {
      id: req.body.From,
      name: req.body.From
    }).then(function(result){
     console.log('From SMS');
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
