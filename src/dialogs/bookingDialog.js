// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class BookingDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'bookingDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.coachStep.bind(this),
                this.startTimeStep.bind(this),
                this.EndTimeStep.bind(this),
                this.DateTimeStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If no coach has been provided, prompt for one.
     */
    async coachStep(stepContext) {
        const bookingDetails = stepContext.options;

        if (!bookingDetails.destination) {
            const messageText = 'Who [Coach] would you like to be booked with ? [ expects username ]';
            const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(bookingDetails.coach);
    }

    /**
     * If an start time has not been provided, prompt for one.
     */
    async startTimeStep(stepContext) {
        const bookingDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        bookingDetails.coach = stepContext.result;
        if (!bookingDetails.startTime) {
            const messageText = 'From what time will you be working out ?';
            const msg = MessageFactory.text(messageText, 'From what time will you be working out ?', InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(bookingDetails.startTime);
    }
    /**
     * If an end time has not been provided, prompt for one.
     */
    async EndTimeStep(stepContext) {
        const bookingDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        bookingDetails.startTime = stepContext.result;
        if (!bookingDetails.endTime) {
            const messageText = 'Until what time will you be working out ?';
            const msg = MessageFactory.text(messageText, 'Until what time will you be working out ?', InputHints.ExpectingInput);
            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }
        return await stepContext.next(bookingDetails.endTime);
    }

    /**
     * If a travel date has not been provided, prompt for one.
     * This will use the DATE_RESOLVER_DIALOG.
     */
    async DateTimeStep(stepContext) {
        const bookingDetails = stepContext.options;

        // Capture the results of the previous step
        bookingDetails.endTime = stepContext.result;
        if (!bookingDetails.date || this.isAmbiguous(bookingDetails.date)) {
            return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: bookingDetails.date });
        }
        return await stepContext.next(bookingDetails.date);
    }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const bookingDetails = stepContext.options;

        // Capture the results of the previous step
        bookingDetails.date = stepContext.result;
        const messageText = `Please confirm, I have you booked with: ${ bookingDetails.coach } from: ${ bookingDetails.startTime } to: ${ bookingDetails.endTime } on: ${bookingDetails.date}. Is this correct?`;
        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const bookingDetails = stepContext.options;
            return await stepContext.endDialog(bookingDetails);
        }
        return await stepContext.endDialog();
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.BookingDialog = BookingDialog;
