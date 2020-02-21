// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }                   from './assert';
import * as usersDB                 from './usersDB';
import { Mailer }                   from './Mailer';
import { token }                    from './token';
import express                      from 'express';
import bcrypt                       from 'bcrypt';
import crypto                       from 'crypto';

const VERIFIER_ACTIONS = {
    REGISTER:   'register',
    RESET:      'reset',
};

//================================================================//
// UsersREST
//================================================================//
export class UsersREST {

    //----------------------------------------------------------------//
    constructor ( env, templates, db ) {
        
        this.env            = env;
        this.templayes      = templates;
        this.db             = db;

        this.mailer = new Mailer ( env );

        this.router = express.Router ();
        this.router.post    ( '/login',                 this.postLoginAsync.bind ( this ));
        this.router.post    ( '/login/reset',           this.postLoginWithPasswordResetAsync.bind ( this ));
        this.router.post    ( '/login/register',        this.postLoginWithRegisterUserAsync.bind ( this ));
        this.router.get     ( '/users/:userID',         this.getUserAsync.bind ( this ));
        this.router.post    ( '/verifier/:actionID',    this.postVerifierEmailRequestAsync.bind ( this ));
    }

    //----------------------------------------------------------------//
    formatLoginResponse ( user, signingKey ) {

        return {
            status:             'OK',
            session: {
                token:          token.create ( user.userID, 'localhost', 'self', signingKey ),
                userID:         user.userID,
                publicName:     usersDB.userPublicName ( user ),
                emailMD5:       user.emailMD5,
            },
        };
    }

    //----------------------------------------------------------------//
    async getUserAsync ( request, result ) {

        const userID = request.params.userID;
        console.log ( 'GET USER:', userID );

        const user = await usersDB.getUserAsync ( this.db, userID );

        if ( user ) {

            if ( request.userID ) {
                console.log ( 'USER IS LOGGED IN' );
                result.json ( user );
            }
            else {
                console.log ( 'PUBLIC USER' );
                result.json ({
                    userID:         userID,
                    emailMD5:       user.emailMD5,
                    publicName:     usersDB.userPublicName ( user ),
                });
            }
        }
        else {
            console.log ( 'DID NOT FIND USER' );
            result.json ({});
        }
    }

    //----------------------------------------------------------------//
    async postLoginAsync ( request, result ) {

        console.log ( 'POST LOGIN' );

        try {

            const body      = request.body;
            const email     = body.email;
            const emailMD5  = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );
            const user      = await usersDB.getUserByEmailMD5Async ( this.db, emailMD5 );

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

            const body          = request.body;
            const verifier      = body.verifier;
            const password      = body.password;
            const email         = body.email;
            const emailMD5      = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );

            assert ( verifier );
            const verified = token.verify ( body.verifier, this.env.SIGNING_KEY_FOR_PASSWORD_RESET );
            assert ( verified && verified.body && verified.body.sub && ( verified.body.sub === email ));

            const user = await usersDB.getUserByEmailMD5Async ( this.db, emailMD5 );
            assert ( user );

            user.password = await bcrypt.hash ( password, this.env.SALT_ROUNDS );
            await usersDB.setUserAsync ( this.db, user );

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

            await usersDB.affirmUserAsync ( this.db, user );

            result.json ( this.formatLoginResponse ( user, this.env.SIGNING_KEY_FOR_SESSION ));
            return;
        }
        catch ( error ) {

            console.log ( error );
        }
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
            const exists = await usersDB.hasUserByEmailMD5Async ( this.db, emailMD5 );
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