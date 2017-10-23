exports.hello = function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end( service.hello() );
}

function getFacebookName(senderid, callback){
	request({
      url: 'https://graph.facebook.com/v2.6/' + senderid,
      qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
      method: 'GET'
    }, (error, response) => {

      if (error) {
		  console.log('line 70');
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
		  console.log('line 74');
          console.log('Error: ', response.body.error);
      }else{
		  var res = JSON.parse(response.body);
		  callback(res.first_name + ' ' + res.last_name);
	  }
    });	
}

function postToFacebook(senderid, msg, callback){
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: senderid},
        message: {text: msg}
      }
    }, (error, response) => {
		 callback(error, response);
    });	
}