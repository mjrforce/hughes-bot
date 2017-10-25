const constants = require('./constants');
const liveagent = require('./liveagent');
const apiai = require('apiai-promise');
const apiaiApp = apiai(constants.APIAI_CLIENT_ACCESS_TOKEN);
const org = constants.SF_ORG;
const nforce = require('nforce');

exports.processMessage = function(msg, sessionId, source, sender){
  console.log('process message');
  return apiaiApp.textRequest(msg, {
    sessionId: sessionId,
    contexts: [{
    name: source,
    parameters: {
      source: source,
      senderid: sender.id,
      sendername: sender.name
    }
  }]
});

};

exports.processWebhook = function(aresult){

  var routeTo = 'Bot';
  var botchat;
  var qresult;
  var webhookReply = aresult.result.fulfillment.speech;
  var source = 'Google';
  var sender = { id: 'n/a', name: 'TEST'}
  if(typeof aresult.result.contexts != 'undefined'){
    source = aresult.result.contexts[0].parameters.source;
    sender = {id: aresult.result.contexts[0].parameters.senderid,
              name: aresult.result.contexts[0].parameters.sendername} ;
  }

  if(aresult.result.metadata.intentName == 'Request Agent' ||
     aresult.result.metadata.intentName == 'Fallback' ){
    routeTo = 'CSR';
  }

  org.authenticate({ username: constants.SF_USERNAME, password: constants.SF_PASSWORD})
    .then(function(oauth){
      botchat = nforce.createSObject('Bot_Chat__c', {Source__c: source, Route_To__c: routeTo });
      botchat.setExternalId('Session_Id__c', aresult.sessionId);
      return org.upsert({ sobject: botchat });
  }).then(function(){
      return org.query({ query: 'SELECT Id, Route_To__c, Live_Chat_Key__c, Live_Chat_Session_Id__c, Live_Chat_Affinity_Token__c, Live_Chat_Sequence__c FROM Bot_Chat__c WHERE Session_Id__c = \'' + aresult.sessionId + '\' LIMIT 1' });
  }).then(function(result){
      var botid = botchat.getId();
      if(typeof botchat.getId() == 'undefined')
        botid = result.records[0].get('id');

      var botmessage = nforce.createSObject('Bot_Chat_Message__c', {	Bot_Chat__c: botid, Bot_Request__c: aresult.result.resolvedQuery, Bot_Response__c: webhookReply, Type__c: routeTo});
      qresult = result;
      return org.insert({ sobject: botmessage });
  }).then(function(){
      var session = {
        id: qresult.records[0].get('Live_Chat_Session_Id__c'),
        key: qresult.records[0].get('Live_Chat_Key__c'),
        affinityToken: qresult.records[0].get('Live_Chat_Affinity_Token__c'),
        sequence: qresult.records[0].get('Live_Chat_Sequence__c')
      };


    if(routeTo == 'CSR' && session.key == null){
      console.log('starting live agent ...');
      liveagent.start(session,
                      source,
                      aresult.sessionId,
                      qresult.records[0],
                      sender.name,
                      sender.id
                    );
    }
    else if(qresult.records[0].get('Route_To__c') == 'CSR' && session.key != null){
      console.log('posting to live agent');
      liveagent.post(session, qresult.records[0], aresult.result.resolvedQuery);
      webhookReply = '';
    }
  });

  return webhookReply;
}
