/* eslint-disable no-whitespace-before-property */

import _                            from 'lodash';

export const REST_STATUS = {
    OK:     'OK',
    ERROR:  'ERROR',
};

//----------------------------------------------------------------//
export function handleError ( response, statusOrErrorObj, message ) {

    const errorObj = ( typeof ( statusOrErrorObj ) === 'object' ) ? statusOrErrorObj : false;
    const status = ( typeof ( statusOrErrorObj ) === 'number' ) ? statusOrErrorObj : ( errorObj && errorObj.status ? errorObj.status : 400 );
    message = ( errorObj ? errorObj.message : message ) || '';

    response.status ( status ).json ({
        status:     REST_STATUS.ERROR,
        message:    message.toString (), 
    });
    return false;
}

//----------------------------------------------------------------//
export function handleSuccess ( response, body ) {
    body = body || {};
    if ( !_.has ( body, 'status' )) {
        body.status = REST_STATUS.OK;
    }
    response.json ( body );
    return true;
}
