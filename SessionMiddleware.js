// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as roles from './roles';

//================================================================//
// SessionMiddleware
//================================================================//
export class SessionMiddleware {

    //----------------------------------------------------------------//
    constructor ( usersDB ) {

        this.usersDB = usersDB;
    }

    //----------------------------------------------------------------//
    withUser ( requiredRoles ) {

        requiredRoles = ( requiredRoles && requiredRoles.length ) ? requiredRoles : false;

        return async ( request, result, next ) => {

            if ( request.method === 'OPTIONS' ) {
                next ();
                return;
            }

            if ( request.userID ) {

                const user = await this.usersDB.getUserByIDAsync ( request.userID );
                if ( user ) {
                    if (( requiredRoles === false ) || ( roles.intersect ( user.roles, requiredRoles ))) {
                        request.user = user;
                        next ();
                        return;
                    }
                }
            }
            result.status ( 401 ).send ({});
        };
    }
}
