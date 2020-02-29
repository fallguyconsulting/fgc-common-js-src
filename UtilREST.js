// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { token }        from './token';
import express          from 'express';

//================================================================//
// UtilREST
//================================================================//
export class UtilREST {

    //----------------------------------------------------------------//
    constructor () {
        
        this.router = express.Router ();
        this.router.get     ( '/signing-key',       this.getSigningKeyAsync.bind ( this ));
        this.router.get     ( '/',                  this.getStatusAsync.bind ( this ));
    }

    //----------------------------------------------------------------//
    async getSigningKeyAsync ( request, result ) {

        result.json ({ keyBase64: token.makeSigningKeyBase64 ()});
    }

    //----------------------------------------------------------------//
    async getStatusAsync ( request, result ) {

        const message = {
            message: 'This is the Travel backend.',
        };
        result.json ( message );
    }

    //----------------------------------------------------------------//
    static makeAdminMiddleware ( headerName, password ) {

        return async ( request, result, next ) => {

            if ( request.method === 'OPTIONS' ) {
                next ();
                return;
            }

            const header = request.header ( headerName ) || false;

            if ( header === password ) {
                next ();
                return;
            }
            result.status ( 401 ).send ({});
        };
    }
}
