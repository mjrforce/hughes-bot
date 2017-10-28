const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const bootstrap = require('alexa-bootstrap');
const controller = require('../functions/controller');
const alexa = new bootstrap();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

alexa.launch( function( request, response ) {
  console.log('Welcome to Hughes Network');
	response.say( 'Welcome to Hughes Network. What is your name?' );
}) ;

alexa.intent('welcomeUser',
  (req,res, slots) => {
    res.say("Welcome "+ slots.name).end();
    console.log('starting log to salesforce from alexa');
    var name = slots.name;
    console.log(name);
    console.log(JSON.stringify(req));
    controller.logToSalesforce('Bot', 'Alexa', {id: req.data.session.sessionId  , name: name}, req.data.session.sessionId, 'My name is ' + name, 'Hello ' + name);
  });

router.post('/hughes', function(req, res){
  console.log(req.body);
  alexa.request(req.body).then(function(response){
    console.log(response);
    res.json(response);
  })
});
module.exports = router
