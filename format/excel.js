// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import _                        from 'lodash';
import * as XLSX                from 'xlsx';

const aaaCache = [];

//----------------------------------------------------------------//
export function aaaToIndex ( aaa ) {

    const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let result = 0;
    for ( let i = 0, j = aaa.length - 1; i < aaa.length; ++i, --j ) {
        result += Math.pow ( base.length, j ) * ( base.indexOf ( aaa [ i ]) + 1 );
    }
    return result - 1;
}

//----------------------------------------------------------------//
export function addrToCoord ( addr ) {

    // this is lazy...
    let col = addr.replace ( /([^a-z])/ig, '' );
    let row = addr.replace ( /([^0-9])/ig, '' );

    col = aaaToIndex ( col );
    row = parseInt ( row ) - 1;

    return [ col, row ];
}

//----------------------------------------------------------------//
export function coordToAddr ( col, row ) {

    col = indexToAAA ( col );
    row = ( row || 0 ) + 1;
    return `${ col }${ row }`;
}

//----------------------------------------------------------------//
export function coordsToRange ( c0, r0, c1, r1 ) {

    return `${ coordToAddr ( c0, r0 )}:${ coordToAddr ( c1, r1 )}`;
}

//----------------------------------------------------------------//
export function indexToAAA ( index ) {

    if ( !aaaCache [ index ]) {

        const baseChar = ( 'A' ).charCodeAt ( 0 );
        let aaa  = '';

        let number = index + 1;

        do {
            number -= 1;
            aaa = String.fromCharCode ( baseChar + ( number % 26 )) + aaa;
            number = ( number / 26 ) >> 0; // quick `floor`
        } while ( number > 0 );

        aaaCache [ index ] = aaa;
    }
    return aaaCache [ index ];
}

//----------------------------------------------------------------//
export function invokeCells ( table ) {

    for ( let r = 0; r < table.length; ++r ) {
        
        const row = table [ r ];
        if ( !row ) continue;

        for ( let c = 0; c < row.length; ++c ) {
            const cell = row [ c ];
            if ( typeof ( cell ) !== 'function' ) continue;
            row [ c ] = cell ( r, c ) || '';
        }
    }
}

//----------------------------------------------------------------//
export function joinRows ( ...args ) {

    const length = Math.max ( ...args.map ( table => table.length ));

    const t = [];
    for ( let r = 0; r < length ; ++r ) {
        const rows = args.map ( table => ( table [ r ] || []));
        t [ r ] = rows.flat ();
    }   
    return t;
}

//----------------------------------------------------------------//
export function padRows ( table, minLen, padVal ) {

    padVal = padVal || '';

    let rowLen = minLen;
    for ( let row of table ) {
        rowLen = Math.max ( rowLen, row.length );
    }

    const t = [];
    for ( let r in table ) {

        const row = table [ r ].slice ()
        t [ r ] = row;

        while ( row.length < rowLen ) {
            row.push ( padVal );
        }
    }
    return t;
}

//================================================================//
// Worksheet
//================================================================//
export class Worksheet {

    //----------------------------------------------------------------//
    constructor ( workbook, sheet ) {

        this.workbook   = workbook;
        this.sheet      = sheet;

        const [ width, height ] = this.getExtents ();

        this.width = width;
        this.height = height;
    }
    
    //----------------------------------------------------------------//
    getCellByCoord ( col, row, fallback ) {

        if (( col < 0 ) || ( row < 0 )) return fallback;

        const cell = this.sheet [ coordToAddr ( col, row )];
        return ( cell && ( cell.v !== undefined )) ? cell : fallback;
    }

    //----------------------------------------------------------------//
    getExtents () {

        const ref = this.sheet [ '!ref' ];
        const maxAddr = ref.split ( ':' )[ 1 ];
        const [ col, row ] = addrToCoord ( maxAddr );
        return [ col + 1, row + 1 ];
    }

    //----------------------------------------------------------------//
    getValueByCoord ( col, row, fallback ) {

        if (( col < 0 ) || ( row < 0 )) return fallback;

        const cell = this.sheet [ coordToAddr ( col, row )];
        return ( cell && ( cell.v !== undefined )) ? cell.v : fallback;
    }
}

//================================================================//
// Workbook
//================================================================//
export class Workbook {

    //----------------------------------------------------------------//
    constructor ( blobOrPath, options ) {

        options = _.assign ({
            type:           'file',
            cellStyles :    true,
            cellNF:         true,
            sheetStubs:     true,
        }, options );

        this.book           = XLSX.read ( blobOrPath, options ); // defaut to file path
        this.sheets         = this.book.Sheets;
        this.sheetNames     = this.book.SheetNames;
    }

    //----------------------------------------------------------------//
    findSheet ( sheetname ) {

        let sheetID = this.sheetNames [ sheetname ] || false;

        if ( !sheetID ) {
            for ( let name in this.sheetNames ) {
                if ( name.localeCompare ( sheetname, undefined, { sensitivity: 'accent' }) === 0 ) {
                    sheetname = name;
                    break;
                }
            }
        }

        return sheetname ? this.getSheet ( sheetname ) : false;
    }

    //----------------------------------------------------------------//
    getSheet ( sheetname ) {

        sheetname = ( typeof ( sheetname ) === 'string' ) ? sheetname : this.sheetNames [ sheetname ]
        const sheet = this.sheets [ sheetname ];
        return sheet ? new Worksheet ( this, sheet ) : false;
    }

    //----------------------------------------------------------------//
    getSheetsMatchingPattern ( sheetnameRegEx ) {

        let matches = false;

        for ( const name of this.sheetNames ) {
            if ( name.match ( sheetnameRegEx )) {
                matches = matches || [];
                matches.push ( this.sheets [ name ]); 
            }
        }

        return matches;
    }
}


