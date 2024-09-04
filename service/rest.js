/* eslint-disable no-whitespace-before-property */

import { ServiceError }             from './ServiceError';
import _                            from 'lodash';

export const REST_STATUS = {
    OK:     'OK',
    ERROR:  'ERROR',
};

let onError = null;

//----------------------------------------------------------------//
export function assert ( condition, status, message ) {

    if ( !condition ) throw new ServiceError ( status, message );
}

//----------------------------------------------------------------//
export function init ( onErrorCallback ) {

    onError = onErrorCallback;
}

//----------------------------------------------------------------//
export function handleError ( response, statusOrErrorObj, message, body ) {

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

    const errorObj      = ( typeof ( statusOrErrorObj ) === 'object' ) ? statusOrErrorObj : null;
    const statusInt     = ( typeof ( statusOrErrorObj ) === 'number' ) ? statusOrErrorObj : 400;

    const status = ( errorObj ) ? ( errorObj.status || statusInt ) : statusInt;
    message = ( errorObj ? errorObj.message : message ) || errorForStatusCode ( status );

    if ( errorObj ) {
        console.log ( errorObj );
    }
    else {
        console.log ( message );
    }

    if ( onError ) {
        try {
            if ( errorObj ) {
                const stack = errorObj.stack;
                const calling = errorObj.calling || '';
                onError ( `${ stack }\n${ calling }` );
            }
            else {
                onError ( message );
            }
        }
        catch ( error ) {
            console.log ( 'ERROR HANDLING ERROR!' );
            console.log ( error );
        }
    }

    response.status ( status ).json ( _.assign ({
        status:     REST_STATUS.ERROR,
        message:    message.toString (), 
    }, body || {}));

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
