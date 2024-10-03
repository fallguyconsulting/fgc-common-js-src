// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }       from './assert';
import _                from 'lodash';

//----------------------------------------------------------------//
export function dateToDisplayString ( date ) {

    if ( !date ) return '';

    // date = new Date ( `${ date.toISOString ().split ( 'T' )[ 0 ]}T00:00:00` );
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    return new Date ( date ).toLocaleDateString ( 'en-GB', options ).replaceAll ( ' ', '-' );
}

//----------------------------------------------------------------//
export function dateToHTMLInputString ( date ) {

    if ( !date ) return '';
    return new Date ( date ).toISOString ().split ( 'T' )[ 0 ];
} 

//----------------------------------------------------------------//
export function localDateFromClampedISO ( dateString ) {

    if ( !dateString ) return null;

    if ( dateString instanceof Date ) {
        return new Date ( dateString );
    } 

    return new Date ( `${ dateString.split ( 'T' )[ 0 ]}T00:00:00` );
}

//----------------------------------------------------------------//
export function localDateToClampedISO ( date ) {
    if ( !date ) return '';
    return `${ new Date ( date ).toISOString ().split ( 'T' )[ 0 ]}T00:00:00.000Z`;
}
