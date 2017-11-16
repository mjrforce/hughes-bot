const request = require('request-promise');
const constants = require('../constants');
const salesforce = require('../helpers/salesforce');
const liveagent = require('../helpers/liveagent');
const apiai = require('apiai-promise');
const apiaiApp = apiai(constants.APIAI_CLIENT_ACCESS_TOKEN);

exports.processMessage = function(msg, sessionId, source, sender){

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
  var webhookReply = aresult.result.fulfillment.speech;
  var source = 'Google';
  var sender = { id: 'n/a', name: 'TEST'}
  if(typeof aresult.result.contexts != 'undefined'){
    if(aresult.result.contexts.length > 0){
    source = aresult.result.contexts[0].parameters.source;
    sender = {id: aresult.result.contexts[0].parameters.senderid,
              name: aresult.result.contexts[0].parameters.sendername} ;
  }
}

  if(source == '' || source == null)
    source = 'Google';

  if(aresult.result.metadata.intentName == 'Request Agent' ||
     aresult.result.metadata.intentName == 'Fallback' ){
    routeTo = 'CSR';
  }

  console.log(source);
  if(source == 'Google'){
    return salesforce.linkUser(aresult.sessionId, aresult.originalRequest.data.user.accessToken)
      .then(function(result){
        console.log('After Linking...');
        return salesforce.logToSalesforce(routeTo,
                                          source,
                                          sender,
                                          aresult.result.parameters,
                                          aresult.sessionId,
                                          aresult.result.resolvedQuery,
                                          webhookReply
                                          );
      });
  }else{
     return salesforce.logToSalesforce(routeTo,
                                       source,
                                       sender,
                                       aresult.result.parameters,
                                       aresult.sessionId,
                                       aresult.result.resolvedQuery,
                                       webhookReply
                                       );
  }

};
