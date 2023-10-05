// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }       from './assert';
import _                from 'lodash';

//----------------------------------------------------------------//
export function camelToSnake ( str ) {
    return str.replace ( /[a-z][A-Z]/g, m => `${ m.slice ( 0, 1 )}_${ m.slice ( 1 )}` ).toLowerCase ();
}

//----------------------------------------------------------------//
export function caselessCompare ( a, b ) {
    return (( typeof ( a ) === 'string' ) && ( typeof ( b ) === 'string' )) ?
        ( a.localeCompare ( b, undefined, { sensitivity: 'accent' }) === 0 ) :
        ( a === b );
}

//----------------------------------------------------------------//
export function composeClass () {
    
    // instance methods
    // const clazz = arguments [ 0 ];
    const clazz = function () {};
    assert ( clazz );

    clazz.prototype.toString = function () {
        console.log ( 'Called toString' );
        return `Composed Class`;
    };

    for ( let arg = 0; arg < arguments.length; ++arg ) {

        const mixin = arguments [ arg ];
        
        // instance methods
        Object.getOwnPropertyNames ( mixin.prototype ).forEach (( prop ) => {

            if ( prop === 'constructor' ) return;
            
            if ( prop.startsWith ( 'mixin_' )) {

                const append = mixin.prototype [ prop ];
                if ( !append ) return;

                if ( prop.endsWith ( 'Async' )) {
                
                    const original = clazz.prototype [ prop ] || ( async () => {});

                    clazz.prototype [ prop ] = async ( self, ...args ) => {
                        await original ( self, ...args );
                        await ( append.bind ( self ))( ...args );
                    };                    
                }
                else {

                    const original = clazz.prototype [ prop ] || (() => {});

                    clazz.prototype [ prop ] = ( self, ...args ) => {
                        original ( self, ...args );
                        ( append.bind ( self ))( ...args );
                    };
                }
            }
            else {
                
                clazz.prototype [ prop ] = mixin.prototype [ prop ];
            }
        })

        clazz.prototype.isMixin = (() => { return true; });

        // static members
        Object.getOwnPropertyNames ( mixin ).forEach (( prop ) => {
            if (( prop === 'length' ) || ( prop === 'name' ) || ( prop === 'prototype' )) return;
            clazz [ prop ] = mixin [ prop ];
        })
    }

    return clazz;
}

//----------------------------------------------------------------//
export function dateToISOString ( date ) {

    return date.toISOString ().split ( 'T' )[ 0 ];
}

//----------------------------------------------------------------//
export function formatURL ( url, path, query ) {

    url             = URL.parse ( url );
    path            = ( path || '/' ).split ( '/' ).filter ( token => Boolean ( token ));

    url.pathname    = `${ url.path }${ path.join ( '/' )}/`;
    url.query       = query || {};

    url = URL.format ( url );
    return url;
}

//----------------------------------------------------------------//
export function getConfig ( name, fallback ) {
    
    assert ( window, `Missing 'window' object. Config variables are only for browser JS; use environment variables for server.` );
    
    const config = window.config;
    assert ( fallback || config, `Missing config object on window. Check index.html and/or enable SSI. 'config' must be set on 'window' object.` );
    
    const value = _.has ( config, name ) ? config [ name ] : fallback;
    assert ( value !== undefined, `Missing ${ name } config variable.` );
    
    return value;
}

//----------------------------------------------------------------//
export function getEnvBool ( name, fallback ) {

    let value = _.has ( process.env, name ) ? process.env [ name ] : undefined;

    if ( typeof ( value ) === 'string' ) {
        if ( value.toLowerCase () === 'true' ) return true;
        if ( value.toLowerCase () === 'false' ) return false;

        value = parseInt ( value );
        assert ( !isNaN ( value ), `Environment variable ${ name } is NaN.` );
        value = Boolean ( value );
    }
    else if ( value === undefined ) {
        value = fallback;
    }

    assert ( value !== undefined, `Missing ${ name } environment variable.` );
    return value;
}

//----------------------------------------------------------------//
export function getEnvInt ( name, fallback ) {

    let value = _.has ( process.env, name ) ? process.env [ name ] : undefined;

    if ( typeof ( value ) === 'string' ) {
        value = parseInt ( value );
        assert ( !isNaN ( value ), `Environment variable ${ name } is NaN.` );
    }
    else if ( value === undefined ) {
        value = fallback;
    }

    assert ( value !== undefined, `Missing ${ name } environment variable.` );
    return value;
}

//----------------------------------------------------------------//
export function getEnvString ( name, fallback ) {
    const value = _.has ( process.env, name ) ? process.env [ name ] : fallback;
    assert ( value !== undefined, `Missing ${ name } environment variable.` );
    return value;
}

//----------------------------------------------------------------//
export function getMatch ( props, field, fallback ) {
    const match = props.match.params ? props.match.params [ field ] : '';
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
export function makeQueryString ( query ) {

    const pairs = [];

    function pushVal ( k, v ) {
        if (( v === undefined ) || ( v === null ) || ( v === '' )) return;
        pairs.push ( `${ k }=${ v }` );
    }

    for ( let k in query ) {

        const v = query [ k ];

        if ( _.isArray ( v )) {
            for ( let x of v ) {
                pushVal ( k, x );
            }
        }
        else {
            pushVal ( k, v );
        }
    }
    return pairs.length ? `?${ pairs.join ( '&' )}` : '';
}

//----------------------------------------------------------------//
export function makeSingleton ( clazz ) {

    const instance = new clazz ();
    clazz.get = () => { return instance; }
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
export function snakeToCamel ( str ) {
    return str.replace ( /[-_][a-z]/g, m => m.slice ( 1 ).toUpperCase ());
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
export function toNumberStrict ( val ) {

    return (( typeof ( val ) === 'number' ) || ( typeof ( val ) === 'string' )) ? Number ( val ) : NaN;
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
