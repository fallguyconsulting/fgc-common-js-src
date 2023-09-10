// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import { assert }                           from '../assert';
import * as util                            from '../util';
import { DBColumnBuilder }                  from './DBColumnBuilder';
import _                                    from 'lodash';

//----------------------------------------------------------------//
function commas ( str ) {
    return str.join ( ', ' );
}

//================================================================//
// DBDataMapper
//================================================================//
export class DBDataMapper {

    columnDefs          = [];
    uniques             = [];
    fields              = [];
    fieldsByDBName      = {};
    fieldsByJSName      = {};

    //----------------------------------------------------------------//
    async affirmAsync ( conn ) {

        const decls = [];
        const values = [];

        for ( let field of this.fields ) {

            const def = field.def;

            let defaultSQL = '';
            if ( def.value !== null ) {
                defaultSQL = 'DEFAULT ?';
                this.pushValue ( values, field );
            }
            decls.push ([ field.dbName, def.type, def.nullable, def.increment, defaultSQL ].filter (( e ) => e ).join ( ' ' ));
        }

        for ( let field of this.fields ) {
            if ( !field.opt.isPrimary ) continue;
            decls.push ( `PRIMARY KEY ( ${ field.dbName } )` );
        }

        for ( let field of this.fields ) {
            if ( !field.def.foreign ) continue;
            const foreign = field.def.foreign;
            decls.push ( `FOREIGN KEY ( ${ field.dbName } ) REFERENCES ${ foreign.tableName } ( ${ foreign.columnName } ) ON DELETE CASCADE` );
        }

        for ( let unique of this.uniques ) {
            decls.push ( `UNIQUE KEY ( ${ commas ( unique )} )` );
        }

        const sql = `CREATE TABLE IF NOT EXISTS ${ this.dbName } ( ${ commas ( decls )} )`;
        await conn.query ( sql, ...values );
    }

    //----------------------------------------------------------------//
    constructor ( name, version ) {

        this.jsName         = name;
        this.dbName         = util.camelToSnake ( name );
        this.version        = version;

        this.defineColumn ( 'id' ).integer ().primary ().increment ();
    }

    //----------------------------------------------------------------//
    async countAsync ( conn, key ) {

        const [ whereSQL, whereValues ] = this.keyToWhereSQL ( key );

        const row = ( await conn.query ( `SELECT COUNT ( id ) AS count FROM ${ this.dbName } ${ whereSQL }`, ...whereValues ))[ 0 ];
        return row ? row.count : 0;
    }

    //----------------------------------------------------------------//
    async createAsync ( conn, model ) {

        const names     = [];
        const marks     = [];
        const values    = [];

        for ( let field of this.fields ) {

            if ( field.dbName === 'id' ) continue;

            if ( model [ field.jsName ] === undefined ) {
                model [ field.jsName ] = field.def.value;
            }

            names.push ( field.dbName );
            marks.push ( '?' );
            this.pushValue ( values, field, model [ field.jsName ]);
        }

        const sql = `INSERT INTO ${ this.dbName } ( ${ commas ( names )} ) VALUES ( ${ commas ( marks )} )`;
        model.id = ( await conn.query ( sql, ...values )).insertId;
        
        return model;
    }

    //----------------------------------------------------------------//
    decodeValue ( field, value ) {

        return ( field.def.serialized ) ? ( value ? JSON.parse ( value ) : null ) : value;
    }

    //----------------------------------------------------------------//
    defineColumn ( jsName ) {

        const dbName = util.camelToSnake ( jsName );

        assert ( this.fieldsByJSName [ jsName ] === undefined, `Field name ${ jsName } already exists.` );
        assert ( this.fieldsByDBName [ dbName ] === undefined, `Field name ${ dbName } already exists.` );

        const columnDef = new DBColumnBuilder ( dbName, jsName );
        this.columnDefs.push ( columnDef );

        const field = {
            dbName:         columnDef.dbName,
            jsName:         columnDef.jsName,
            def:            columnDef.def,
            opt:            columnDef.opt,
        }

        this.fields.push ( field );
        this.fieldsByDBName [ field.dbName ] = field;
        this.fieldsByJSName [ field.jsName ] = field;
        
        return columnDef;
    }

    //----------------------------------------------------------------//
    defineUnique ( ...jsNames ) {

        this.uniques.push ( jsNames.map (( n ) => util.camelToSnake ( n )));
    }

    //----------------------------------------------------------------//
    async deleteAsync ( conn, key ) {
        
        if ( !key ) return;

        const [ whereSQL, whereValues ] = this.keyToWhereSQL ( key );

        const sql = `DELETE FROM ${ this.dbName } ${ whereSQL }`;
        await conn.query ( sql, ...whereValues );
    }

    //----------------------------------------------------------------//
    encodeValue ( field, value ) {
        
        value = ( value === undefined ) ? field.def.value : value;
        return ( field.def.serialized ) ? JSON.stringify ( value ) : value;
    }

    //----------------------------------------------------------------//
    async findAsync ( conn, key ) {

        const [ whereSQL, whereValues ] = this.keyToWhereSQL ( key );

        const sql = `SELECT * FROM ${ this.dbName } ${ whereSQL }`;
        const rows = await conn.query ( sql, ...whereValues );

        return rows.map (( row ) => this.rowToModel ( row ));
    }

    //----------------------------------------------------------------//
    async findForeignAsync ( conn, key, foreignDM, foreign ) {

        const field     = this.fieldsByJSName [ foreign ];
        foreign         = field.def.foreign;

        assert ( foreignDM.fieldsByDBName [ foreign.columnName ], `No such column in ${ foreignDM.jsName }` );

        // this is the WHERE clause for the table
        const [ whereSQL, whereValues ] = this.keyToWhereSQL ( key );
        
        const sql = `
            SELECT      ${ foreign.tableName }.*
            FROM        ${ this.dbName }
            JOIN        ${ foreign.tableName  } ON ${ this.dbName }.${ field.dbName } = ${ foreign.tableName }.${ foreign.columnName }
            ${ whereSQL }
        `;

        const rows = await conn.query ( sql, ...whereValues );
        return rows.map (( row ) => foreignDM.rowToModel ( row ));
    }

    //----------------------------------------------------------------//
    isValidID ( key ) {

        return ( this.keyToID ( key ) > 0 );
    }

    //----------------------------------------------------------------//
    keyToID ( key ) {

        key = ( typeof ( key ) === 'number' ) ? key : parseInt ( key );
        return isNaN ( key ) ? -1 : key;
    }

    //----------------------------------------------------------------//
    keyToWhereSQL ( key ) {

        if ( key === undefined ) return [ '', []];

        const whereFields = [];
        const whereValues = [];

        if ( typeof ( key ) === 'object' ) {
            for ( let jsName in key ) {
                const field = this.fieldsByJSName [ jsName ];
                whereFields.push ( `${ field.dbName } = ?` );
                whereValues.push ( key [ jsName ]);
            }
        }
        else {
            key = this.keyToID ( key );
            assert ( key > 0, 'Invalid ID' );
            whereFields.push ( 'id = ?' );
            whereValues.push ( key );
        }
        const sql = ( whereFields.length > 0 ) ? `WHERE ${ whereFields.join ( ' AND ' )}` : '';
        return [ sql, whereValues ];
    }

    //----------------------------------------------------------------//
    async loadAsync ( conn, key ) {

        if ( !key ) return null;

        const [ whereSQL, whereValues ] = this.keyToWhereSQL ( key );

        const sql = `SELECT * FROM ${ this.dbName } ${ whereSQL } LIMIT 1`;
        const row = ( await conn.query ( sql, ...whereValues ))[ 0 ];

        return this.rowToModel ( row );
    }

    //----------------------------------------------------------------//
    async migrateAsync ( conn ) {

        await ( this.affirmAsync ( conn ));
    }

    //----------------------------------------------------------------//
    pushValue ( values, field, value ) {

        values.push ( this.encodeValue ( field, value ));
    }

    //----------------------------------------------------------------//
    rowToModel ( row ) {

        if ( !row ) return null;

        const model = {};
        const snapshot = {};
        for ( let dbName in row ) {

            const field = this.fieldsByDBName [ dbName ];
            if ( !field ) continue;

            const value = this.decodeValue ( field, row [ dbName ]);

            model [ field.jsName ]      = value;
            snapshot [ field.jsName ]   = value;
        }
        // model.snapshot = snapshot; // TODO: reenable via flags
        return model;
    }

    //----------------------------------------------------------------//
    async saveAsync ( conn, model ) {

        assert ( model, 'Missing model for save.' );

        if ( !model.id || ( model.id === -1 )) {
            
            model = await this.createAsync ( conn, model );
        }
        else {

            const names     = [];
            const values    = [];

            for ( let field of this.fields ) {

                if ( field.dbName === 'id' ) continue;

                const value = model [ field.jsName ];
                if ( model.snapshot &&  _.isEqual ( value, model.snapshot [ field.jsName ])) continue;

                names.push ( `${ field.dbName } = ?` );
                this.pushValue ( values, field, value );
            }

            if ( values.length > 0 ) {

                this.pushValue ( values, this.fieldsByDBName.id, model.id );

                const sql = `UPDATE ${ this.dbName } SET ${ commas ( names )} WHERE id = ?`;
                await conn.query ( sql, ...values );
            }
        }
        return model;
    }

    //----------------------------------------------------------------//
    async upsertAsync ( conn, model ) {

        const namesForInsert    = [];
        const namesForUpdate    = [];
        const values            = [];
        const marks             = [];

        for ( let field of this.fields ) {

            if ( field.dbName === 'id' ) continue;

            const value = model [ field.jsName ];
            if ( model.snapshot &&  _.isEqual ( value, model.snapshot [ field.jsName ])) continue;

            namesForInsert.push ( field.dbName );
            namesForUpdate.push ( `${ field.dbName } = ?` );
            this.pushValue ( values, field, value );
            marks.push ( '?' );
        }

        const sql = `
            INSERT
                INTO ${ this.dbName } ( ${ commas( namesForInsert )} )
                VALUE ( ${ commas ( marks )} )
            ON DUPLICATE KEY UPDATE
                ${ commas ( namesForUpdate )}
        `;

        await conn.query ( sql, ...values.concat ( values ));
    }
}
