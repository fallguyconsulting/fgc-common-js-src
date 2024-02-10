
//----------------------------------------------------------------//
export function drawEllipse ( setPixel, x0, y0, x1, y1, fill ) {

    // https://zingl.github.io/bresenham.html

    x0 = toPixelCoord ( x0 );
    y0 = toPixelCoord ( y0 );

    x1 = toPixelCoord ( x1 );
    y1 = toPixelCoord ( y1 );

    [ x0, x1 ]  = sort ( x0, x1 );
    [ y0, y1 ]  = sort ( y0, y1 );

    x1          = ( x0 < x1 ) ? x1 - 1 : x1;
    y1          = ( y0 < y1 ) ? y1 - 1 : y1;

    let a       = Math.abs ( x1 - x0 )
    let b       = Math.abs ( y1 - y0 )
    let b1      = b & 1;

    let dx      = 4 * ( 1 - a ) * b * b
    let dy      = 4 * ( b1 + 1 ) * a * a;
    
    let err     = dx + dy + ( b1 * a * a );
    let e2      = 0;

    y0          += Math.floor (( b + 1 ) / 2 );
    y1          = y0 - b1;
    a           *= 8 * a;
    b1          = 8 * b * b;

    do {

        if ( fill ) {
            drawLine ( setPixel, x0, y0, x1, y0 );
            drawLine ( setPixel, x0, y1, x1, y1 );
        }
        else {
            setPixel ( x0, y0 );
            setPixel ( x1, y0 );
            setPixel ( x0, y1 );
            setPixel ( x1, y1 );
        }

        e2 = 2 * err;
        
        if ( e2 <= dy ) {
            y0++;
            y1--;
            err += dy += a;
        } 
        
        if (( e2 >= dx ) || (( 2 * err ) > dy )) {
            x0++;
            x1--;
            err += dx += b1;
        }

    } while ( x0 <= x1 );

    // flat, vertical
    while ( y0 - y1 < b ) {
        setPixel ( x0 - 1, y0 );
        setPixel ( x1 + 1, y0++ ); 
        setPixel ( x0 - 1, y1 );
        setPixel ( x1 + 1, y1-- );
    }
}

//----------------------------------------------------------------//
export function drawLine ( setPixel, x0, y0, x1, y1 ) {

    x0 = toPixelCoord ( x0 );
    y0 = toPixelCoord ( y0 );

    x1 = toPixelCoord ( x1 );
    y1 = toPixelCoord ( y1 );
    
    const dx    = Math.abs ( x1 - x0 );
    const dy    = Math.abs ( y1 - y0 );
    const sx    = ( x0 < x1 ) ? 1 : -1;
    const sy    = ( y0 < y1 ) ? 1 : -1;

    let err     = dx - dy;
    let done    = false;

    while ( !done ) {

        setPixel ( x0, y0 );
        done = (( x0 === x1 ) && ( y0 === y1 ));

        const e2 = err * 2;

        if ( e2 > -dy ) {
            err -= dy;
            x0 += sx;
        }
        
        if ( e2 < dx ) {
            err += dx;
            y0 += sy;
        }
    }
}

//----------------------------------------------------------------//
export function fillRect ( setPixel, x0, y0, x1, y1 ) {

    x0 = toPixelCoord ( x0 );
    y0 = toPixelCoord ( y0 );

    x1 = toPixelCoord ( x1 );
    y1 = toPixelCoord ( y1 );

    const xMax      = Math.max ( x0, x1 );
    const yMax      = Math.max ( y0, y1 );

    for ( let y = Math.min ( y0, y1 ); y < yMax; ++y ) {
        for ( let x = Math.min ( x0, x1 ); x < xMax; ++x ) {
            setPixel ( x, y );
        }
    }
}

//----------------------------------------------------------------//
export function sort ( x0, x1 ) {

    return ( x0 < x1 ) ? [ x0, x1 ] : [ x1, x0 ];
}

//----------------------------------------------------------------//
function toPixelCoord ( x ) {

    return ( x < 0 ) ? Math.ceil ( x ) : Math.floor ( x );
}
