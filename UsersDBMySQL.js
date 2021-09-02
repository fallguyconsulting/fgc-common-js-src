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
    async deleteBlockAsync ( conn, userID ) {

        return conn.runInConnectionAsync ( async () => {

            const row = ( await conn.query ( `SELECT * FROM datadash_users WHERE id = ${ userID }` ))[ 0 ];
            if ( !row ) throw new ModelError ( ERROR_STATUS.NOT_FOUND, 'User does not exist.' );
    
            await conn.query (`
                UPDATE  datadash_users
                SET     block      = NULL
                WHERE   id         = ${ userID }
            `);

        });
    }

    //----------------------------------------------------------------//
    async findUsersAsync ( conn, searchTerm ) {
        
        if ( !searchTerm ) return [];

        return conn.runInConnectionAsync ( async () => {

            const rows = await conn.query (`
                SELECT      *
                FROM        datadash_users 
                WHERE
                    MATCH ( firstname )
                    AGAINST ( '${ searchTerm }*' IN BOOLEAN MODE )
               LIMIT 0,10
            `);

            const searchResults = [];
            for ( let row of rows ) {
                searchResults.push ( this.userFromRow ( row ));
            }
            return searchResults;
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
    async getUserIDAsync ( conn ) {

        return conn.runInConnectionAsync ( async () => {

            const data = ( await conn.query (`
                SELECT      id
                FROM        datadash_users 
            `));
           
            const userID = data.map (( user ) => {
                return user.id;
            });
        
            return userID;
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
    async updateBlockAsync ( conn, userID ) {

        return conn.runInConnectionAsync ( async () => {

            const row = ( await conn.query ( `SELECT * FROM datadash_users WHERE id = ${ userID }` ))[ 0 ];
            if ( !row ) throw new ModelError ( ERROR_STATUS.NOT_FOUND, 'User does not exist.' );

            await conn.query (`
                UPDATE  datadash_users
                SET     block      = TRUE
                WHERE   id         = ${ userID }
            `);
    
        });
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

            const block = await conn.query (`
                SELECT      *
                FROM        INFORMATION_SCHEMA.COLUMNS
                WHERE       TABLE_SCHEMA    = 'diablo_golf'
                    AND     TABLE_NAME      = 'datadash_users'
                    AND     COLUMN_NAME     = 'block'
                LIMIT       0, 1
            `)

            if ( block.length === 0 ) {
                await conn.query (`
                    ALTER TABLE datadash_users 
                    ADD COLUMN block BOOL
                `);
            };
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
            roles:      row.roles,
            block:      row.block,
        };
    }
}
