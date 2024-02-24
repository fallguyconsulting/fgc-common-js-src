// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//================================================================//
// color
//================================================================//

//----------------------------------------------------------------//
export function copy ( c ) {
    return c ? make ( c.r, c.g, c.b, c.a ) : false;
}

//----------------------------------------------------------------//
export function fromGLInt32 ( glint32 ) {
    
    return {
        r:          (( glint32 >> 0 ) & 0xff ) / 255,
        g:          (( glint32 >> 8 ) & 0xff ) / 255,
        b:          (( glint32 >> 16 ) & 0xff ) / 255,
        a:          (( glint32 >> 24 ) & 0xff ) / 255,
    };
}

//----------------------------------------------------------------//
export function fromHex ( hex ) {

    const color = make ();

    hex = hex.charAt ( 0 ) === '#' ? hex.slice ( 1 ) : hex;

    const component = ( i ) => {
        i = i * 2;
        const n = parseInt ( hex.slice ( i, i + 2 ), 16 ) / 255;
        return Math.round ( n * 100 ) / 100
    }

    if ( hex.length >= 6 ) {
        color.r = component ( 0 );
        color.g = component ( 1 );
        color.b = component ( 2 );
    }

    if ( hex.length === 8 ) {
        color.a = component ( 3 );
    }

    return color;
}

//----------------------------------------------------------------//
export function isValidHex ( hex ) {

    return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test ( hex );
}

//----------------------------------------------------------------//
export function lerp ( c0, c1, t ) {

    return make (
        c0.r + (( c1.r - c0.r ) * t ),
        c0.g + (( c1.g - c0.g ) * t ),
        c0.b + (( c1.b - c0.b ) * t ),
        c0.a + (( c1.a - c0.a ) * t )
    );
}

//----------------------------------------------------------------//
export function make ( r, g, b, a ) {

    return {
        r:      r || 0,
        g:      g || 0,
        b:      b || 0,
        a:      a || 1,
    };
}

//----------------------------------------------------------------//
export function toCSSRGB ( c ) {

    const r = Math.floor ( c.r * 255 );
    const g = Math.floor ( c.g * 255 );
    const b = Math.floor ( c.b * 255 );

    return `rgb(${r},${g},${b})`;
}

//----------------------------------------------------------------//
export function toHexRGB ( c ) {

    const r = Math.floor ( c.r * 255 ).toString ( 16 ).padStart ( 2, '0' );
    const g = Math.floor ( c.g * 255 ).toString ( 16 ).padStart ( 2, '0' );
    const b = Math.floor ( c.b * 255 ).toString ( 16 ).padStart ( 2, '0' );

    return `#${r}${g}${b}`;
}

//----------------------------------------------------------------//
export function toGLInt32 ( c ) {

    const r = Math.floor ( c.r * 255 ) & 0xff;
    const g = Math.floor ( c.g * 255 ) & 0xff;
    const b = Math.floor ( c.b * 255 ) & 0xff;
    const a = Math.floor ( c.a * 255 ) & 0xff;

    return ( r << 0 ) | ( g << 8 ) | ( b << 16 ) | ( a << 24 );
}

//----------------------------------------------------------------//
export function toHexRGBA ( c ) {

    const r = Math.floor ( c.r * 255 ).toString ( 16 ).padStart ( 2, '0' );
    const g = Math.floor ( c.g * 255 ).toString ( 16 ).padStart ( 2, '0' );
    const b = Math.floor ( c.b * 255 ).toString ( 16 ).padStart ( 2, '0' );
    const a = Math.floor ( c.a * 255 ).toString ( 16 ).padStart ( 2, '0' );

    return `#${r}${g}${b}${a}`;
}

//----------------------------------------------------------------//
export function quantize ( c, bits ) {

    bits = Math.max ( 1, bits || 8 );
    const s = Math.pow ( 2, bits );
    
    return make (
        quantizeComponent ( c.r, s ),
        quantizeComponent ( c.g, s ),
        quantizeComponent ( c.b, s ),
        quantizeComponent ( c.a, s ),
    );
}

//----------------------------------------------------------------//
export function quantizeComponent ( c, s ) {

    return Math.min ( 1, Math.floor ( c * s ) / ( s - 1 ));
}
