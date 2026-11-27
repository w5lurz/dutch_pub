// Extends app.json. Push notifications on Android need Firebase's google-services.json, which is
// not committed: locally it sits next to this file; on EAS it comes from the file environment
// variable GOOGLE_SERVICES_JSON. Without it the app builds and runs, only without notifications.
const fs = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
    const local = path.join(__dirname, 'google-services.json');
    const googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? (fs.existsSync(local) ? './google-services.json' : undefined);
    return googleServicesFile ? { ...config, android: { ...config.android, googleServicesFile } } : config;
};
