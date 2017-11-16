const request = require('request-promise');
const constants = require('../constants');

exports.post = function(senderid, msg){
    return request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: constants.FB_PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: senderid},
        message: {text: msg}
      }
    });
};

exports.postWithLogin = function(senderid, msg){
  return request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: constants.FB_PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {

      recipient: {id: senderid},
      message: {
        attachment: {
          type: 'template',
          payload: {
              template_type: 'button',
              text: msg,
              buttons: [
                {
                  "type": "account_link",
                  "url": constants.HEROKU_URL + '/facebook/oauth?fbid=' + senderid
                },
                {
                  "type": "account_unlink"
                }
              ]
       }
      }

    }
  }
  });
}

exports.getName = function(senderid){
	return request({
      url: 'https://graph.facebook.com/v2.6/' + senderid,
      qs: {access_token: constants.FB_PAGE_ACCESS_TOKEN},
      method: 'GET'
    });
}
