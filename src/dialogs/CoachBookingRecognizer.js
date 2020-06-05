// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { LuisRecognizer } = require('botbuilder-ai');

class CoachBookingRecognizer {
    constructor(config) {
        const luisIsConfigured = config && config.applicationId && config.endpointKey && config.endpoint;
        if (luisIsConfigured) {
            // Set the recognizer options depending on which endpoint version you want to use e.g v2 or v3.
            // More details can be found in https://docs.microsoft.com/en-gb/azure/cognitive-services/luis/luis-migration-api-v3
            const recognizerOptions = {
                apiVersion: 'v3'
            };

            this.recognizer = new LuisRecognizer(config, recognizerOptions);
        }
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeLuisQuery(context) {
        return await this.recognizer.recognize(context);
    }

    getFromEntities(result) {
        let fromValue;
        if (result.entities.$instance.From) {
            fromValue = result.entities.$instance.From[0].text;
        }
        if (fromValue ) {
            fromAirportValue = result.entities;
        }

        return { from: fromValue, airport: fromAirportValue };
    }

    getToEntities(result) {
        let toValue;
        if (result.entities.$instance.To) {
            toValue = result.entities.$instance.To[0].text;
        }
        if (toValue && result.entities.To[0].Airport) {
            toAirportValue = result.entities.To[0].Airport[0][0];
        }

        return { to: toValue, airport: toAirportValue };
    }

    /**
     * This value will be a TIMEX. And we are only interested in a Date so grab the first result and drop the Time part.
     * TIMEX is a format that represents DateTime expressions that include some ambiguity. e.g. missing a Year.
     */
    getDateEntity(result) {
        const datetimeEntity = result.entities.date;
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0].timex;
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }
    getCoachEntity(result){
        let startTimeValue, endTimeValue, coachValue, dateValue;
        if(result.entities.$instance.startTime){
            startTimeValue = result.entities.$instance.startTime[0].text;
        }
        if(result.entities.$instance.endTime){
            endTimeValue = result.entities.$instance.endTime[0].text;
        }
        if(result.entities.$instance.coach){
            coachValue = result.entities.$instance.coach[0].text;
        }
        return {startTime: startTimeValue, endTime: endTimeValue, coach: coachValue}
    }
}

module.exports.CoachBookingRecognizer = CoachBookingRecognizer;
