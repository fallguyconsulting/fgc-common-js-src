// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//================================================================//
// SessionMiddleware
//================================================================//
export class SessionMiddleware {

    //----------------------------------------------------------------//
    constructor ( userDB ) {

        this.usersDB = usersDB;
    }

    //----------------------------------------------------------------//
    withUser ( roles ) {

        return async ( request, result, next ) => {

            if ( request.method === 'OPTIONS' ) {
                next ();
                return;
            }

            const header = request.header ( this.headerName ) || false;

            if ( request.userID ) {

                const user = await this.usersDB.getUserByIDAsync ( request.userID );
                if ( user ) {

                    request.user = user;
                    next ();
                    return;
                }
            }
            result.status ( 401 ).send ({});
        };
    }
}
