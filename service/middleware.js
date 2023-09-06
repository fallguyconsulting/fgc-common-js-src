// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

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
        console.log ( error );
        response.status ( error.status ).json ({ error: error.message });
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
