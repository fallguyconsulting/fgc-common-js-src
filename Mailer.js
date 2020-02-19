// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { token }                    from './token';
import Mailchimp                    from 'mailchimp-api-v3'; // https://mailchimp.com/developer/reference/
import nodemailer                   from 'nodemailer';

//================================================================//
// Mailer
//================================================================//
export class Mailer {

    //----------------------------------------------------------------//
    constructor ( env ) {

        this.env = env;

        if ( env.MAILCHIMP_API_KEY ) {
            this.mailchimp = new Mailchimp ( this.env.MAILCHIMP_API_KEY );
        }

        this.mailTransport = nodemailer.createTransport ({
            service: 'gmail',
            auth: {
                user: this.env.GMAIL_USER,
                pass: this.env.GMAIL_PASSWORD,
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

    //----------------------------------------------------------------//
    async sendVerifierEmailAsync ( email, redirect, subject, textTemplate, htmlTemplate, signingKey ) {
        
        const context = {
            verifier: token.create ( email, 'localhost', 'self', signingKey ),
            redirect: redirect || '/',
        };

        const text = textTemplate ( context );
        const html = htmlTemplate ( context );

        await this.mailTransport.sendMail ({
            from:       'nodemailer@fallguyconsulting.com',
            to:         email,
            subject:    subject,
            text:       text,
            html:       html,
        });

        return context.verifier;
    }
}
