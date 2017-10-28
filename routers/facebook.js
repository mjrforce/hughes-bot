const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const facebook = require('../functions/facebook');
const controller = require('../functions/controller');

router.use(bodyParser.json());

router.get('/', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'tuxedo_cat') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

router.post('/', (req, res) => {

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

module.exports = router
