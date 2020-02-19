// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }                   from './assert';
import handlebars                   from 'handlebars';

const TEMPLATES = {
    USER_ID:                            handlebars.compile ( 'user{{ index }}' ),
    USERS:                              handlebars.compile ( 'users.{{ userID }}' ),                                    // user string by ID
    USERS_BY_EMAIL_MD5:                 handlebars.compile ( 'userIDsByEmailMD5.{{ emailMD5 }}' ),
    USERS_COUNT:                        handlebars.compile ( 'users.count' ),                                           // total users
};

//----------------------------------------------------------------//
const keyFor = {
    users:              ( userID ) => { return TEMPLATES.USERS ({ userID: userID }); },
    usersByEmailMD5:    ( emailMD5 ) => { return TEMPLATES.USERS_BY_EMAIL_MD5 ({ emailMD5: emailMD5 }); },
    usersCount:         () => { return TEMPLATES.USERS_COUNT (); },
};

//----------------------------------------------------------------//
export async function affirmUserAsync ( client, user ) {

    if ( await hasUserByEmailMD5Async ( user.emailMD5 )) {
        user.userID = await client.getAsync ( keyFor.usersByEmailMD5 ( user.emailMD5 ));
        console.log ( 'UPDATE USER:', user.userID );
    }
    else {
        user.userID = TEMPLATES.USER_ID ( await client.incrAsync ( keyFor.usersCount ) - 1 );
        await client.setAsync ( keyFor.usersByEmailMD5 ( user.emailMD5 ), user.userID );
        console.log ( 'ADD USER:', user.userID );
    }
    assert ( user.userID );
    await client.setAsync ( keyFor.users ( user.userID ), JSON.stringify ( user ));
}

//----------------------------------------------------------------//
export function formatUserPublicName ( user ) {

    return user.lastname ? `${ user.firstname } ${ user.lastname.charAt ( 0 )}.` : user.firstname;
}

//----------------------------------------------------------------//
export async function getUserByEmailMD5Async ( client, emailMD5 ) {

    const userID = await client.getAsync ( keyFor.usersByEmailMD5 ( emailMD5 ));
    return userID ? await getUserByIDAsync ( userID ) : false;
}

//----------------------------------------------------------------//
export async function getUserByIDAsync ( client, userID ) {

    try {
        const userJSON = await client.getAsync ( keyFor.users ( userID ));
        return userJSON ? JSON.parse ( userJSON ) : false;
    }
    catch ( error ) {
        console.log ( error );
    }
    return false;
}

//----------------------------------------------------------------//
export async function hasUserByEmailMD5Async ( client, emailMD5 ) {

    return await client.existsAsync ( keyFor.usersByEmailMD5 ( emailMD5 ));
}

//----------------------------------------------------------------//
export async function hasUserByIDAsync ( client, userID ) {

    return await client.existsAsync ( keyFor.users ( userID ));
}

//----------------------------------------------------------------//
export async function setUserAsync ( client, user ) {

    return await client.setAsync ( keyFor.users ( user.userID ), JSON.stringify ( user ));
}
