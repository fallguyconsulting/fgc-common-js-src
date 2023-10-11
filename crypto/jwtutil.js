// Copyright (c) 2022 Fall Guy LLC All Rights Reserved.

import * as sodium              from './sodium';
import njwt                     from 'njwt';
import { v4 as uuidv4 }         from 'uuid';

const SECOND_MS     = 1000;
const MINUTE_MS     = SECOND_MS * 60;
const HOUR_MS       = MINUTE_MS * 60;
const DAY_MS        = HOUR_MS * 24;

//================================================================//
// token
//================================================================//

//----------------------------------------------------------------//
export function create ( claims, signingKeyBase64, expiration ) {

    const signingKey = Buffer.from ( signingKeyBase64, 'base64' );

    try {

        const jwt = njwt.create ( claims, signingKey );
        jwt.body.jti = claims.jti || uuidv4 ()

        if ( expiration ) {
            const expTime = (
                (( expiration.days || 0 ) * DAY_MS ) +
                (( expiration.hours || 0 ) * HOUR_MS ) +
                (( expiration.minutes || 0 ) * MINUTE_MS ) +
                (( expiration.seconds || 0 ) * SECOND_MS )
            );
            jwt.setExpiration ( new Date ().getTime () + expTime );
        }
        else {
            jwt.setExpiration ();
        }

        const jwt64 = jwt.compact ();
        return jwt64;
    }
    catch ( error ) {
        console.log ( error );
    }
}

//----------------------------------------------------------------//
export function makeSigningKeyBase64 () {

    return sodium.randomBytes ( 64, 'base64' );
}

//----------------------------------------------------------------//
export function verify ( jwt64, signingKeyBase64 ) {

    if ( !( jwt64 && ( typeof ( jwt64 ) === 'string' ))) return false;

    const signingKey = Buffer.from ( signingKeyBase64, 'base64' );

    try {
        return njwt.verify ( jwt64, signingKey ).body || false;
    }
    catch ( error ) {
        console.log ( error );
        return false;
    }
}
