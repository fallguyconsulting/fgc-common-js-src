// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//================================================================//
// rect
//================================================================//

//----------------------------------------------------------------//
export function copy ( r ) {
    return r ? make ( r.x0, r.y0, r.x1, r.y1 ) : false;
}

//----------------------------------------------------------------//
export function make ( x0, y0, x1, y1 ) {

    return {
        x0:     x0,
        y0:     y0,
        x1:     x1,
        y1:     y1,
        w:      x1 - x0,
        h:      y1 - y0,
    };
}

//----------------------------------------------------------------//
export function makeWH ( x0, y0, w, h) {

    return {
        x0:     x0,
        y0:     y0,
        x1:     x0 + w,
        y1:     y0 + h,
        w:      w,
        h:      h,
    };
}

//----------------------------------------------------------------//
export function grow ( r0, r1 ) {

    r0 = r0 || r1;
    r1 = r1 || r0;

    if ( r0 === r1 ) return copy ( r0 );

    return make (
        ( r0.x0 < r1.x0 ) ? r0.x0 : r1.x0,
        ( r0.y0 < r1.y0 ) ? r0.y0 : r1.y0,
        ( r0.x1 > r1.x1 ) ? r0.x1 : r1.x1,
        ( r0.y1 > r1.y1 ) ? r0.y1 : r1.y1
    );
}

//----------------------------------------------------------------//
export function height ( r ) {
    return r.y1 - r.y0;
}

//----------------------------------------------------------------//
export function offset ( r, x, y ) {
    return make (
        r.x0 + x,
        r.y0 + y,
        r.x1 + x,
        r.y1 + y,
    );
}

//----------------------------------------------------------------//
export function scale ( r, s ) {
    return make (
        r.x0 * s,
        r.y0 * s,
        r.x1 * s,
        r.y1 * s,
    );
}

//----------------------------------------------------------------//
export function width ( r ) {
    return r.x1 - r.x0;
}
