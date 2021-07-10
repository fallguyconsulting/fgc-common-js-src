/* eslint-disable no-whitespace-before-property */

import _                            from 'lodash';

export const REST_STATUS = {
    OK:     'OK',
    ERROR:  'ERROR',
};

//----------------------------------------------------------------//
export function handleError ( response, error ) {
    response.status ( error.status ? error.status : 400 ).json ({
        status: REST_STATUS.ERROR,
        message: error.message, 
    });
}

//----------------------------------------------------------------//
export function handleSuccess ( response, body ) {
    body = body || {};
    if ( !_.has ( body, 'status' )) {
        body.status = REST_STATUS.OK;
    }
    response.json ( body );
}
