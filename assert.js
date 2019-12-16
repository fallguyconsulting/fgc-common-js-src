// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//----------------------------------------------------------------//
export function assert ( condition, error ) {

    if ( !condition ) {
        console.log ( error );
        console.trace ();
        throw error || 'Assetion failed.'
    }
}
