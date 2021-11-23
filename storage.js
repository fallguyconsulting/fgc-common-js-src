// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//----------------------------------------------------------------//
// Delete all data in local storage
export const clear = () => {
    
    try {
        localStorage.clear ();
        console.log ( "Data deleted" );
    }
    catch ( error ) {
        console.log ( error );
        return undefined
    }
}

//----------------------------------------------------------------//
export const dump = () => {

    const length = localStorage.length;
    const store = {};
    for ( let i = 0; i < length; ++i ) {
        const key = localStorage.key ( i );
        store [ key ] = localStorage.getItem ( key );

        try {
            const json = JSON.parse ( store [ key ]);
            if ( json ) {
                store [ key ] = json;
            }
        }
        catch ( error ) {
        }
    }
    return store;
}

//----------------------------------------------------------------//
export const getItem = ( k, fallback ) => {

    const v = localStorage.getItem ( k );
    return v !== null ? JSON.parse ( v ) : ( fallback === undefined ? null : fallback );
}

//----------------------------------------------------------------//
export const removeItem = ( k ) => {

    localStorage.removeItem ( k );
}

//----------------------------------------------------------------//
export const setItem = ( k, v ) => {

    try {
        const serializedState = JSON.stringify ( v );
        localStorage.setItem ( k, serializedState );
    }
    catch ( error ) {
        console.log ( error );
        console.log ( "Write to local storage failed" );
    }
}
