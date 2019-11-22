// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//----------------------------------------------------------------//
export function assert ( condition, error ) {
    if ( !condition ) throw error || 'Assetion failed.'
}
