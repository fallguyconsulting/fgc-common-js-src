// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }                   from './assert';
import { UsersDB }                  from './UsersDB';
import handlebars                   from 'handlebars';
import _                            from 'lodash';

const TEMPLATES = {
    USER_ID:                            handlebars.compile ( 'user{{ index }}' ),
    USERS:                              handlebars.compile ( 'users.{{ userID }}' ), // user string by ID
    USERS_BY_EMAIL_MD5:                 handlebars.compile ( 'userIDsByEmailMD5.{{ emailMD5 }}' ),
    USERS_COUNT:                        handlebars.compile ( 'users.count' ),
};

//----------------------------------------------------------------//
const keyFor = {
    users:              ( userID ) => { return TEMPLATES.USERS ({ userID: userID }); },
    usersByEmailMD5:    ( emailMD5 ) => { return TEMPLATES.USERS_BY_EMAIL_MD5 ({ emailMD5: emailMD5 }); },
    usersCount:         () => { return TEMPLATES.USERS_COUNT (); },
};

//================================================================//
// UsersDBRedis
//================================================================//
export class UsersDBRedis  extends UsersDB {

    //----------------------------------------------------------------//
    constructor () {
        super ();
    }

    //----------------------------------------------------------------//
    async affirmUserAsync ( conn, user ) {

        user = _.cloneDeep ( user );

        if ( await this.hasUserByEmailMD5Async ( user.emailMD5 )) {
            user.userID = await this.db.getAsync ( keyFor.usersByEmailMD5 ( user.emailMD5 ));
            console.log ( 'UPDATE USER:', user.userID );
        }
        else {
            const index = await this.db.incrAsync ( keyFor.usersCount ()) - 1;
            user.userID = TEMPLATES.USER_ID ({ index: index });
            await this.db.setAsync ( keyFor.usersByEmailMD5 ( user.emailMD5 ), user.userID );
            console.log ( 'ADD USER:', user.userID );
        }
        assert ( user.userID );
        await this.db.setAsync ( keyFor.users ( user.userID ), JSON.stringify ( user ));
        
        return user;
    }

    //----------------------------------------------------------------//
    static formatUserID ( conn, index ) {

        return TEMPLATES.USER_ID ({ index: index });
    }

    //----------------------------------------------------------------//
    async getCountAsync ( conn ) {

        const count = await this.db.getAsync ( keyFor.usersCount ());
        return count ? parseInt ( count ) : 0;
    }

    //----------------------------------------------------------------//
    async getUserByEmailMD5Async ( conn, emailMD5 ) {

        const userID = await this.db.getAsync ( keyFor.usersByEmailMD5 ( emailMD5 ));
        return userID ? await this.getUserByIDAsync ( userID ) : false;
    }

    //----------------------------------------------------------------//
    async getUserByIDAsync ( conn, userID ) {

        try {
            const userJSON = await this.db.getAsync ( keyFor.users ( userID ));
            return userJSON ? JSON.parse ( userJSON ) : false;
        }
        catch ( error ) {
            console.log ( error );
        }
        return false;
    }

    //----------------------------------------------------------------//
    async hasUserByEmailMD5Async ( conn, emailMD5 ) {

        return await this.db.existsAsync ( keyFor.usersByEmailMD5 ( emailMD5 ));
    }

    //----------------------------------------------------------------//
    async hasUserByIDAsync ( conn, userID ) {

        return await this.db.existsAsync ( keyFor.users ( userID ));
    }

    //----------------------------------------------------------------//
    async setUserAsync ( conn, user ) {

        return await this.db.setAsync ( keyFor.users ( user.userID ), JSON.stringify ( user ));
    }

    //----------------------------------------------------------------//
    async updateDatabaseSchemaAsync ( conn ) {
    }
}
