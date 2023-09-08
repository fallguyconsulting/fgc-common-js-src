// Copyright (c) 2021 Fall Guy LLC All Rights Reserved.

import * as crypto          from 'crypto';

//----------------------------------------------------------------//
export function encryptGCM ( text, masterkey ) {

    console.log ( 'encrypt', text );

    const iv            = crypto.randomBytes ( 16 );
    const salt          = crypto.randomBytes ( 64 );
    const key           = crypto.pbkdf2Sync ( masterkey, salt, 2145, 32, 'sha512' );
    const cipher        = crypto.createCipheriv ( 'aes-256-gcm', key, iv );
    const encrypted     = Buffer.concat ([ cipher.update ( text, 'utf8' ), cipher.final ()]);
    const tag           = cipher.getAuthTag ();

    console.log ( 'encrypted', encrypted );

    // generate output
    return Buffer.concat ([ salt, iv, tag, encrypted ]).toString ( 'base64' );
}

//----------------------------------------------------------------//
export function decryptGCM ( encdata, masterkey ) {

    const bData         = Buffer.from ( encdata, 'base64' );
    const salt          = bData.slice ( 0, 64 );
    const iv            = bData.slice ( 64, 80 );
    const tag           = bData.slice ( 80, 96 );
    const text          = bData.slice ( 96 );
    const key           = crypto.pbkdf2Sync ( masterkey, salt, 2145, 32, 'sha512' );
    const decipher      = crypto.createDecipheriv ( 'aes-256-gcm', key, iv );

    decipher.setAuthTag ( tag );
    return decipher.update ( text, 'binary', 'utf8' ) + decipher.final ( 'utf8' );
}
