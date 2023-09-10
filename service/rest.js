/* eslint-disable no-whitespace-before-property */

import { ServiceError }             from './ServiceError';
import _                            from 'lodash';

export const REST_STATUS = {
    OK:     'OK',
    ERROR:  'ERROR',
};

//----------------------------------------------------------------//
export function assert ( condition, status, message ) {

    if ( !condition ) throw new ServiceError ( status, message );
}

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

    const errorObj = ( typeof ( statusOrErrorObj ) === 'object' ) ? statusOrErrorObj : null;
    const status = ( errorObj ) ? ( errorObj.status || 400 ) : 400;
    message = ( errorObj ? errorObj.message : message ) || errorForStatusCode;

    if ( errorObj ) {
        console.log ( errorObj );
    }
    else {
        console.log ( message );
    }

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
