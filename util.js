// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { v4 as uuidv4 }     from 'uuid';

//----------------------------------------------------------------//
export function caselessCompare ( a, b ) {
    return (( typeof ( a ) === 'string' ) && ( typeof ( b ) === 'string' )) ?
        ( a.localeCompare ( b, undefined, { sensitivity: 'accent' }) === 0 ) :
        ( a === b );
}

//----------------------------------------------------------------//
export function dateToISOString ( date ) {

    return date.toISOString ().split ( 'T' )[ 0 ];
}

//----------------------------------------------------------------//
export function generateUUIDV4 () {

    return uuidv4 ();
}

//----------------------------------------------------------------//
export function getMatch ( props, field, fallback ) {
    const match = props.match.params && props.match.params [ field ] || '';
    return match.length > 0 ? match : ( fallback || '' );
}

//----------------------------------------------------------------//
export function greater ( x, y ) {
    return x > y ? x : y;
}

//----------------------------------------------------------------//
export function indexToDate ( startDate, index ) {

    let date = new Date ( startDate );
    date.setDate ( date.getDate () + index );

    return dateToISOString ( date );
}

//----------------------------------------------------------------//
export function isNumber ( number ) {

    return (( typeof ( number ) === 'number' ) && !isNaN ( number ));
}

//----------------------------------------------------------------//
export function isString ( value ) {

    return (( typeof ( value ) === 'string' ) || ( value instanceof String ));
}

//----------------------------------------------------------------//
export function javascriptEscape ( str ) {
    return str
        .replace ( /(\n)/g, '\\n' )
        .replace ( /(")/g,  '"' )
        .replace ( /(\r)/g, '\\r' )
        .replace ( /(\t)/g, '\\t' )
        .replace ( /(\f)/g, '\\f' );
}

//----------------------------------------------------------------//
export function randomInt ( max ) {

    return Math.floor ( Math.random () * Math.floor ( max ));
}

//----------------------------------------------------------------//
export function shuffle ( array ) {

    array = array.slice ();

    for ( let i = array.length - 1; i > 0; i-- ) {
        const j = Math.floor ( Math.random () * ( i + 1 )); // random index from 0 to i
        [ array [ i ], array [ j ]] = [ array [ j ], array [ i ]];
    }
    return array;
}

//----------------------------------------------------------------//
export function sleep ( millis ) {
    return new Promise ( resolve => setTimeout ( resolve, millis ));
}

//----------------------------------------------------------------//
export function toggleArrayMember ( array, item ) {

    array = array ? array.slice () : [];
    const index = array.indexOf ( item );

    if ( index < 0 ) {
        array.push ( item );
    }
    else {
        array.splice ( index, 1 );
    }
    return array;
}

//----------------------------------------------------------------//
export function toNumberOrFalse ( val, types ) {

    types = types || [ 'string', 'number' ];
    return types.includes ( typeof ( val ))  ? Number ( val ) : false;
}

//----------------------------------------------------------------//
export function toStringOrFalse ( val, types ) {

    types = types || [ 'string', 'number' ];
    return types.includes ( typeof ( val ))  ? String ( val ) : false;
}

//----------------------------------------------------------------//
export function wrapLines ( str, width ) {

    const lines = [];

    while ( str.length ) {
        lines.push ( str.slice ( 0, width ));
        str = str.slice ( width );
    }
    return lines.join ( '\n' );
}
