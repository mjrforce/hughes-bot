const constants = require('../constants');
const liveagent = require('./liveagent');
const nforce = require('nforce');
const request = require('request-promise');

function getOrg(){
    return nforce.createConnection({
    clientId: constants.SF_CLIENT_ID,
    clientSecret: constants.SF_CLIENT_SECRET,
    redirectUri: constants.SF_REDIRECT_URL,
    apiVersion: constants.SF_API_VERSION,  // optional, defaults to current salesforce API version
    environment: constants.SF_ENVIRONMENT,  // optional, salesforce 'sandbox' or 'production', production default
    mode: 'single' // optional, 'single' or 'multi' user mode, multi default
  });
};

exports.getOrg = getOrg;

function unlinkUser(facebookid){

   var org = getOrg();
   org.authenticate({ username: constants.SF_USERNAME, password: constants.SF_PASSWORD}).then(function(oAuth){
       var botchat = nforce.createSObject('Bot_Chat__c', {Linked_User__c: null });
       botchat.setExternalId('Session_Id__c', facebookid);
       return org.upsert({sobject: botchat});
   })
}

exports.unlinkUser = unlinkUser;

function linkUser(sessionid, code){

   if(code.includes('!')){
     return request({
       url: constants.SF_ENDPOINT + 'services/apexrest/LinkUser/' + sessionid,
       method: 'GET',
       headers: { 'Authorization': 'Bearer ' + code,
                  'Content-Type': 'application/json' }
     });
   }else{
     var org = nforce.createConnection({
       clientId: constants.SF_CLIENT_ID,
       clientSecret: constants.SF_CLIENT_SECRET,
       redirectUri: constants.HEROKU_URL + '/facebook/callback',
       apiVersion: constants.SF_API_VERSION,  // optional, defaults to current salesforce API version
       environment: constants.SF_ENVIRONMENT,  // optional, salesforce 'sandbox' or 'production', production default
       loginUri: constants.SF_ENDPOINT,
       mode: 'single' // optional, 'single' or 'multi' user mode, multi default
     });

     org.authenticate({ code: code }).then(function(oAuth){
         return org.apexRest({uri: 'LinkUser/' + sessionid, method: 'GET'});
     });
 }
}

exports.linkUser = linkUser;

function logToSalesforce(routeTo, source, sender, params, sessionId, botRequest, botResponse){
  var botchat;
  var Linked_User;
  var org = getOrg();
  return org.authenticate({ username: constants.SF_USERNAME, password: constants.SF_PASSWORD})
    .then(function(oauth){
      botchat = nforce.createSObject('Bot_Chat__c', {Session_Id__c: sessionId, Source__c: source, Route_To__c: routeTo });
      console.log(JSON.stringify(botchat));
      var botmessage = nforce.createSObject('Bot_Chat_Message__c', {Bot_Request__c: botRequest, Bot_Response__c: botResponse, Type__c: routeTo});
      console.log('Start Apex Rest');
      var body = {botChat: botchat.toJSON(), botMessage: botmessage.toJSON()};
      console.log(JSON.stringify(body));
      return org.apexRest({uri: 'logBotMessage', method: 'POST', body: JSON.stringify(body)  });
  }).then(function(result){
    console.log(result);
    Linked_User = result.Bot_Chat__r.Linked_User__c;
	console.log(result.Id);
    if(source == 'Facebook' || source == 'SMS'){
	  console.log('starting live agent');
      liveagent.start(org.query({ query: 'SELECT Id, Bot_Chat__r.id, Bot_Chat__r.Route_To__c, Bot_Chat__r.Live_Chat_Key__c, Bot_Chat__r.Live_Chat_Session_Id__c, Bot_Chat__r.Live_Chat_Affinity_Token__c, Bot_Chat__r.Live_Chat_Sequence__c, Bot_Chat__r.Source__c, Bot_Chat__r.Session_Id__c, Bot_Response__c, Bot_Request__c FROM Bot_Chat_Message__c WHERE Id = \'' + result.Id + '\' LIMIT 1' }));
	 }

    var toreturn = {
        botResponse: botResponse,
        loginRequired: false
    }

    if(typeof params != 'undefined'){
      var loginRequiredText = 'Login Required';
      if(typeof params['login-text'] != 'undefined'){
        loginRequiredText = params['login-text'];
      }
      if(typeof params['login-required'] != 'undefined'){
        //If login required and user is NOT logged in
        if(params['login-required'] == '1' && (Linked_User == null || typeof Linked_User == 'undefined')){
            toreturn.botResponse = loginRequiredText;
            toreturn.loginRequired = true;
            if(typeof params['login-event'] != 'undefined')
              toreturn.followupEvent = params['login-event'];
            return toreturn;
        }
        //if login is required and user IS Logged in
        else {
          if(typeof params['sf-service'] != 'undefined'){
             var url = params['sf-service'] + '/' + result.Id;
             console.log(url);
             return  org.apexRest({uri: url, method: 'GET'}).then(function(result){
                 console.log(result);
                 toreturn.botResponse = result;
                 return toreturn;
               });
          }else{
             return toreturn;
          }
        }
      //if login is not required
      }else{
        return toreturn;
      }
    //if no parameters at all
    }else{
      return toreturn;
    }
    return toreturn;
  });

}

exports.logToSalesforce = logToSalesforce;
