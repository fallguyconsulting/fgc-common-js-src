/* eslint-disable no-whitespace-before-property */

import { assert }                   from '../assert';
import mysql                        from 'promise-mysql';
import { AsyncLocalStorage }        from 'node:async_hooks';

const localStorage = new AsyncLocalStorage ();

//----------------------------------------------------------------//
function savepointName ( depth ) {
    return `savepoint_depth_${ depth }`;
}

//================================================================//
// MySQLConnection
//================================================================//
export class MySQLConnection {

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
            this.connection = await this.pool.getConnection ();
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
    async countAsync ( fromWhere, ...args ) {

        const row = ( await this.query ( `SELECT COUNT ( id ) AS count ${ fromWhere }`, ...args ))[ 0 ];
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
    async escapeAsync ( str ) {

        assert ( this.connection, 'MISSING MYSQL CONNECTION' );
        return await this.connection.escape ( str );
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
            
            await this.beginTransactionAsync ();
            try {
                const result = await action ();
                await this.commitTransactionAsync ();
                return result;
            }
            catch ( error ) {
                await this.abortTransactionAsync ();
                throw error;
            }
        });
    }

    //----------------------------------------------------------------//
    async query ( sql, ...args ) {

        return this.runInConnectionAsync ( async () => {
            return await this.connection.query ( sql, [ ...args ]);
        });
    }

    //----------------------------------------------------------------//
    async toJSONAsync ( body ) {

        assert ( this.connection, 'MISSING MYSQL CONNECTION' );
        return await this.escapeAsync ( JSON.stringify ( body ));
    }
}

//================================================================//
// MySQL
//================================================================//
export class MySQL {

    //----------------------------------------------------------------//
    constructor ( pool ) {

        this.pool       = pool;
        this.conn       = false;
    }

    //----------------------------------------------------------------//
    static async countAsync ( ...args ) {

        return MySQL.getLocalConnection ().countAsync ( ...args );
    }

    //----------------------------------------------------------------//
    static getLocalConnection () {
        return localStorage.getStore ();
    }

    //----------------------------------------------------------------//
    makeConnection () {

        return this.conn ? this.conn : new MySQLConnection ( this.pool );
    }

    //----------------------------------------------------------------//
    static async makeAsync ( host, user, password, database ) {

        const pool = await mysql.createPool ({
            connectionLimit:    16,
            host:               host,
            user:               user,
            password:           password,
            database:           database,
        });
        return new MySQL ( pool );
    }

    //----------------------------------------------------------------//
    reuseConnection () {

        this.conn = new MySQLConnection ( this.pool );
        return this.conn;
    }

    //----------------------------------------------------------------//
    static async runInConnectionAsync ( action ) {

        return MySQL.getLocalConnection ().runInConnectionAsync ( action );
    }

    //----------------------------------------------------------------//
    static async runInTransactionAsync ( action ) {

        return MySQL.getLocalConnection ().runInTransactionAsync ( action );
    }

    //----------------------------------------------------------------//
    runWithLocalConnection ( fnAsync, conn ) {
        localStorage.run ( conn || this.makeConnection (), fnAsync );
    }

    //----------------------------------------------------------------//
    static async query ( ...args ) {

        return MySQL.getLocalConnection ().query ( ...args );
    }
}
