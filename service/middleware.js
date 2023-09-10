// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import * as rest        from './rest';

//----------------------------------------------------------------//
export function getBearerToken ( request ) {
    
    const authorization = request.header ( 'Authorization' );

    if ( authorization ) {
        const tokens = authorization.split ( ' ' );
        const token = ( tokens.length === 2 ) ? (( tokens [ 0 ].toLowerCase () === 'bearer' ) && tokens [ 1 ]) : false;
        return token;
    }
    return false;
}

//----------------------------------------------------------------//
export function withErrorHandler () {
    
    return async ( error, request, response, next ) => {
        rest.handleError ( response, error );
    };
}

//----------------------------------------------------------------//
export function withFactory ( name, func ) {
    
    return async ( request, response, next ) => {
        request [ name ] = func ( request );
        next ();
    };
}

//----------------------------------------------------------------//
export function withLogStart () {
    return async ( request, response, next ) => {
        request.log = response.log = function ( ...args ){
            console.log ( `[${ request._startAt.join ( '' )}] `, ...args );
        }
        response.log ( '--------------------------------' );
        next ();
    };
}


//----------------------------------------------------------------//
export function withPublic () {
    
    return async ( request, response, next ) => {
        next ();
    }; 
}
