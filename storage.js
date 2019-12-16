// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//----------------------------------------------------------------//
// Delete all data in local storage
export const clear = () => {
    
    try {
        localStorage.clear ();
        console.log ( "Data deleted" );
    }
    catch ( err ) {
        return undefined
    }
}

//----------------------------------------------------------------//
export const getItem = ( k ) => {

    const v = localStorage.getItem ( k );
    //console.log ( "fromLocalStorage", k, v );
    return v !== null ? JSON.parse ( v ) : null;
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
        //console.log ( "inLocalStorage", k, serializedState );
    }
    catch ( err ) {
        console.log ( "Write to local storage failed" );
    }
}
