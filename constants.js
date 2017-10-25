const nforce = require('nforce');
exports.LIVE_AGENT_URL = process.env.LIVE_AGENT_URL;
exports.SF_CLIENT_ID = process.env.SF_CLIENT_ID;
exports.SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
exports.SF_REDIRECT_URL = process.env.SF_REDIRECT_URL;
exports.SF_API_VERSION = (process.env.SF_API_VERSION || 'v27.0');
exports.SF_ENVIRONMENT = process.env.SF_ENVIRONMENT;
exports.SF_USERNAME = process.env.SF_USERNAME;
exports.SF_PASSWORD = process.env.SF_PASSWORD;
exports.APIAI_CLIENT_ACCESS_TOKEN = process.env.APIAI_CLIENT_ACCESS_TOKEN;
exports.APIAI_REQUIRE_AUTH = (process.env.APIAI_REQUIRE_AUTH || true);
exports.APIAI_AUTH_TOKEN = process.env.APIAI_AUTH_TOKEN;
exports.FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
exports.FB_AUTH_TOKEN = process.env.FB_AUTH_TOKEN;
exports.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
exports.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

exports.SF_ORG = nforce.createConnection({
  clientId: this.SF_CLIENT_ID,
  clientSecret: this.SF_CLIENT_SECRET,
  redirectUri: this.SF_REDIRECT_URL,
  apiVersion: this.SF_API_VERSION,  // optional, defaults to current salesforce API version
  environment: this.SF_ENVIRONMENT,  // optional, salesforce 'sandbox' or 'production', production default
  mode: 'single' // optional, 'single' or 'multi' user mode, multi default
});
