// Copyright (c) 2022 Fall Guy LLC All Rights Reserved.

import fetch            from 'cross-fetch';
import _                from 'lodash';

//----------------------------------------------------------------//
export async function deleteJSON ( url, headers ) {

    return fetchJSON ( url, {
        method:     'DELETE',
        headers:    headers,
    });
}

//----------------------------------------------------------------//
export async function fetchJSON ( url, options = {}) {

    options.headers = options.headers ? _.clone ( options.headers ) : {};
    options.headers [ 'content-type' ] = options.headers [ 'content-type' ] || 'application/json';

    const response  = await fetch ( url, options );
    const text = await response.text ();
        
    let body;
    try {
        body = JSON.parse ( text ); 
    }
    catch ( error ) { // eslint-disable-line no-empty
    }

    if ( response.status >= 400 ) {
        throw {
            status:         response.status,
            statusText:     response.statusText,
            message:        body ? body.message : text,
            body:           body,
        };
    }
    return body;
}

//----------------------------------------------------------------//
export async function getJSON ( url, headers ) {

    return fetchJSON ( url, { headers: headers });
}

//----------------------------------------------------------------//
export async function postJSON ( url, json, headers ) {

    return this.fetchJSON ( url, {
        method:     'POST',
        headers:    headers,
        body:       json ? JSON.stringify ( json ) : undefined,
    });
}

//----------------------------------------------------------------//
export async function putJSON ( url, json, headers ) {

    return this.fetchJSON ( url, {
        method:     'PUT',
        headers:    headers,
        body:       json ? JSON.stringify ( json ) : undefined,
    });
}
