// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as roles from './roles';

//================================================================//
// SessionMiddleware
//================================================================//
export class SessionMiddleware {

    //----------------------------------------------------------------//
    constructor ( db ) {
        this.db      = db;
    }

    //----------------------------------------------------------------//
    withUser ( requiredRoles ) {

        requiredRoles = ( requiredRoles && requiredRoles.length ) ? requiredRoles : false;
        const conn          = this.db.makeConnection ();
        
        return async ( request, result, next ) => {

            if ( request.method === 'OPTIONS' ) {
                next ();
                return;
            }

            if ( request.userID ) {
          
                const user = await this.db.users.getUserByIDAsync ( conn, request.userID );
                if ( user ) {
                    if (( requiredRoles === false ) || ( roles.canInviteUser ( user.roles ))) {
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
