const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const bootstrap = require('alexa-bootstrap');
const salesforce = require('../helpers/salesforce');
const alexa = new bootstrap();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

alexa.launch( function( request, response ) {
  console.log('Welcome to Hughes Network');
	response.say( 'Welcome to Hughes Network. Ask me things like What is my balance or check on the status of a case. How may I help you?' );
}) ;

alexa.intent('welcomeUser',
  (req,res, slots) => {
    res.say("Welcome "+ slots.name).end();
    console.log('starting log to salesforce from alexa');
    var name = slots.name;
    console.log(name);
    console.log(JSON.stringify(req));
    salesforce.logToSalesforce('Bot', 'Alexa', {id: req.data.session.sessionId  , name: name}, req.data.session.sessionId, 'My name is ' + name, 'Hello ' + name);
  });

  alexa.intent('CaseStatus',
    (req,res) => {
      res.say('Case number 00001299 currently has a status of closed.');
      salesforce.logToSalesforce('Bot', 'Alexa', {id: req.data.session.sessionId  , name: 'Alexa'}, req.data.session.sessionId, 'What is the status of my most recent case?', 'Case number 00001299 currently has a status of closed.');
    });

  alexa.intent('CurrentBalance',
    (req,res) => {
      res.say('Your current balance due on November 8th is 65 dollars and 99 cents.');
      salesforce.logToSalesforce('Bot', 'Alexa', {id: req.data.session.sessionId  , name: 'Alexa'}, req.data.session.sessionId, 'What is my current balance?', 'Your current balance due on November 8th is 65 dollars and 99 cents.');
    });

  alexa.intent('CustomerServicePhone',
    (req,res) => {
      res.say('Your customer service phone number is 800-555-1212');
      salesforce.logToSalesforce('Bot', 'Alexa', {id: req.data.session.sessionId  , name: 'Alexa'}, req.data.session.sessionId, 'What is the customer service phone number?', 'Your customer service phone number is 800-555-1212');
    });

  alexa.intent('usage',
    (req,res) => {
      res.say('You have used 2.7 gigabytes of your available 5 gigabytes this month.');
      salesforce.logToSalesforce('Bot', 'Alexa', {id: req.data.session.sessionId  , name: 'Alexa'}, req.data.session.sessionId, 'What is my usage for this month?', 'You have used 2.7 gigabytes of your available 5 gigabytes this month.');
    });

router.post('/hughes', function(req, res){
  console.log(req.body);
  alexa.request(req.body).then(function(response){
    console.log(response);
    res.json(response);
  })
});
module.exports = router
