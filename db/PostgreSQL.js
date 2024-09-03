// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import { assert }                   from '../assert';
import * as util                    from '../util';
import * as pg                      from 'pg'
import { ParameterizedQuery }       from 'pg-promise';

const { Pool } = pg;

//----------------------------------------------------------------//
function getCleanerStack () {
   const error = new Error ();
   Error.captureStackTrace ( error, getCleanerStack );
   return error.stack;
}

//----------------------------------------------------------------//
function savepointName ( depth ) {
    return `savepoint_depth_${ depth }`;
}

//================================================================//
// PostgreSQLConnection
//================================================================//
export class PostgreSQLConnection {

    //----------------------------------------------------------------//
    async abortTransactionAsync ( depth ) {

        assert ( this.transactionDepth > 0, 'No transactions.' )
        assert ( depth === ( this.transactionDepth - 1 ), 'Invalid transaction depth.' );
        
        if ( depth === 0 ) {
            console.log ( `${ this.debugID }: ROLLBACK` );
            await this.query ( `ROLLBACK` );
        }
        else {
            console.log ( `${ this.debugID }: ROLLBACK TO SAVEPOINT ${ savepointName ( depth )}` );
            await this.query ( `ROLLBACK TO SAVEPOINT ${ savepointName ( depth )}` );
        }
        this.transactionDepth = depth;
    }

    //----------------------------------------------------------------//
    async beginConnectionAsync () {

        if ( this.connectionDepth === 0 ) {
            this.connection = await this.pool.connect ();
        }
        this.connectionDepth++;
    }

    //----------------------------------------------------------------//
    async beginTransactionAsync () {

        const depth = this.transactionDepth;

        try {

            if ( this.transactionDepth === 0 ) {
                console.log ( `${ this.debugID }: START TRANSACTION` );
                await this.query ( `START TRANSACTION` );
            }
            else {
                console.log ( `${ this.debugID }: SAVEPOINT ${ savepointName ( depth )}` );
                await this.query ( `SAVEPOINT ${ savepointName ( depth )}` );
            }
        }
        catch ( error ) {
            console.log ( 'ERROR IN beginTransactionAsync' );
            throw error;
        }

        this.transactionDepth++;
        return depth;
    }

    //----------------------------------------------------------------//
    async checkColumnExistsAsync ( tableName, columnName ) {

        const rows = ( await this.query ( `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`, tableName, columnName )).rows;
        return rows.length > 0;
    }

    //----------------------------------------------------------------//
    async checkTableExistsAsync ( tableName ) {

        const rows = ( await this.query ( `SELECT 1 FROM information_schema.tables WHERE table_name = $1`, tableName )).rows;
        return rows.length > 0;
    }

    //----------------------------------------------------------------//
    async commitTransactionAsync ( depth ) {

        assert ( this.transactionDepth > 0, 'No transactions.' )
        assert ( depth === ( this.transactionDepth - 1 ), 'Invalid transaction depth.' );
        
        if ( depth === 0 ) {
            console.log ( `${ this.debugID }: COMMIT` );
            await this.query ( `COMMIT` );
        }
        else {
            console.log ( `${ this.debugID }: RELEASE SAVEPOINT ${ savepointName ( depth )}` );
            await this.query ( `RELEASE SAVEPOINT ${ savepointName ( depth )}` );
        }
        this.transactionDepth = depth;
    }

    //----------------------------------------------------------------//
    constructor ( pool ) {

        this.connection         = false;
        this.pool               = pool;
        this.transactionDepth   = 0;
        this.connectionDepth    = 0;
        this.debugID            = util.randomInt ();
    }

    //----------------------------------------------------------------//
    async countAsync ( fromWhere ) {

        const row = ( await this.query ( `SELECT COUNT ( id ) AS count ${ fromWhere }` ))[ 0 ];
        return row ? row.count : 0;
    }

    //----------------------------------------------------------------//
    async endConnectionAsync () {

        if ( this.connectionDepth > 0 ) {
            this.connectionDepth--;
            if ( this.connectionDepth === 0 ) {
                await this.connection.release ();
                this.connection = false;
            }
        }
    }

    //----------------------------------------------------------------//
    async hasAsync ( fromWhere ) {

        return (( await this.countAsync ( fromWhere )) > 0 );
    }

    //----------------------------------------------------------------//
    makeConnection () {

        return this;
    }

    //----------------------------------------------------------------//
    async runInConnectionAsync ( action ) {

        await this.beginConnectionAsync ();

        try {
            const result = await action ();
            await this.endConnectionAsync ();
            return result;
        }
        catch ( error ) {
            await this.endConnectionAsync ();
            throw error;
        }
    }

    //----------------------------------------------------------------//
    async runInTransactionAsync ( action ) {

        return this.runInConnectionAsync ( async () => {

            const depth = await this.beginTransactionAsync ();

            try {
                const result = await action ();
                await this.commitTransactionAsync ( depth );
                return result;
            }
            catch ( error ) {
                await this.abortTransactionAsync ( depth );
                throw error;
            }
        });
    }

    //----------------------------------------------------------------//
    async query ( sql, ...args ) {

        sql = ( typeof ( sql ) === 'string' ) ? new ParameterizedQuery ({ text: sql, values: args }) : sql;
        const trace = getCleanerStack ();
        
        try {
            const result = await this.runInConnectionAsync ( async () => {
                assert ( this.connection, 'MISSING POSTGRESQL CONNECTION' );
                return await this.connection.query ( sql );
            });
            return result;
        }
        catch ( error ) {
            error.sql = ( typeof ( sql ) === 'string' ) ? sql : sql.text;
            error.calling = trace;
            throw ( error );
        }
    }
}

//================================================================//
// PostgreSQL
//================================================================//
export class PostgreSQL {

    //----------------------------------------------------------------//
    constructor ( pool ) {

        this.pool       = pool;
        this.conn       = false;
    }

    //----------------------------------------------------------------//
    makeConnection () {

        return this.conn ? this.conn : new PostgreSQLConnection ( this.pool );
    }

    //----------------------------------------------------------------//
    static async makeAsync ( host, user, password, database ) {

        const pool = await new Pool ({
            max:                        16,
            connectionTimeoutMillis:    1000,
            idleTimeoutMillis:          1000,
            host:                       host,
            user:                       user,
            password:                   password,
            database:                   database,
        });
        return new PostgreSQL ( pool );
    }

    //----------------------------------------------------------------//
    reuseConnection () {

        this.conn = new PostgreSQLConnection ( this.pool );
        return this.conn;
    }

    //----------------------------------------------------------------//
    static setTypeParser ( oid, parser ) {
        pg.types.setTypeParser ( oid, parser );
    }
}

PostgreSQL.TYPES = pg.types.builtins;
