const awsIot = require('aws-iot-device-sdk');
const sense = require("sense-hat-led");

sense.clear();

// Load config file
const config = require('./config.json');

const os = require('os');

console.log('[START] Start of rpi-sense-hat-hue application');

var configIoT = {
    "keyPath": config.iotKeyPath,
    "certPath": config.iotCertPath,
    "caPath": config.iotCaPath,
    "clientId": config.iotClientId,
    "region": config.iotRegion,
    "host": config.iotEndpoint,
    "reconnectPeriod": 300,
};

var thingState = {
    color: [0, 0, 0]
};

console.log('[SETUP] thingShadow state initialized with:');
console.log(thingState);
console.log('[SETUP] Initializing IoT thingShadow with config:');
console.log(configIoT);

var thingShadow = awsIot.thingShadow(configIoT);

function refreshShadow() {

    var toUpdate = {
        state: {
            reported: thingState
        }
    };

    console.log('[EVENT] refreshShadow(): Refhreshing the Shadow:');
    console.log(toUpdate);


    thingShadow.update(config.iotThingName, toUpdate);
}


thingShadow.on('connect', function() {
    console.log('[IOT EVENT] thingShadow.on(connect): Connection established to AWS IoT');
    console.log('[IOT EVENT] thingShadow.on(connect): Registring to thingShadow');
    thingShadow.register(config.iotThingName, {
        persistentSubscribe: true
    }, function() {
        setTimeout(refreshShadow, 0);
    });    
});

thingShadow.on('reconnect', function() {
    console.log('[IOT EVENT] thingShadow.on(reconnect) Trying to reconnect to AWS IoT');
});

thingShadow.on('close', function() {
    console.log('[IOT EVENT] thingShadow.on(close) Connection closed');
    console.log('[IOT EVENT] thingShadow.on(close) unregistring to shadow.');
    thingShadow.unregister(config.iotThingName);
});

thingShadow.on('error', function(err) {
    console.error('[IOT EVENT] thingShadow.on(error) error:', err);
    // process.exit();
    throw new Error('[ERROR] Lets crash the node code because of this error.');
});

thingShadow.on('status', function(thingName, stat, clientToken, stateObject) {
    console.log('[IOT EVENT] thingShadow.on(status): thingName:', thingName);
    console.log('[IOT EVENT] thingShadow.on(status): stat:', stat);
    console.log('[IOT EVENT] thingShadow.on(status): clientToken:', clientToken);
    console.log('[IOT EVENT] thingShadow.on(status): stateObject:', stateObject);
});

thingShadow.on('delta', function(thingName, stateObject) {

    console.log('[EVENT] thingShadow.on(delta): ' + thingName + ': ' + JSON.stringify(stateObject));

    if (stateObject.state.color !== undefined) thingState.color = stateObject.state.color;

    console.log('[EVENT] thingShadow.on(delta): Updated thingState to:');
    console.log(thingState);

    setTimeout(refreshShadow, 0);
});
