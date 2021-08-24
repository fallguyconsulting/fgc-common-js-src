// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//================================================================//
// UsersDB
//================================================================//
export class UsersDB {

    //----------------------------------------------------------------//
    constructor () {
    }

    //----------------------------------------------------------------//
    formatUserPublicName ( user ) {

        return user.lastname ? `${ user.firstname } ${ user.lastname.charAt ( 0 )}.` : user.firstname;
    }
}
