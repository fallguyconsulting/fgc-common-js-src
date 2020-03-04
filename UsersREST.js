// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }                   from './assert';
import { Mailer }                   from './Mailer';
import { PasswordMiddleware }       from './PasswordMiddleware';
import * as token                   from './token';
import { UsersODBM }                from './UsersODBM';
import express                      from 'express';
import bcrypt                       from 'bcrypt';
import crypto                       from 'crypto';
import _                            from 'lodash';

const VERIFIER_ACTIONS = {
    REGISTER:   'register',
    RESET:      'reset',
};

//================================================================//
// UsersREST
//================================================================//
export class UsersREST {

    //----------------------------------------------------------------//
    constructor ( db, env, templates, entitlements ) {
        
        this.env            = env;
        this.templates      = templates;
        this.entitlements   = entitlements || {};
        this.usersDB        = new UsersODBM ( db );

        this.mailer = new Mailer ( env );

        this.router = express.Router ();

        this.router.post        ( '/login',                 this.postLoginAsync.bind ( this ));
        this.router.post        ( '/login/reset',           this.postLoginWithPasswordResetAsync.bind ( this ));
        this.router.post        ( '/login/register',        this.postLoginWithRegisterUserAsync.bind ( this ));
        this.router.get         ( '/users/:userID',         this.getUserAsync.bind ( this ));
        this.router.get         ( '/users',                 this.getUsersAsync.bind ( this ));
        this.router.post        ( '/verifier/:actionID',    this.postVerifierEmailRequestAsync.bind ( this ));

        if ( env.SERVER_ADMIN_PASSWORD ) {
            const middleware = new PasswordMiddleware ( 'X-Admin-Password', env.SERVER_ADMIN_PASSWORD, 'adminPassword' );
            this.router.post ( '/admin/entitlements', middleware.withPasswordAuth (), this.postUserEntitlements.bind ( this ));
        }
    }

    //----------------------------------------------------------------//
    formatLoginResponse ( user, signingKey ) {
        
        return {
            status:             'OK',
            session: {
                token:          token.create ( user.userID, 'localhost', 'self', signingKey ),
                userID:         user.userID,
                publicName:     this.usersDB.formatUserPublicName ( user ),
                emailMD5:       user.emailMD5,
                entitlements:   this.env.SERVER_ADMIN_PASSWORD ? ( user.entitlements || {}) : this.entitlements,
            },
        };
    }

    //----------------------------------------------------------------//
    async getUserAsync ( request, result ) {

        const userID = request.params.userID;
        console.log ( 'GET USER:', userID );

        const user = await this.usersDB.getUserByIDAsync ( userID );

        if ( user ) {

            if ( request.userID === userID ) {
                result.json ( user );
            }
            else {
                result.json ({
                    userID:         userID,
                    emailMD5:       user.emailMD5,
                    publicName:     this.usersDB.formatUserPublicName ( user ),
                });
            }
        }
        else {
            result.json ({});
        }
    }

    //----------------------------------------------------------------//
    async getUsersAsync ( request, result ) {

        const query     = request.query || {};
        const base      = _.has ( query, 'base' ) ? parseInt ( query.base ) : 0;
        const count     = _.has ( query, 'count' ) ? parseInt ( query.count ) : 10;

        const totalUsers = await this.usersDB.getCountAsync ();
        
        console.log ( 'TOTAL USERS', totalUsers );

        let top = base + count;
        top = top < totalUsers ? top : totalUsers;

        console.log ( base, top );

        const users = [];
        for ( let i = base; i < top; ++i ) {
            const userID = UsersODBM.formatUserID ( i );
            console.log ( 'USER ID:', userID );
            const user = await this.usersDB.getUserByIDAsync ( userID );
            console.log ( user );
            if ( user ) {
                users.push ({
                    userID:         userID,
                    emailMD5:       user.emailMD5,
                    publicName:     this.usersDB.formatUserPublicName ( user ),
                });
            }
        }
        result.json ({
            totalUsers:     totalUsers,
            users:          users,
        });
    }

    //----------------------------------------------------------------//
    async postLoginAsync ( request, result ) {

        console.log ( 'POST LOGIN' );

        try {

            const body      = request.body;
            const email     = body.email;
            const emailMD5  = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );
            const user      = await this.usersDB.getUserByEmailMD5Async ( emailMD5 );

            console.log ( email, emailMD5, user );

            if ( user ) {
                console.log ( 'FOUND USER:', user.userID );

                if ( user && await bcrypt.compare ( body.password, user.password )) {
                    console.log ( 'PASSWORDS MATCHED' );
                    result.json ( this.formatLoginResponse ( user, this.env.SIGNING_KEY_FOR_SESSION ));
                    return;
                }
            }
        }
        catch ( error ) {
            console.log ( error );
        }
        result.json ({});
        result.status ( 401 );
    }

    //----------------------------------------------------------------//
    async postLoginWithPasswordResetAsync ( request, result ) {

        try {

            console.log ( 'POST LOGIN WITH PASSWORD RESET' );

            const body          = request.body;
            const verifier      = body.verifier;
            const password      = body.password;
            const email         = body.email;
            const emailMD5      = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );

            assert ( verifier );
            const verified = token.verify ( body.verifier, this.env.SIGNING_KEY_FOR_PASSWORD_RESET );
            assert ( verified && verified.body && verified.body.sub && ( verified.body.sub === email ));

            const user = await this.usersDB.getUserByEmailMD5Async ( emailMD5 );
            assert ( user );

            user.password = await bcrypt.hash ( password, this.env.SALT_ROUNDS );
            await this.usersDB.setUserAsync ( user );

            result.json ( this.formatLoginResponse ( user, this.env.SIGNING_KEY_FOR_SESSION ));
            return;
        }
        catch ( error ) {

            console.log ( error );
        }
        result.status ( 401 );
    }

    //----------------------------------------------------------------//
    async postLoginWithRegisterUserAsync ( request, result ) {

        try {

            console.log ( 'POST LOGIN WITH REGISTER USER' );

            const body          = request.body;
            const verifier      = body.verifier;
            const firstname     = body.firstname;
            const lastname      = body.lastname || '';
            const password      = body.password;
            const email         = body.email;
            const emailMD5      = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );

            assert ( verifier );
            const verified = token.verify ( body.verifier, this.env.SIGNING_KEY_FOR_REGISTER_USER );
            assert ( verified && verified.body && verified.body.sub && ( verified.body.sub === email ));

            const user = {
                firstname:      firstname,
                lastname:       lastname,
                password:       await bcrypt.hash ( password, this.env.SALT_ROUNDS ),
                emailMD5:       emailMD5, // TODO: encrypt plaintext email with user's password and store
            };

            await this.usersDB.affirmUserAsync ( user );

            result.json ( this.formatLoginResponse ( user, this.env.SIGNING_KEY_FOR_SESSION ));
            return;
        }
        catch ( error ) {

            console.log ( error );
        }
        result.status ( 401 );
    }

    //----------------------------------------------------------------//
    async postUserEntitlements ( request, result ) {

        console.log ( 'POST ENTITLEMENTS' );

        try {

            const body = request.body;
            const entitlements = body.entitlements || {};

            let user = false;
            if ( body.userID ) {

                user            = await this.usersDB.getUserByIDAsync ( body.userID );
            }
            else if ( body.email ) {

                const email     = body.email;
                const emailMD5  = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );
                user            = await this.usersDB.getUserByEmailMD5Async ( emailMD5 );
            }            

            if ( user ) {
                console.log ( 'ENTITLEMENTS:', JSON.stringify ( entitlements, null, 4 ));
                user.entitlements = entitlements;
                await this.usersDB.setUserAsync ( user );
                result.json ({ status: 'OK', user: user });
                return;
            }
        }
        catch ( error ) {
            console.log ( error );
        }
        result.json ({});
        result.status ( 401 );
    }

    //----------------------------------------------------------------//
    async postVerifierEmailRequestAsync ( request, result ) {

        try {

            const actionID = request.params.actionID;
            console.log ( 'POST VERIFIER EMAIL REQUEST', actionID );
            assert ( Object.values ( VERIFIER_ACTIONS ).includes ( actionID ));

            const email         = request.body.email;
            const emailMD5      = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );

            // if already exists, send a password reset email.
            // do this for both RESET and REGISTER actions.
            const exists = await this.usersDB.hasUserByEmailMD5Async ( emailMD5 );
            if ( exists ) {

                console.log ( 'SENDING PASSWORD RESET EMAIL' );

                await this.mailer.sendVerifierEmailAsync (
                    email,
                    false,
                    this.templates.RESET_PASSWORD_EMAIL_SUBJECT,
                    this.templates.RESET_PASSWORD_EMAIL_TEXT_BODY_TEMPLATE,
                    this.templates.RESET_PASSWORD_EMAIL_HTML_BODY_TEMPLATE,
                    this.env.SIGNING_KEY_FOR_PASSWORD_RESET,
                );
                result.json ({ status: 'OK' });
                return;
            }
            
            // only send a new user email if REGISTER is explicitely requested.
            // this avoids sending new user emails to unregistered users.
            if ( actionID === VERIFIER_ACTIONS.REGISTER ) {

                console.log ( 'SENDING SIGNUP EMAIL' );

                // user doesn't exist, so send a create user email.
                await this.mailer.sendVerifierEmailAsync (
                    email,
                    request.body.redirect,
                    this.templates.REGISTER_USER_EMAIL_SUBJECT,
                    this.templates.REGISTER_USER_EMAIL_TEXT_BODY_TEMPLATE,
                    this.templates.REGISTER_USER_EMAIL_HTML_BODY_TEMPLATE,
                    this.env.SIGNING_KEY_FOR_REGISTER_USER,
                );
                result.json ({ status: 'OK' });
                return;
            }
        }
        catch ( error ) {

            console.log ( error );
        }
        result.json ({});
        result.status ( 400 );
    }
}