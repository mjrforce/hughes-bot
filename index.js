const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');

const app = express();
const nforce = require('nforce');
const LIVE_AGENT_URL = 'https://d.la3-c1cs-dfw.salesforceliveagent.com/chat/rest/';
const CLIENT_ACCESS_TOKEN = 'f007ead0358c4e39ae9dbe638ae71e84';

const org = nforce.createConnection({
  clientId: '3MVG9PE4xB9wtoY9IbhNtYSuAVMe8N3gOW1PI98B7XpLZ2ROxWkOggFSe4BHggK8XtQfeg99nsZd8PiA9mESz',
  clientSecret: '1347608823684847488',
  redirectUri: 'https://login.salesforce.com/services/oauth2/callback',
  apiVersion: 'v27.0',  // optional, defaults to current salesforce API version
  environment: 'sandbox',  // optional, salesforce 'sandbox' or 'production', production default
  mode: 'single' // optional, 'single' or 'multi' user mode, multi default
});

app.use(bodyParser.json())
app.set('port', (process.env.PORT || 5000))

const REQUIRE_AUTH = true
const AUTH_TOKEN = 'an-example-token'

app.get('/', function (req, res) {
  res.send('Use the /webhook endpoint.')
})
app.get('/webhook', function (req, res) {
  res.send('You must POST your request')
})

app.get('/test', function (req, res) {
  res.send('msg: ' + req.msg + ' sessionId: ' + req.sessionId);
})

app.post('/webhook', function (req, res) {
  // we expect to receive JSON data from api.ai here.
  // the payload is stored on req.body

  // we have a simple authentication
  if (REQUIRE_AUTH) {
    if (req.headers['auth-token'] !== AUTH_TOKEN) {
      return res.status(401).send('Unauthorized')
    }
  }

  // and some validation too
  if (!req.body || !req.body.result || !req.body.result.parameters) {
    return res.status(400).send('Bad Request')
  }

  // the value of Action from api.ai is stored in req.body.result.action
  console.log('* Received action -- %s', req.body.result.action)
  
  var webhookReply;
  var routeTo;
  
  console.log('Intent Name: ' + req.body.result.metadata.intentName);
  if(req.body.result.metadata.intentName == 'Welcome User'){
	  // parameters are stored in req.body.result.parameters
	  var userName = req.body.result.parameters['given-name']
	  webhookReply = 'Hello ' + userName + '! Welcome from the webhook.'
	  routeTo = 'Bot';
  }
  
  else if(req.body.result.metadata.intentName == 'Request Agent'){
	  // parameters are stored in req.body.result.parameters
	  var userName = req.body.result.parameters['given-name']
	  webhookReply = req.body.result.fulfillment.speech;
	  routeTo = 'CSR';
  }
  else{
	  webhookReply = '';
  }
  
  var botchat;
  
  org.authenticate({ username: 'matt@playhouse.dev.liveagent', password: 'Purdue321!!'}).then(function(oauth){

    botchat = nforce.createSObject('Bot_Chat__c', {Source__c: req.body.originalRequest.source });
	
	if(routeTo == 'CSR')
	   botchat.set('Route_To__c', routeTo);
   
	botchat.setExternalId('Session_Id__c', req.body.sessionId);
	return org.upsert({ sobject: botchat });

  }).then(function(){

    return org.query({ query: 'SELECT Id, Route_To__c, Live_Chat_Key__c, Live_Chat_Session_Id__c, Live_Chat_Affinity_Token__c, Live_Chat_Sequence__c FROM Bot_Chat__c WHERE Session_Id__c = \'' + req.body.sessionId + '\' LIMIT 1' });
	
  }).then(function(result){
	  

		
		var botid = botchat.getId();
		
		if(typeof botchat.getId() == 'undefined')
		  botid = result.records[0].get('id');
	  
		var botmessage = nforce.createSObject('Bot_Chat_Message__c', {	Bot_Chat__c: botid, Bot_Request__c: req.body.result.resolvedQuery, Bot_Response__c: webhookReply, Type__c: routeTo});
        
		var session = {
		  id: result.records[0].get('Live_Chat_Session_Id__c'),
		  key: result.records[0].get('Live_Chat_Key__c'),
          affinityToken: result.records[0].get('Live_Chat_Affinity_Token__c'),
		  sequence: result.records[0].get('Live_Chat_Sequence__c')
	    };
		
		console.log('Route To: ' + routeTo);
		
		if(routeTo == 'CSR' && result.records[0].get('Route_To__c') != 'CSR' && session.key == null){
	      console.log('startLiveAgent');
		  startLiveAgent(session, req.body.originalRequest.source, req.body.sessionId, result.records[0]);
		  
		}
		
		else if(result.records[0].get('Route_To__c') == 'CSR' && session.key != null){
		  console.log('sendLiveAgentMessage');
		  sendLiveAgentMessage(session, result.records[0], req.body.result.resolvedQuery);
		}
		
	   
	    return org.insert({ sobject: botmessage });
	   
  }).then(function(err){
	   console.error('crud failed');
       console.error(JSON.stringify(err));

  }).finally(function(){
	  
	   
  });
  
  

  // the most basic response
  res.status(200).json({
    source: 'webhook',
    speech: webhookReply,
    displayText: webhookReply
  })
})

app.listen(app.get('port'), function () {
  console.log('* Webhook service is listening on port:' + app.get('port'))
})

function AgentSays(msg, sessionId){
    request({
		  url: "https://api.dialogflow.com/v1/query?v=20150910&e=AGENT_SAYS&lang=en&sessionId=" + sessionId,
		  method: 'POST',
		  headers: {
			'Authorization': 'Bearer ' + CLIENT_ACCESS_TOKEN,
			'Content-Type': 'application/json'
		  },
		  json: {
					"contexts": [],
					"lang": "en",
					"event":{  
					  "name":"AGENT_SAYS",
					  "data":{
						 "say": msg
					  }
					},
					"sessionId": sessionId,
					"timezone": "America/New_York"
				}
		}, (error, response) => {
		  if (error) {
			  console.log('line 154');
			  console.log('Error sending message: ', error);
		  } else if (response.body.error) {
			  console.log('line 158');
			  console.log('Error: ', response.body.error);
		  }else{
			  console.log(JSON.stringify(response));		  
		  }
		});	
}

function sendLiveAgentMessage(session, sobj, msg){
   
    console.log(session);
	console.log(JSON.stringify(sobj));
	console.log(msg);
	
	var seq = sobj.get('Live_Chat_Sequence__c') + 1;
	sobj.set('Live_Chat_Sequence__c', seq);
    
	org.update({sobject: sobj}, function(err, resp){
       console.log(err);	
	});

	request({
	url: LIVE_AGENT_URL + 'Chasitor/ChatMessage',
	method: 'POST',
	headers: {
		'X-LIVEAGENT-API-VERSION': 40,
		'X-LIVEAGENT-AFFINITY': session.affinityToken,
		'X-LIVEAGENT-SESSION-KEY': session.key,
		'X-LIVEAGENT-SEQUENCE': seq
	  },
	json: {	
         text: msg
	}
	}, (error, response) => {
		console.log('line: 162');
		console.log(JSON.stringify(response));
		if (error) {
          console.log('Error sending message: ', error);
      } 		
	});	
}

function startLiveAgent(session, source, apiaiSession, sobj){
	    console.log('starting live agent...');
		request({
		  url: LIVE_AGENT_URL + 'System/SessionId',
		  method: 'GET',
		  headers: {
			'X-LIVEAGENT-API-VERSION': 40,
			'X-LIVEAGENT-AFFINITY': 'null'
		  }
		}, (error, response) => {
		  if (error) {
			  console.log('line 154');
			  console.log('Error sending message: ', error);
		  } else if (response.body.error) {
			  console.log('line 158');
			  console.log('Error: ', response.body.error);
		  }else{
			  console.log(response.body);
			  var res = JSON.parse(response.body);
			  
			  sobj.set('Live_Chat_Key__c', res.key);
			  sobj.set('Live_Chat_Session_Id__c', res.id);
			  sobj.set('Live_Chat_Affinity_Token__c', res.affinityToken);
			  sobj.set('Live_Chat_Sequence__c', 0);
			  
			  org.update({ sobject: sobj}, function(err, resp){
				  if(!err) console.log('It worked!');
			  });
			  ChasitorInit(res, {sender: 'TEST', source: source, senderid: 'TEST'}, apiaiSession, sobj.get('id'));
		  }
		});	
	
}

function ChasitorInit(session, data, apiaiSession, bcid){
	
	console.log(bcid);
    request({
	url: LIVE_AGENT_URL + 'Chasitor/ChasitorInit',
	method: 'POST',
	headers: {
		'X-LIVEAGENT-API-VERSION': 40,
		'X-LIVEAGENT-AFFINITY': session.affinityToken,
		'X-LIVEAGENT-SESSION-KEY': session.key,
		'X-LIVEAGENT-SEQUENCE': 1
	  },
	json: {	
			organizationId: "00D3D000000D1gO",
			deploymentId: "5723D000000000p",
			buttonId: "5733D000000001s",
			sessionId: session.id,		
			doFallback: true,
			userAgent: "Facebook",
			screenResolution: "1900x1080", 
			language: "en-US",
			visitorName: data.sender,
			prechatDetails: [
			{
				label: 'Session Id',
				value: apiaiSession,
				transcriptFields: ['Bot_Chat_Session_Id__c'],
				entityMaps:[
					{
					   entityName: 'Bot_Chat__c',
					   fieldName: 'Session_Id__c'
					}
				],
				displayToAgent: true
			},
			{
				label: 'Bot Chat Id',
				value: bcid,
				transcriptFields: [
				  'Bot_Chat__c'
				],
				entityMaps:[
					{
					   entityName: 'Bot_Chat__c',
					   fieldName: 'Id'
					}
				],
				displayToAgent: true
			}
			],
			prechatEntities: [
			{
				entityName: 'Bot_Chat__c',
				showOnCreate: true,
				entityFieldsMaps:[
				{
					fieldName: 'Session_Id__c',
					label: 'Session Id',
					doFind: true,
					isExactMatch: true,
					doCreate: false
				},
				{
					fieldName: 'Id',
					label: 'Id',
					doFind: true,
					isExactMatch: true,
					doCreate: false
				}
				]			
			}
			],
			receiveQueueUpdates: true,
			isPost: true
	}

	}, (error, response) => {
		console.log('line 275');
		console.log(response.body);
		
		if (error) {
	      console.log('line 280');
          console.log('Error sending message: ', error);
      } 		
	});	
}