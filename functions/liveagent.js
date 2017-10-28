const nforce = require('nforce');
const request = require('request-promise');
const constants = require('../constants');
const org = constants.SF_ORG;

exports.post = function(session, sobj, msg){
  console.log('inside post to live agent');
	var seq = sobj.get('Live_Chat_Sequence__c') + 1;
	sobj.set('Live_Chat_Sequence__c', seq);

  org.authenticate({ username: constants.SF_USERNAME, password: constants.SF_PASSWORD})
    .then(function(oauth){
       org.update({sobject: sobj}, function(err, resp){
       console.log(err);
	     });
    });

	request({
	url: constants.LIVE_AGENT_URL + 'Chasitor/ChatMessage',
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
}).then(function(result){
  console.log(result);
}).catch(function(error){
  console.log(error);
});
};

exports.start = function(session, source, apiaiSession, sobj, sender, senderid){
    console.log('inside starting live agent');
    request({
		  uri: constants.LIVE_AGENT_URL + 'System/SessionId',
		  method: 'GET',
		  headers: {
			'X-LIVEAGENT-API-VERSION': 40,
			'X-LIVEAGENT-AFFINITY': 'null'
		  }
		}).then(function(response){
      console.log(response);
      var res = JSON.parse(response);

      sobj.set('Live_Chat_Key__c', res.key);
      sobj.set('Live_Chat_Session_Id__c', res.id);
      sobj.set('Live_Chat_Affinity_Token__c', res.affinityToken);
      sobj.set('Live_Chat_Sequence__c', 0);

      org.authenticate({ username: constants.SF_USERNAME, password: constants.SF_PASSWORD})
        .then(function(oauth){
           org.update({sobject: sobj}, function(err, resp){
           console.log(err);
    	     });
        });

      return ChasitorInit(res, {sender: sender, source: source, senderid: senderid}, apiaiSession, sobj.get('id'));

    })
};

function ChasitorInit(session, data, apiaiSession, bcid){

  return request({
	url: constants.LIVE_AGENT_URL + 'Chasitor/ChasitorInit',
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
	});
}
