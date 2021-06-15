// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as token                   from './token';
import * as env                     from 'env';
import Mailchimp                    from 'mailchimp-api-v3'; // https://mailchimp.com/developer/reference/
import nodemailer                   from 'nodemailer';

//================================================================//
// Mailer
//================================================================//
export class Mailer {

    //----------------------------------------------------------------//
    constructor () {

        console.log ( 'GMAIL USER:', env.GMAIL_USER );

        if ( env.MAILCHIMP_API_KEY ) {
            this.mailchimp = new Mailchimp ( env.MAILCHIMP_API_KEY );
        }

        // NOTE: if gmail transport myseriously stops working, log in to the
        // gmail account and make sure "allow less secure apps" is enabled
        // under the security tab. Gmail will "helpfully" disable this
        // setting if it hasn't been used in a while.

        this.mailTransport = nodemailer.createTransport ({
            service: 'gmail',
            auth: {
                user: env.GMAIL_USER,
                pass: env.GMAIL_PASSWORD,
            },
        });
    }

    //----------------------------------------------------------------//
    async mailchimpSubscribeAsync () {

        // const response = await mailchimp.post ( `/lists/${ env.MAILCHIMP_USER_LIST_ID }/members`, {
        //     email_address:      body.email,
        //     email_type:         'html',
        //     status:             'subscribed',
        //     merge_fields: {
        //         VERIFIER:   verifier,
        //     }
        // });
        // console.log ( 'SIGNUP:', JSON.stringify ( response, null, 4 ));
        // result.json ({});
    }

}
