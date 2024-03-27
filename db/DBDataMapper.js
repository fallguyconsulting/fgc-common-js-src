// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import { assert }                           from '../assert';
import * as util                            from '../util';
import { DBColumnBuilder }                  from './DBColumnBuilder';
import { MySQL }                            from './MySQL';
import _                                    from 'lodash';
import * as luxon                           from 'luxon';

const MYSQL_DATETIME_FORMAT = 'yyyy-MM-dd hh:mm:ss';

//----------------------------------------------------------------//
function commas ( str ) {
    return str.join ( ', ' );
}

//================================================================//
// DBDataMapper
//================================================================//
export class DBDataMapper {

    _conn               = null;
    dmName              = '';
    columnDefs          = [];
    uniques             = [];
    fields              = [];
    fieldsByDBName      = {};
    fieldsByJSName      = {};
    jsonBodies          = {};
    jsonBodiesByMember  = {};
    modelType           = null;

    //----------------------------------------------------------------//
    async affirmAsync () {

        const decls = [];
        const values = [];

        for ( let field of this.fields ) {

            const def = field.def;

            let defaultSQL = def.defaultSQL;

            if ( ! ( defaultSQL || ( def.value === null ) || def.serialized )) {
                defaultSQL = 'DEFAULT ?';
                values.push ( this.encodeValue ( field ));
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
        await this.conn.query ( sql, ...values );
    }

    //----------------------------------------------------------------//
    get conn () {
        return this._conn ? this._conn : MySQL.getLocalConnection ();
    }

    //----------------------------------------------------------------//
    constructor ( conn, name, version ) {

        this._conn          = conn || null;
        this.jsName         = name;
        this.version        = version;
            
        this.dbName = util.camelToSnake ( name );
        this.virtual_initSchema ( this.makeBuilder ());
    }

    //----------------------------------------------------------------//
    async countAsync ( key ) {

        const [ whereSQL, whereValues ] = this.keyToWhereSQL ( key );

        const row = ( await this.conn.query ( `SELECT COUNT ( id ) AS count FROM ${ this.dbName } ${ whereSQL }`, ...whereValues ))[ 0 ];
        return row ? row.count : 0;
    }

    //----------------------------------------------------------------//
    async createAsync ( model ) {

        const names     = [];
        const marks     = [];
        const values    = [];

        for ( let field of this.fields ) {
            if ( field.dbName === 'id' ) continue;
            if ( model [ field.jsName ] === undefined ) {
                model [ field.jsName ] = field.def.value;
            }
        }

        this.modelToRow ( model, ( field, value ) => {
            names.push ( field.dbName );
            marks.push ( '?' );
            values.push ( this.encodeValue ( field, value ));
        });

        const sql = `INSERT INTO ${ this.dbName } ( ${ commas ( names )} ) VALUES ( ${ commas ( marks )} )`;
        model.id = ( await this.conn.query ( sql, ...values )).insertId;
        
        return model;
    }

    //----------------------------------------------------------------//
    decodeValue ( field, value ) {

        if ( value !== null ) {
            if ( field.def.serialized ) return JSON.parse ( value );
            if ( field.def.type === 'DATETIME' ) {
                return luxon.DateTime.fromFormat ( value, MYSQL_DATETIME_FORMAT, { zone: 'UTC' }).setZone ( 'local' );
            }
        }
        return value;
    }

    //----------------------------------------------------------------//
    async deleteAsync ( key ) {
        
        if ( !key ) return;

        const [ whereSQL, whereValues ] = this.keyToWhereSQL ( key );

        const sql = `DELETE FROM ${ this.dbName } ${ whereSQL }`;
        await this.conn.query ( sql, ...whereValues );
    }

    //----------------------------------------------------------------//
    encodeValue ( field, value ) {
        
        value = ( value === undefined ) ? field.def.value : value;
        if ( value ) {
            if ( field.def.serialized ) return JSON.stringify ( value );
            if ( field.def.type === 'DATETIME' ) {
                return value.setZone ( 'UTC' ).toFormat ( MYSQL_DATETIME_FORMAT );
            }
        }
        return value;
    }

    //----------------------------------------------------------------//
    async findAsync ( key ) {

        const [ whereSQL, whereValues ] = this.keyToWhereSQL ( key );

        const sql = `SELECT * FROM ${ this.dbName } ${ whereSQL }`;
        const rows = await this.conn.query ( sql, ...whereValues );

        return rows.map (( row ) => this.rowToModel ( row ));
    }

    //----------------------------------------------------------------//
    async findForeignAsync ( key, foreignDM, foreign ) {

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

        const rows = await this.conn.query ( sql, ...whereValues );
        return rows.map (( row ) => foreignDM.rowToModel ( row ));
    }

    //----------------------------------------------------------------//
    initJSFields ( obj, from ) {
        
        for ( let field of this.fields ) {
            obj [ field.jsName ] = ( from && ( from [ field.jsName ] !== undefined )) ? from [ field.jsName ] : field.def.value;
        }
        return obj;
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
    async loadAsync ( key ) {

        if ( !key ) return null;

        const [ whereSQL, whereValues ] = this.keyToWhereSQL ( key );

        const sql = `SELECT * FROM ${ this.dbName } ${ whereSQL } LIMIT 1`;
        const row = ( await this.conn.query ( sql, ...whereValues ))[ 0 ];

        return this.rowToModel ( row );
    }

    //----------------------------------------------------------------//
    makeBuilder () {

        const defineColumn = ( jsName, dbName ) => {

            dbName = dbName || util.camelToSnake ( jsName );

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
    
        const defineUnique = ( ...jsNames ) => {

            this.uniques.push ( jsNames.map (( n ) => this.fieldsByJSName [ n ].dbName ));
        }

        const defineJSONBody = ( name, members ) => {

            const jsonBody = this.jsonBodies [ name ] || [];
            this.jsonBodies [ name ] = jsonBody;

            for ( let member of members ) {
                if ( this.jsonBodiesByMember [ member ]) continue;
                this.jsonBodiesByMember [ member ] = name;
                jsonBody.push ( member );
            }
        }

        return {
            defineColumn:       defineColumn,
            defineUnique:       defineUnique,
            defineJSONBody:     defineJSONBody,
        };
    }

    //----------------------------------------------------------------//
    makeModel ( from, fromRow ) {

        const modelType = this.modelType;
        if ( !modelType ) return from;

        const model = new modelType ();
        this.initJSFields ( model );
        
        if ( from ) {
            _.assign ( model, from );
            if ( fromRow ) {
                const snapshot = _.cloneDeep ( model );
                model.getSnapshot = () => snapshot;
            }
        }

        model.getConnection = () => this.conn;
        model.getDM = () => this;

        return model;
    }

    //----------------------------------------------------------------//
    async migrateAsync () {

        await ( this.affirmAsync ());
    }

    //----------------------------------------------------------------//
    modelToRow ( model, onField ) {

        const snapshot = model.getSnapshot && model.getSnapshot ();

        for ( let field of this.fields ) {

            if ( field.dbName === 'id' ) continue;
            if ( this.jsonBodies [ field.jsName ] || this.jsonBodiesByMember [ field.jsName ]) continue;

            const value = model [ field.jsName ];
            if ( snapshot &&  _.isEqual ( value, snapshot [ field.jsName ])) continue;

            onField ( field, value );
        }

        for ( let jsonBodyName in this.jsonBodies ) {
            
            const jsonBody = this.jsonBodies [ jsonBodyName ];

            const value     = {};
            let changed     = false;

            for ( let member of jsonBody ) {
                changed = changed || !( snapshot && _.isEqual ( value, snapshot [ member ]));
                value [ member ] = model [ member ];
            }

            if ( changed ) {
                const field = this.fieldsByJSName [ jsonBodyName ];
                onField ( field, value );
            }
        }
    }

    //----------------------------------------------------------------//
    newModel ( ...args ) {

        const modelType = this.modelType;
        if ( !modelType ) return {};

        const model = new modelType ( ...args );
        
        model.getConnection = () => this.conn;
        model.getDM = () => this;

        return model;
    }

    //----------------------------------------------------------------//
    rowToModel ( row ) {

        if ( !row ) return null;

        let model = {};
        for ( let dbName in row ) {
            const field = this.fieldsByDBName [ dbName ];
            if ( !field ) continue;

            const value     = this.decodeValue ( field, row [ dbName ]);
            const jsonBody  = this.jsonBodies [ field.jsName ];

            if ( field.def.serialized && jsonBody ) {
                for ( let member of jsonBody ) {
                    model [ member ] = value [ member ];
                }
            }
            else {
                model [ field.jsName ] = value;
            }
        }

        model = this.makeModel ( model, true );
        this.virtual_didLoadModelFromRow ( model, row );
        model.didLoad && model.didLoad ();
        return model;
    }

    //----------------------------------------------------------------//
    async saveAsync ( model ) {

        assert ( model, 'Missing model for save.' );

        if ( !model.id || ( model.id === -1 )) {
            
            model = await this.createAsync ( model );
        }
        else {

            const names         = [];
            const values        = [];

            this.modelToRow ( model, ( field, value ) => {
                names.push ( `${ field.dbName } = ?` );
                values.push ( this.encodeValue ( field, value ));
            });

            if ( values.length > 0 ) {
                values.push ( this.encodeValue ( this.fieldsByDBName.id, model.id ));
                const sql = `UPDATE ${ this.dbName } SET ${ commas ( names )} WHERE id = ?`;
                await this.conn.query ( sql, ...values );
            }
        }
        return model;
    }

    //----------------------------------------------------------------//
    async searchAsync ( col, searchParam ) {

        const sql = `SELECT * FROM ${ this.dbName } WHERE ${col} LIKE '%${searchParam}%'`;
        const rows = await this.conn.query ( sql );

        return rows.map (( row ) => this.rowToModel ( row ));
    }

    //----------------------------------------------------------------//
    setModelType ( modelType ) {
        assert ( !this.modelType, 'Cannot change model type once set.' );
        this.modelType = modelType || null;
        return this;
    }

    //----------------------------------------------------------------//
    toJSON ( model ) {

        const json = {};
        _.forOwn ( model, ( v, k ) => {
            const field = this.fieldsByJSName [ k ];
            if ( field && !field.def.toJSON ) return;
            json [ k ] = v;
        });
        return json;
    }

    //----------------------------------------------------------------//
    async upsertAsync ( model ) {

        const namesForInsert    = [];
        const namesForUpdate    = [];
        const values            = [];
        const marks             = [];

        this.modelToRow ( model, ( field, value ) => {
            namesForInsert.push ( field.dbName );
            namesForUpdate.push ( `${ field.dbName } = ?` );
            values.push ( this.encodeValue ( field, value ));
            marks.push ( '?' );
        });

        const sql = `
            INSERT
                INTO ${ this.dbName } ( ${ commas( namesForInsert )} )
                VALUE ( ${ commas ( marks )} )
            ON DUPLICATE KEY UPDATE
                ${ commas ( namesForUpdate )}
        `;

        model.id = ( await this.conn.query ( sql, ...values.concat ( values ))).insertId;
        return model;
    }

    //----------------------------------------------------------------//
    // eslint-disable-next-line unused-imports/no-unused-vars
    virtual_didLoadModelFromRow ( model ) {
    }

    //----------------------------------------------------------------//
    virtual_initSchema ( schema ) {
        schema.defineColumn ( 'id' ).integer ().primary ().increment ();
    }
}
