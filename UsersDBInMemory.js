// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }                   from './assert';
import { UsersDB }                  from './UsersDB';
import _                            from 'lodash';

//================================================================//
// UsersDBInMemory
//================================================================//
export class UsersDBInMemory extends UsersDB {

    //----------------------------------------------------------------//
    constructor () {
        super ();
    }

    //----------------------------------------------------------------//
    async affirmUserAsync ( store, user ) {

        user = _.cloneDeep ( user );

        if ( _.has ( store.usersByMD5, user.emailMD5 )) {
            user.userID = store.usersByMD5 [ user.emailMD5 ].userID;
        }
        else {
            user.userID = store.users.length;
            store.users.push ( user );
        }

        store.users [ user.userID ] = user;
        store.usersByMD5 [ user.emailMD5 ] = user;

        return user;
    }

    //----------------------------------------------------------------//
    async getCountAsync ( store ) {

        return store.users.length;
    }

    //----------------------------------------------------------------//
    async getUserByEmailMD5Async ( store, emailMD5 ) {

        return store.usersByMD5 [ emailMD5 ] || false;
    }

    //----------------------------------------------------------------//
    async getUserByIDAsync ( store, userID ) {

        return store.users [ userID ] || false;
    }

    //----------------------------------------------------------------//
    async hasUserByEmailMD5Async ( store, emailMD5 ) {

        return _.has ( store.usersByMD5, emailMD5 );
    }

    //----------------------------------------------------------------//
    async hasUserByIDAsync ( store, userID ) {

        return userID < store.users.length;
    }

    //----------------------------------------------------------------//
    async setUserAsync ( store, user ) {

        assert ( user.userID < store.users.length );
        store.users [ user.userID ] = _.cloneDeep ( user );
    }

    //----------------------------------------------------------------//
    async updateDatabaseSchemaAsync ( store ) {

        store.users         = store.users || [];
        store.usersByMD5    = store.usersByMD5 || {};
    }
}
