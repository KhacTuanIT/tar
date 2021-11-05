var util = require('util');
var path = require('path');
var hfc = require('fabric-client');

var file = 'network-config.json';

var env = process.env.TARGET_NETWORK;
if (env)
    file = util.format(file, '-' + env);
else
    file = util.format(file, '');

hfc.addConfigFile(path.join(__dirname, file));
hfc.addConfigFile(path.join(__dirname, 'config.json'));