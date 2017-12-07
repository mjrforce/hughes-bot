const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const facebook = require('../helpers/facebook');
const dialogflow = require('../helpers/dialogflow');
const constants = require('../constants')
const request = require('request-promise');
const salesforce = require('../helpers/salesforce');


router.use(bodyParser.json());

router.get('/', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'tuxedo_cat') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

router.get('/oauth', function (req, res) {

  var newurl = constants.SF_ENDPOINT + 'services/oauth2/authorize?client_id=' + constants.SF_CLIENT_ID + '&response_type=code&display=page&state=' + req.query.fbid + '---' + req.query.account_linking_token + '&redirect_uri=' + encodeURIComponent(constants.HEROKU_URL + '/facebook/callback');
  res.redirect(newurl);
});

router.get('/callback', function (req, res) {

  var arr = req.query.state.split('---');
  var newurl = 'https://www.facebook.com/messenger_platform/account_linking?account_linking_token=' + arr[1] + '&authorization_code=' + req.query.code;
  salesforce.linkUser(arr[0], req.query.code);
  res.redirect(newurl);
});


function getToken(fbid, code){

  request({
    url: constants.SF_ENDPOINT + 'services/oauth2/token',
    qs: {
      grant_type: 'authorization_code',
      code: code,
      client_id: constants.SF_CLIENT_ID,
      client_secret: constants.SF_CLIENT_SECRET,
      redirect_uri: constants.HEROKU_URL + '/facebook/callback'
    },
    method: 'POST'
  }).then(function(result){

       var arr = JSON.parse(result).id.split('/');
       salesforce.linkUser(fbid, arr[arr.length-1]);
  });
}

router.post('/', (req, res) => {
  console.log('Start of Facebook');

  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      //entry.messaging.forEach((event) => {
         var event = entry.messaging[0];
        
        if(event.account_linking){
           if(event.account_linking.status == 'unlinked'){
             console.log('unlink');
             salesforce.unlinkUser(event.sender.id);
           }else if( event.account_linking.status == 'linked'){
             //apiai.eventRequest()
             console.log('linked');
           }
        }else if (event.message && event.message.text) {
          facebook.getName(event.sender.id)
          .then(function(result){
            console.log('getname');
            var r = JSON.parse(result);
            return dialogflow.processMessage(event.message.text, event.sender.id, 'Facebook',
              {
                id: event.sender.id,
                name: r.first_name + ' ' + r.last_name
              });
          }).then(function(result){
              console.log('Line 78');
              console.log(JSON.stringify(result));
              if(result.result.fulfillment.data.loginRequired == true){

                 return facebook.postWithLogin(event.sender.id, result.result.fulfillment.speech);
              }else if(result.result.fulfillment.speech != ''){
                 return facebook.post(event.sender.id, result.result.fulfillment.speech);
             }
          });
        }
      //});
    });
    res.status(200).end();
  }
});

module.exports = router
