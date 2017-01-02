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
var recipes = require('./recipes');
var icloud = require("find-my-iphone").findmyphone;
var config = require('./config');
var async = require('async');

var itemToLookFor = undefined;


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

FindiPhone.prototype.intentHandlers = {
    "FindiPhoneIntent": function (intent, session, response) {
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
  
                var data = {
                    "Latitude": 38.8976763,
                    "Longitude": -77.0365298,
                    "address": "1600 Pennsylvania Ave NW, Washington, DC 20500"
                };

                async.waterfall([
                    function getDeviceDistance (next) 
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
                    },
                    function pingDevice(data, next) {
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
    var FindiPhone = new FindiPhone();
    FindiPhone.execute(event, context);

};
