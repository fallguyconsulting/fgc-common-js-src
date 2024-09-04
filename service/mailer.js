// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as sesv2           from '@aws-sdk/client-sesv2';

let sesClient;

//----------------------------------------------------------------//
function formatSender ( email, name ) {

    return name ? `${ name } <${ email }>` : email; 
}

//----------------------------------------------------------------//
export function init ( sesRegion, sesAccessKeyID, sesAccessKeySecret ) {

    if ( sesClient ) return;

     sesClient = new sesv2.SESv2Client ({
        region:             sesRegion,
        credentials: {
            accessKeyId:        sesAccessKeyID,
            secretAccessKey:    sesAccessKeySecret,
        },
    });
}

//----------------------------------------------------------------//
export async function send ( params ) {

    if ( !sesClient ) return;

    const { to, subject, text, html } = params;

    return sesClient.send ( new sesv2.SendEmailCommand ({
        FromEmailAddress:       formatSender ( params.fromEmail, params.fromName || '' ),
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
