const dotenv = require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');
const facebook = require('./facebook');
const controller = require('./controller');
const app = express();
const constants = require('./constants');

app.set('port', (process.env.PORT || 5000))
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Use the /webhook endpoint.')
});

app.get('/webhook', function (req, res) {
  res.send('You must POST your request')
});

app.get('/facebook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'tuxedo_cat') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

app.post('/facebook', (req, res) => {

  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      //entry.messaging.forEach((event) => {

         var event = entry.messaging[0];
         console.log(JSON.stringify(event));
        if (event.message && event.message.text) {
          facebook.getName(event.sender.id)
          .then(function(result){
            var r = JSON.parse(result);
            return controller.processMessage(event.message.text, event.sender.id, 'Facebook',
              {
                id: event.sender.id,
                name: r.first_name + ' ' + r.last_name
              });
          }).then(function(result){
               console.log('From Facebook');
               if(result.result.fulfillment.speech != '')
               return facebook.post(event.sender.id, result.result.fulfillment.speech);
          });
        }
      //});
    });
    res.status(200).end();
  }
});

app.post('/webhook', function (req, res) {

  if (constants.APIAI_REQUIRE_AUTH) {
    if (req.headers['auth-token'] !== constants.APIAI_AUTH_TOKEN) {
      return res.status(401).send('Unauthorized')
    }
  };

  // and some validation too
  if (!req.body || !req.body.result || !req.body.result.parameters) {
    return res.status(400).send('Bad Request')
  }

  var webhookReply = controller.processWebhook(req.body);
  console.log(webhookReply);
  // the most basic response
  res.status(200).json({
    source: 'webhook',
    speech: webhookReply,
    displayText: webhookReply
  });

});

app.listen(app.get('port'), function () {
  console.log('* Webhook service is listening on port:' + app.get('port'))
})
