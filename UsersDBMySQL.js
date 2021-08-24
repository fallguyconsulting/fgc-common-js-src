// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }                       from './assert';
import { ModelError, ERROR_STATUS }     from './ModelError';
import { UsersDB }                      from './UsersDB';

//================================================================//
// UsersDBMySQL
//================================================================//
export class UsersDBMySQL extends UsersDB {

    //----------------------------------------------------------------//
    constructor () {
        super ();
    }

    //----------------------------------------------------------------//
    async affirmUserAsync ( conn, user ) {

        return conn.runInConnectionAsync ( async () => {

            const result = await conn.query (`
                REPLACE
                INTO        datadash_users ( firstname, lastname, password, emailMD5, roles )
                VALUES      ( '${ user.firstname }', '${ user.lastname }', '${ user.password }', '${ user.emailMD5 }', '' )
            `)

            assert ( typeof ( result.insertId ) === 'number' );
            user.userID = result.insertId;

            return user;
        });
    }

    //----------------------------------------------------------------//
    async getCountAsync ( conn ) {

        return conn.runInConnectionAsync ( async () => {

            const row = ( await conn.query (`
                SELECT      COUNT ( id )
                AS          count
                FROM        datadash_users
            `))[ 0 ];
            
            return row && row.count || 0
        });
    }

    //----------------------------------------------------------------//
    async getUserByEmailMD5Async ( conn, emailMD5 ) {

        return conn.runInConnectionAsync ( async () => {

            const row = ( await conn.query (`
                SELECT      *
                FROM        datadash_users 
                WHERE       emailMD5 = '${ emailMD5 }'
            `))[ 0 ];
            
            if ( !row ) throw new ModelError ( ERROR_STATUS.NOT_FOUND, 'User does not exist.' );
            return this.userFromRow ( row );
        });
    }

    //----------------------------------------------------------------//
    async getUserByIDAsync ( conn, userID ) {

        return conn.runInConnectionAsync ( async () => {

            const row = ( await conn.query (`
                SELECT      *
                FROM        datadash_users 
                WHERE       id = ${ userID }
            `))[ 0 ];
            
            if ( !row ) throw new ModelError ( ERROR_STATUS.NOT_FOUND, 'User does not exist.' );
            return this.userFromRow ( row );
        });
    }

    //----------------------------------------------------------------//
    async hasUserByEmailMD5Async ( conn, emailMD5 ) {

        return conn.runInConnectionAsync ( async () => {

            const row = ( await conn.query (`
                SELECT      COUNT ( id )
                AS          count
                FROM        datadash_users
                WHERE       emailMD5 = '${ emailMD5 }'
            `))[ 0 ];
            
            return row && row.count && row.count > 0;
        });
    }

    //----------------------------------------------------------------//
    async hasUserByIDAsync ( conn, userID ) {

        return conn.runInConnectionAsync ( async () => {

            const row = ( await conn.query (`
                SELECT      COUNT ( id )
                AS          count
                FROM        datadash_users
                WHERE       id = ${ userID }
            `))[ 0 ];
            
            return row && row.count && row.count > 0;
        });
    }

    //----------------------------------------------------------------//
    async setUserAsync ( conn, user ) {

        return await this.affirmUserAsync ( conn, user );
    }

    //----------------------------------------------------------------//
    async updateDatabaseSchemaAsync ( conn ) {

        conn.runInTransactionAsync ( async () => {

            await conn.query (`
                CREATE TABLE IF NOT EXISTS datadash_users (
                    id          INT NOT NULL AUTO_INCREMENT,
                    firstname   TEXT NOT NULL,
                    lastname    TEXT NOT NULL,
                    password    TEXT NOT NULL,
                    emailMD5    TEXT NOT NULL,
                    roles       TEXT NOT NULL,
                    PRIMARY KEY ( id )
                )
            `);
        });
    }

    //----------------------------------------------------------------//
    userFromRow ( row ) {

        return {
            userID:     row.id,
            firstname:  row.firstname,
            lastname:   row.lastname,
            password:   row.password,
            emailMD5:   row.emailMD5,
            roles:      [],
        };
    }
}
