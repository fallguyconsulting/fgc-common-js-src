// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import { assert }           from './assert';
import * as pg              from 'pg'

const { Pool } = pg;

//----------------------------------------------------------------//
function savepointName ( depth ) {
    return `savepoint_depth_${ depth }`;
}

//================================================================//
// PostgreSQLConnection
//================================================================//
export class PostgreSQLConnection {

    //----------------------------------------------------------------//
    async abortTransactionAsync () {

        if ( this.transactionDepth === 0 ) return;
        
        if ( this.transactionDepth === 1 ) {
            await this.query ( `ROLLBACK` );
        }
        else {
            await this.query ( `ROLLBACK TO SAVEPOINT ${ savepointName ( this.transactionDepth - 1 )}` );
        }
        this.transactionDepth--;
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

        if ( this.transactionDepth === 0 ) {
            await this.query ( `START TRANSACTION` );
        }
        else {
            await this.query ( `SAVEPOINT ${ savepointName ( this.transactionDepth )}` );
        }
        this.transactionDepth++;
    }

    //----------------------------------------------------------------//
    async commitTransactionAsync () {

        if ( this.transactionDepth === 0 ) return;
        
        if ( this.transactionDepth === 1 ) {
            await this.query ( `COMMIT` );
        }
        this.transactionDepth--;
    }

    //----------------------------------------------------------------//
    constructor ( pool ) {

        this.connection         = false;
        this.pool               = pool;
        this.transactionDepth   = 0;
        this.connectionDepth    = 0;
    }

    //----------------------------------------------------------------//
    async countAsync ( fromWhere ) {

        const row = ( await this.query ( `SELECT COUNT ( id ) AS count ${ fromWhere }` ))[ 0 ];
        return row && row.count || 0;
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
            console.log ( error );
            throw error;
        }
    }

    //----------------------------------------------------------------//
    async runInTransactionAsync ( action ) {

        return this.runInConnectionAsync ( async () => {

            await this.beginTransactionAsync ();
            try {
                const result = await action ();
                await this.commitTransactionAsync ();
                return result;
            }
            catch ( error ) {
                console.log ( error );
                await this.abortTransactionAsync ();
                throw error;
            }
        });
    }

    //----------------------------------------------------------------//
    async query ( sql ) {

        return this.runInConnectionAsync ( async () => {
            assert ( this.connection, 'MISSING POSTGRESQL CONNECTION' );
            return await this.connection.query ( sql );
        });
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
}
