// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as sesv2           from '@aws-sdk/client-sesv2';
import * as env             from 'env';
import nodemailer           from 'nodemailer';
import SibApiV3Sdk          from 'sib-api-v3-sdk';

let gmailTransport;
let sendinblueAPI;
let sesClient;

//----------------------------------------------------------------//
function formatSender ( email, name ) {

    return name ? `${ name } <${ email }>` : email; 
}

//----------------------------------------------------------------//
export async function send ( params ) {

    const provider = env.EMAIL_PROVIDER || 'gmail';

    if ( provider === 'gmail' ) {
        sendWithGmail ( params );
    }

    if ( provider === 'sendinblue' ) {
        sendWithSendinblue ( params );
    }

    if ( provider === 'ses' ) {
        sendWithSES ( params );
    }
}

//----------------------------------------------------------------//
export async function sendWithGmail ( params ) {

    if ( !gmailTransport ) {
        gmailTransport = nodemailer.createTransport ({
            service: 'gmail',
            auth: {
                user: env.GMAIL_EMAIL,
                pass: env.GMAIL_PASSWORD,
            },
        });
    }

    const { to, subject, text, html } = params;

    await gmailTransport.sendMail ({
        from:               formatSender ( env.GMAIL_EMAIL, env.GMAIL_EMAIL_NAME ),
        to:                 to,
        subject:            subject,
        text:               text || html || '',
        html:               html || text || '',
    });
}

//----------------------------------------------------------------//
export async function sendWithSendinblue ( params ) {

    if ( !sendinblueAPI ) {
        SibApiV3Sdk.ApiClient.instance.authentications [ 'api-key' ].apiKey = env.SENDINBLUE_API_KEY;
        sendinblueAPI = new SibApiV3Sdk.TransactionalEmailsApi ();
    }

    const { to, subject, text, html } = params;

    await sendinblueAPI.sendTransacEmail ({
        subject:            subject,
        sender:             { email: env.SENDINBLUE_EMAIL, name: env.SENDINBLUE_EMAIL_NAME },
        to:                 [{ email: to }],
        textContent:        text || html || '',
        htmlContent:        html || text || '',
    });
}

//----------------------------------------------------------------//
export async function sendWithSES ( params ) {

    if ( !sesClient ) {
        sesClient = env.SURE_AWS_REGION ? new sesv2.SESv2Client ({
            region:             env.SURE_AWS_REGION,
            credentials: {
                accessKeyId:        env.SURE_AWS_ACCESS_KEY_ID,
                secretAccessKey:    env.SURE_AWS_ACCESS_KEY_SECRET,
            },
        }) : null;
    }

    const { to, subject, text, html } = params;

    return sesClient.send ( new sesv2.SendEmailCommand ({
        FromEmailAddress:       formatSender ( env.SES_EMAIL, env.SES_EMAIL_NAME ),
        ReplyToAddresses:       [],
        Destination: {
            ToAddresses:        [ to ],
        },
        Content: {
            Simple: {
                Subject: {
                    Charset:        'UTF-8',
                    Data:           subject || '',
                },
                Body: {
                    Text: {
                        Charset:    'UTF-8',
                        Data:       text || html || '',
                    },
                    Html: {
                        Charset:    'UTF-8',
                        Data:       html || text || '',
                    },
                },
            },
        },
    }));
}
