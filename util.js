// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//----------------------------------------------------------------//
export function caselessCompare ( a, b ) {
    return (( typeof ( a ) === 'string' ) && ( typeof ( b ) === 'string' )) ?
        ( a.localeCompare ( b, undefined, { sensitivity: 'accent' }) === 0 ) :
        ( a === b );
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
