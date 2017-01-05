/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 *
 * - Custom slot type: demonstrates using custom slot types to handle a finite set of known values
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, ask Minecraft Helper how to make paper."
 *  Alexa: "(reads back recipe for paper)"
 */

'use strict';

const util = require('util');

var AlexaSkill = require('./AlexaSkill');

var config = require('./config');
var async = require('async');

var APP_ID = "amzn1.ask.skill.cee844ea-1f14-4de3-89f7-a1bebe891dd9"; //OPTIONAL: replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

/**
 * MinecraftHelper is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var FindiPhone = function () {
    AlexaSkill.call(this, APP_ID);
};

var allDevicesAndInfo = {};
//This object will contain an map of map: 
// {"accountNickName": {"iCloudDevices": <array of iCloud Device Information, "iCloudAccount": <iCloud Account Object>}}

// Extend AlexaSkill
FindiPhone.prototype = Object.create(AlexaSkill.prototype);
FindiPhone.prototype.constructor = FindiPhone;

FindiPhone.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    var speechText = "Welcome to the iPhone Finder. Locate your iDevices with commands like, find my iPhone";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "For instructions on what you can say, please say help me.";
    console.log("onLaunch requestId="  + session.requestId + " sessionId=" + session.sessionId);
    response.ask(speechText, repromptText);
};

function ValidateConfig() {
    var errorString = null;
    var nickNameArray = [];
    var userNameArray = [];
    var passwordArray = [];
    config.iCloudAccounts.forEach(function (account) {
        nickNameArray.push(account.NickName);
        userNameArray.push(account.UserName);
        passwordArray.push(account.PassWord);
    })
    nickNameArray.sort();
    arrayLen = nickNameArray.length;
    prevNickName = nickNameArray[0];
    prevUserName  = userNameArray[0];

    for (var i = 0; i<arrayLen; i++) {
        if (nickNameArray[i] === undefined) {
            errorString = "Nick name is undefined.";
            break;
        }
        if (userNameArray[i] === undefined) { 
            errorString = "User name is undefined";
            break;
        }
        if (passwordArray[i] === undefined) {
            errorString = "Password is undefined";
            break;
        }
    }

    for (var i= 1; i<arrayLen; i++) {   
        if(prevNickName === nickNameArray[i]) {
            errorString = "Nick Name " + prevNickName + " is repeated.";
            break;
        }
        prevNickName = nickNameArray[i];

        if(prevUserName === nickNameArray[i]) {
            errorString = "User Name is repeated.";
            break;
        }
        prevUserName = userNameArray[i];
    }

    return errorString;
}


function logInAccountAndGetDevicesInfo(singleiCloudAccount, callback) {
    
    var namespace = {}; 
    namespace.fmyiphone = require("find-my-iphone");
    namespace.icloud = namespace.fmyiphone.findmyphone;
    
    namespace.icloud.apple_id = singleiCloudAccount.UserName;
    namespace.icloud.password = singleiCloudAccount.Password;
    namespace.icloud.message = config.message;
    
    
    console.log("iCloud username: " + namespace.icloud.apple_id);
    //allDevicesAndInfo[singleiCloudAccount.NickName] = {"iCloudAccount": namespace.icloud};
 
    //put Async here for icloud login then getDevices. 
    namespace.icloud.getDevices(function (error, devices) {
        if (error) {
            allDevicesAndInfo[singleiCloudAccount.NickName]["iCloudDevices"] = undefined;
            console.log("error found: " + error);
            
            //remove all references to find my iphone

            callback(null, "Account " + singleiCloudAccount.NickName + " false");
        }else {
            //allDevicesAndInfo[singleiCloudAccount.NickName]["iCloudDevices"] = devices;
            allDevicesAndInfo[singleiCloudAccount.NickName]["UserName"] = singleiCloudAccount.UserName;
            allDevicesAndInfo[singleiCloudAccount.NickName]["Password"] = singleiCloudAccount.Password;
            allDevicesAndInfo[singleiCloudAccount.NickName]["NickName"] = singleiCloudAccount.NickName;
            allDevicesAndInfo[singleiCloudAccount.NickName]["DeviceIdAndNickNameMap"] = {};
            
            var devicesLen = devices.length;
            var deviceMap= {};
            for (var i=0; i<devicesLen; i++) {
                var device  = devices[i];
                var deviceNickNames = [device.name, device.modelDisplayName, device.deviceDisplayName, 
                    singleiCloudAccount.NickName + ' ' + device.modelDisplayName, singleiCloudAccount.NickName + '\'s ' + device.modelDisplayName,
                    singleiCloudAccount.NickName + ' ' + device.deviceDisplayName, singleiCloudAccount.NickName + '\'s ' + device.deviceDisplayName];
                var deviceId = device["id"];
                deviceMap[deviceId] = deviceNickNames;
            }
            allDevicesAndInfo[singleiCloudAccount.NickName]["DeviceIdAndNickNameMap"] = deviceMap;
            
            console.log(singleiCloudAccount.NickName + " devices: " + JSON.stringify(allDevicesAndInfo[singleiCloudAccount.NickName]));
            
            //remove all references to find my iphone
            callback(null, "Account " + singleiCloudAccount.NickName + " true");
        }
    });
}
 
function printAllAccountInfo(singleiCloudAccount, callback) {
    var fmyiphone = require("find-my-iphone");
    var icloud = fmyiphone.findmyphone;
    icloud.apple_id = singleiCloudAccount.UserName;
    icloud.password = singleiCloudAccount.Password;
    console.log("Account Nick Name: " + singleiCloudAccount.NickName);
    callback(null, icloud);
}

                      
function GetAllDeivcesFromAllAccounts() {
    console.log("Before Async Map");
    async.mapSeries(config.iCloudAccounts, logInAccountAndGetDevicesInfo, function(error, results) {
        
        console.log("allDevicesAndInfo: " + JSON.stringify(allDevicesAndInfo));
        
    });
    

}

FindiPhone.prototype.intentHandlers = {
    "LocateiPhoneIntent": function (intent, session, response) {

    },
    "FindiPhoneIntent": function (intent, session, resposne) {
        var itemSlot = intent.slots.Item,
            itemName = itemSlot.value;
        console.log("Within FindiPhoneIntent Block");
        GetAllDeivcesFromAllAccounts();
    },
    "FindiPhoneIntentOld": function (intent, session, response) {
        var itemSlot = intent.slots.Item,
            itemName = itemSlot.value;

        var cardTitle = "Looking for " + itemName;
        var speechOutput;
        var repromptOutput;

        icloud.apple_id = config.iCloudUserName;
        icloud.password = config.iCloudPassword;
        console.log("logging into iCloud");

        icloud.getDevices(function (error, devices) {
            var device;

            if (error) {
                console.log("icloud error: " + error);
                throw error;
            }
            console.log("within iCloud callback");
            //pick a device with location and findMyPhone enabled
            devices.forEach(function(d) {
                
                if (d.modelDisplayName.toLowerCase() === itemName.toLowerCase() ) {
                    device = d;
                    console.log("device: " + device.name);
                }

            });

            if (device) {

                //gets the distance of the device from my location
                //TODO: Get Alexa's local address
  
                var data = {
                    "Latitude": 38.8976763,
                    "Longitude": -77.0365298,
                    "address": "1600 Pennsylvania Ave NW, Washington, DC 20500"
                };

                async.waterfall([
                    /*function getDeviceDistance (next) 
                    {
                        icloud.getDistanceOfDevice(device, data.Latitude, data.Longitude, function(err, result) {
                            if (err) { 
                                console.log("error locating "+ itemName + ":" + JSON.stringify(err));
                                cardTitle = itemName + " location error";
                                speechOutput = {
                                    speech: "There is a problem finding your " + itemName,
                                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                                };
                                response.tellWithCard(speechOutput, cardTitle, itemName)
                                next("Failure to locate " + itemName);
                            }else {
                                if (result != undefined) {
                                    console.log("Distance: " + result.distance.text);
                                    console.log("Driving time: " + result.duration.text);
                                }else {
                                    console.log("Location information was given for " + itemName);
                                }
                                next(null, data);
                            }
                            
                        });
                    },
                    function getDeviceLocation (data, next) {
                        icloud.getLocationOfDevice(device, function(err, location) {
                            console.log(location);
                            data.Location = location;
                            next(null, data);
                        });
                    },*/
                    function playAlarmOnDevice(data, next) {
                        icloud.alertDevice(device.id, function(err) {
                            console.log("Beep Beep " + JSON.stringify(device));

                            speechOutput = {
                                speech: "I'm ringing alarm on your " + itemName,
                                type: AlexaSkill.speechOutputType.PLAIN_TEXT
                            };
                            response.tellWithCard(speechOutput, cardTitle, itemName);
                            next(null, data);
                        });
                    }
                ]);
            }
            else {
                var speechText = itemName + " is not listed in your iCloud account, please try again";
                var repromptText = "Try saying locate my iPod, iPhone, iPad, or MacBook Pro";
                response.ask(speechText, repromptText)
            }
        });
        
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "You can ask questions such as, where is my iPhone, where is my iPod, Now, what can I help you with?";
        var repromptText = "You can say things like, where is my iPhone, or you can say exit... Now, what can I help you with?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    }
};

exports.handler = function (event, context) {
    var findiPhone = new FindiPhone();
    findiPhone.execute(event, context);

};
