/* eslint-disable no-whitespace-before-property */

import { assert }                   from './assert';
import mysql                        from 'promise-mysql';

//----------------------------------------------------------------//
function savepointName ( depth ) {
    return `savepoint_depth_${ depth }`;
}

//================================================================//
// MySQL
//================================================================//
export class MySQL {

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

        this.pool               = pool;
        this.conn               = false;

        this.connection         = false;
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
    async escapeAsync ( str ) {

        assert ( this.connection, 'MISSING MYSQL CONNECTION' );
        return await this.connection.escape ( str );
    }

    //----------------------------------------------------------------//
    async hasAsync ( fromWhere ) {

        return (( await this.countAsync ( fromWhere )) > 0 );
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
    async query ( sql ) {

        return this.runInConnectionAsync ( async () => {
            assert ( this.connection, 'MISSING MYSQL CONNECTION' );
            return await this.connection.query ( sql );
        });
    }

    //----------------------------------------------------------------//
    reset () {

        assert ( this.connection === false );
        assert ( this.transactionDepth === 0 );

        this.connection         = false;
        this.transactionDepth   = 0;
        this.connectionDepth    = 0;
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
    async toJSONAsync ( body ) {

        assert ( this.connection, 'MISSING MYSQL CONNECTION' );
        return await this.escapeAsync ( JSON.stringify ( body ));
    }
}
