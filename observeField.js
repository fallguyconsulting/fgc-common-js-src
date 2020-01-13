// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as storage             from './storage';
import { extendObservable, isObservable, observe } from 'mobx';
import { deepObserve }          from 'mobx-utils';

//----------------------------------------------------------------//
export function caselessCompare ( a, b ) {
    return (( typeof ( a ) === 'string' ) && ( typeof ( b ) === 'string' )) ?
        ( a.localeCompare ( b, undefined, { sensitivity: 'accent' }) === 0 ) :
        ( a === b );
}

//----------------------------------------------------------------//
export function getMatch ( props, field, fallback ) {
    let match = props.match.params && props.match.params [ field ] || '';
    return match.length > 0 ? match : ( fallback || '' );
}

//----------------------------------------------------------------//
export function greater ( x, y ) {
    return x > y ? x : y;
}

//----------------------------------------------------------------//
export function javascriptEscape ( str ) {
    return str
        .replace ( /(\n)/g, `\\n` )
        .replace ( /(\")/g, `\"` )
        .replace ( /(\r)/g, `\\r` )
        .replace ( /(\t)/g, `\\t` )
        .replace ( /(\f)/g, `\\f` );
}

//----------------------------------------------------------------//
export function lesser ( x, y ) {
    return x < y ? x : y;
}

//----------------------------------------------------------------//
export function observeField ( owner, field, callback ) {

    let valueDisposer;

    const setValueObserver = () => {

        valueDisposer && valueDisposer (); // not strictly necessary, but why not?

        if ( isObservable ( owner [ field ])) {
            valueDisposer = deepObserve ( owner [ field ], callback );
        }
    }

    setValueObserver ();

    let fieldDisposer = observe ( owner, field, ( change ) => {
        setValueObserver ();
        callback ( change );
    });

    return () => {
        fieldDisposer ();
        valueDisposer && valueDisposer ();
    }
}

//----------------------------------------------------------------//
export function randomInt ( max ) {

    return Math.floor ( Math.random () * Math.floor ( max ));
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
        str = str.slice ( width )
    }
    return lines.join ( '\n' );
}
