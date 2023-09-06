/* eslint-disable no-whitespace-before-property */

import _                            from 'lodash';

export const REST_STATUS = {
    OK:     'OK',
    ERROR:  'ERROR',
};

//----------------------------------------------------------------//
export function handleError ( response, statusOrErrorObj, message ) {

    const errorForStatusCode = ( status ) => {
        switch ( status ) {
            case 400:   return 'Bad Request.';
            case 401:   return 'Unauthorized.'; // unauthenticated
            case 403:   return 'Forbidden.'; // authenticated but not authorized
            case 404:   return 'Not Found.';
            case 405:   return 'Method Not Allowed.';
            case 406:   return 'Not Acceptable.';
            case 408:   return 'Request Timeout.';
            case 409:   return 'Conflict.';
        }
        return 'Unknown error.';
    }

    const errorObj = ( typeof ( statusOrErrorObj ) === 'object' ) ? statusOrErrorObj : false;
    const status = ( typeof ( statusOrErrorObj ) === 'number' ) ? statusOrErrorObj : ( errorObj && errorObj.status ? errorObj.status : 400 );
    message = ( errorObj ? errorObj.message : message ) || errorForStatusCode;

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
