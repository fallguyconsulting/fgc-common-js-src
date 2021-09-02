// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }                   from './assert';
import { Mailer }                   from './Mailer';
import { PasswordMiddleware }       from './PasswordMiddleware';
import * as roles                   from './roles';
import { SessionMiddleware }        from './SessionMiddleware';
import * as token                   from './token';
import * as env                     from 'env';
import express                      from 'express';
import bcrypt                       from 'bcryptjs';
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
    constructor ( db, templates, defaultRoles ) {
        
        assert ( templates );

        this.templates      = templates;
        this.roles          = defaultRoles || [];
        this.db             = db;

        this.mailer = new Mailer ( env );

        this.router = express.Router ();

        this.router.post        ( '/login',                 this.postLoginAsync.bind ( this ));
        this.router.post        ( '/login/reset',           this.postLoginWithPasswordResetAsync.bind ( this ));
        this.router.post        ( '/login/register',        this.postLoginWithRegisterUserAsync.bind ( this ));
        this.router.get         ( '/users/:userID',         this.getUserAsync.bind ( this ));
        this.router.get         ( '/allusers',              this.getAllUsersAsync.bind ( this ));
        this.router.post        ( '/verifier/:actionID',    this.postVerifierEmailRequestAsync.bind ( this ));

        const tokenMiddleware       = new token.TokenMiddleware ( env.SIGNING_KEY_FOR_SESSION, 'userID' );
        const sessionMiddleware     = new SessionMiddleware ( this.db.users );

        this.router.delete      ( '/users/:userID/unblock',     tokenMiddleware.withTokenAuth (), this.deleteUserBlockAsync.bind ( this ));
        this.router.put         ( '/users/:userID/block',       tokenMiddleware.withTokenAuth (), this.putUserBlockAsync.bind ( this ));
        this.router.get         ( '/users',                     tokenMiddleware.withTokenAuth (), this.getUsersAsync.bind ( this ));

        this.router.post (
            '/invitations',
            tokenMiddleware.withTokenAuth (),
            sessionMiddleware.withUser ( roles.ENTITLEMENT_SETS.CAN_INVITE_USER ),
            this.postInvitation.bind ( this )
        );

        if ( env.SERVER_ADMIN_PASSWORD ) {
            const middleware = new PasswordMiddleware ( 'X-Admin-Password', env.SERVER_ADMIN_PASSWORD, 'adminPassword' );
            this.router.post ( '/admin/roles', middleware.withPasswordAuth (), this.postUserRoles.bind ( this ));
        }
    }

    //----------------------------------------------------------------//
    async deleteUserBlockAsync ( request, result ) {

        try {
            const userID = request.params.userID;
            
            const conn = this.db.makeConnection ();

            await this.db.users.deleteBlockAsync ( conn, userID );

            result.json ({ status: 'OK' });
            return;
        }
        catch ( error ) {
            console.log ( error );
        }
        result.json ({});
        result.status ( 401 );
    }

    //----------------------------------------------------------------//
    formatLoginResponse ( user, signingKey ) {
        
        return {
            status:             'OK',
            session: {
                token:          token.create ( user.userID, 'localhost', 'self', signingKey ),
                userID:         user.userID,
                publicName:     this.db.users.formatUserPublicName ( user ),
                emailMD5:       user.emailMD5,
                roles:          env.SERVER_ADMIN_PASSWORD ? ( user.roles || []) : this.roles,
            },
        };
    }

    //----------------------------------------------------------------//
    async getUserAsync ( request, result ) {

        const userID = request.params.userID;
        console.log ( 'GET USER:', userID );

        const conn = this.db.makeConnection ();
        const user = await this.db.users.getUserByIDAsync ( conn, userID );

        if ( user ) {

            if ( request.userID === userID ) {
                result.json ( user );
            }
            else {
                result.json ({
                    userID:         userID,
                    emailMD5:       user.emailMD5,
                    publicName:     this.db.users.formatUserPublicName ( conn, user ),
                });
            }
        }
        else {
            result.json ({});
        }
    }

    //----------------------------------------------------------------//
    async getAllUsersAsync ( request, result ) {

        const query     = request.query || {};
        const base      = _.has ( query, 'base' ) ? parseInt ( query.base ) : 0;
        const count     = _.has ( query, 'count' ) ? parseInt ( query.count ) : 10;

        const conn = this.db.makeConnection ();
        const totalUsers = await this.db.users.getCountAsync ( conn );
        
        console.log ( 'TOTAL USERS', totalUsers );

        let top = base + count;
        top = top < totalUsers ? top : totalUsers;

        console.log ( base, top );

        const userIDs = await this.db.users.getUserIDAsync ( conn );
        const users = [];

        for ( let i = base; i < top; ++i ) {

            let userID = userIDs [ i ];
            const user = await this.db.users.getUserByIDAsync ( conn, userID );
            
            if ( user ) {
                users.push ({
                    userID:         userID,
                    emailMD5:       user.emailMD5,
                    publicName:     this.db.users.formatUserPublicName ( user ),
                    roles:          user.roles,
                    block:          user.block,
                });
            }
        }
        result.json ({
            totalUsers:     totalUsers,
            users:          users,
        });
    }

    //----------------------------------------------------------------//
    async getUsersAsync ( request, result ) {

        try {
            const searchTerm = request.query.search;

            const conn = this.db.makeConnection ();
            const searchResults = await this.db.users.findUsersAsync ( conn, searchTerm );

            result.json ({ users : searchResults });
            
        }
        catch ( error ) {
            console.log ( error );
        }
    }
    //----------------------------------------------------------------//
    async postInvitation ( request, result ) {

        try {

            console.log ( 'POST INVITATION' );

            const user = request.user;
            let roles = request.body.roles || [];
            roles = roles.filter (( x ) => { return request.user.roles.includes ( x )});

            console.log ( 'REQUESTED ROLES:', JSON.stringify ( request.body.roles || []));
            console.log ( 'USER ROLES:', JSON.stringify ( user.roles ));
            console.log ( 'ROLES:', JSON.stringify ( roles ));

            const email         = request.body.email;
            const emailMD5      = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );

            // if already exists, just apply the roles and be done with it
            const conn = this.db.makeConnection ();
            const exists = await this.db.users.hasUserByEmailMD5Async ( conn, emailMD5 );

            if ( exists ) {

                const invitee = await this.db.users.getUserByEmailMD5Async ( conn, emailMD5 );
                assert ( invitee.userID !== user.userID );

                console.log ( 'UPDATING ROLES:', invitee.userID, JSON.stringify ( roles ));
                invitee.roles = roles;
                this.db.users.setUserAsync ( conn, invitee );
            }
            else {

                await this.sendVerifierEmailAsync (
                    email,
                    token.create ( JSON.stringify ({ email: email, roles: roles }), 'localhost', 'self', env.SIGNING_KEY_FOR_REGISTER_USER ),
                    request.body.redirect,
                    this.templates.INVITE_USER_EMAIL_SUBJECT,
                    this.templates.INVITE_USER_EMAIL_TEXT_BODY_TEMPLATE,
                    this.templates.INVITE_USER_EMAIL_HTML_BODY_TEMPLATE
                );
            }
            result.json ({ status: 'OK' });
            return;
        }
        catch ( error ) {

            console.log ( error );
        }
        result.json ({});
        result.status ( 400 );
    }

    //----------------------------------------------------------------//
    async postLoginAsync ( request, result ) {

        console.log ( 'POST LOGIN' );

        try {

            const conn      = this.db.makeConnection ();

            const body      = request.body;
            const email     = body.email;
            const emailMD5  = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );
            const user      = await this.db.users.getUserByEmailMD5Async ( conn, emailMD5 );

            console.log ( email, emailMD5, user );

            if ( user ) {
                console.log ( 'FOUND USER:', user.userID );

                if ( user && await bcrypt.compare ( body.password, user.password )) {
                    console.log ( 'PASSWORDS MATCHED' );
                    result.json ( this.formatLoginResponse ( user, env.SIGNING_KEY_FOR_SESSION ));
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

            const conn          = this.db.makeConnection ();

            const body          = request.body;
            const verifier      = body.verifier;
            const password      = body.password;
            const email         = body.email;
            const emailMD5      = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );

            assert ( verifier );
            const verified = token.verify ( body.verifier, env.SIGNING_KEY_FOR_PASSWORD_RESET );
            assert ( verified && verified.body && verified.body.sub );

            const payload = JSON.parse ( verified.body.sub );
            assert ( payload.email === email );

            const user = await this.db.users.getUserByEmailMD5Async ( conn, emailMD5 );
            assert ( user );

            user.password = await bcrypt.hash ( password, env.SALT_ROUNDS );
            await this.db.users.setUserAsync ( conn, user );

            result.json ( this.formatLoginResponse ( user, env.SIGNING_KEY_FOR_SESSION ));
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

            const conn          = this.db.makeConnection ();

            const body          = request.body;

            console.log ( 'BODY', body );

            const verifier      = body.verifier;
            const firstname     = body.firstname;
            const lastname      = body.lastname || '';
            const password      = body.password;
            const email         = body.email;
            const emailMD5      = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );

            assert ( verifier );
            const verified = token.verify ( body.verifier, env.SIGNING_KEY_FOR_REGISTER_USER );
            assert ( verified && verified.body && verified.body.sub );

            const payload = JSON.parse ( verified.body.sub );
            assert ( payload.email === email );

            const usersCount = await this.db.users.getCountAsync ( conn );
            const roles = usersCount === 0 ? this.roles : payload.roles;

            let user = {
                firstname:      firstname,
                lastname:       lastname,
                password:       await bcrypt.hash ( password, env.SALT_ROUNDS ),
                emailMD5:       emailMD5, // TODO: encrypt plaintext email with user's password and store
                roles:          roles || [],
            };

            user = await this.db.users.affirmUserAsync ( conn, user );
            result.json ( this.formatLoginResponse ( user, env.SIGNING_KEY_FOR_SESSION ));
            return;
        }
        catch ( error ) {

            console.log ( error );
        }
        result.status ( 401 );
    }

    //----------------------------------------------------------------//
    async postUserRoles ( request, result ) {

        console.log ( 'POST ROLES' );

        try {

            const conn      = this.db.makeConnection ();

            const body      = request.body;
            const roles     = body.roles || [];

            let user = false;
            if ( body.userID ) {

                user            = await this.db.users.getUserByIDAsync ( conn, body.userID );
            }
            else if ( body.email ) {

                const email     = body.email;
                const emailMD5  = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );
                user            = await this.db.users.getUserByEmailMD5Async ( conn, emailMD5 );
            }            

            if ( user ) {
                console.log ( 'ROLES:', JSON.stringify ( roles, null, 4 ));
                user.roles = roles;
                await this.db.users.setUserAsync ( conn, user );
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

            const conn          = this.db.makeConnection ();

            const email         = request.body.email;
            const emailMD5      = crypto.createHash ( 'md5' ).update ( email ).digest ( 'hex' );

            // if already exists, send a password reset email.
            // do this for both RESET and REGISTER actions.
            const exists = await this.db.users.hasUserByEmailMD5Async ( conn, emailMD5 );
            if ( exists ) {

                console.log ( 'SENDING PASSWORD RESET EMAIL' );

                await this.sendVerifierEmailAsync (
                    email,
                    token.create ( JSON.stringify ({ email: email }), 'localhost', 'self', env.SIGNING_KEY_FOR_PASSWORD_RESET ),
                    false,
                    this.templates.RESET_PASSWORD_EMAIL_SUBJECT,
                    this.templates.RESET_PASSWORD_EMAIL_TEXT_BODY_TEMPLATE,
                    this.templates.RESET_PASSWORD_EMAIL_HTML_BODY_TEMPLATE
                );
                result.json ({ status: 'OK' });
                return;
            }
            
            // only send a new user email if REGISTER is explicitely requested.
            // this avoids sending new user emails to unregistered users.
            if ( actionID === VERIFIER_ACTIONS.REGISTER ) {

                console.log ( 'SENDING SIGNUP EMAIL' );

                // user doesn't exist, so send a create user email.
                await this.sendVerifierEmailAsync (
                    email,
                    token.create ( JSON.stringify ({ email: email }), 'localhost', 'self', env.SIGNING_KEY_FOR_REGISTER_USER ),
                    request.body.redirect,
                    this.templates.REGISTER_USER_EMAIL_SUBJECT,
                    this.templates.REGISTER_USER_EMAIL_TEXT_BODY_TEMPLATE,
                    this.templates.REGISTER_USER_EMAIL_HTML_BODY_TEMPLATE
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

    //----------------------------------------------------------------//
    async putUserBlockAsync ( request, result ) {

        try {
            const userID = request.params.userID;
    
            const conn = this.db.makeConnection ();
            await this.db.users.updateBlockAsync ( conn, userID );

            result.json ({ status: 'OK' });
            return;
        }
        catch ( error ) {
            console.log ( error );
        }
        result.json ({});
        result.status ( 401 );
    }

    //----------------------------------------------------------------//
    async sendVerifierEmailAsync ( email, verifier, redirect, subject, textTemplate, htmlTemplate ) {
        
        const context = {
            verifier: verifier,
            redirect: redirect || '/',
        };

        const text = textTemplate ( context );
        const html = htmlTemplate ( context );

        await this.mailer.mailTransport.sendMail ({
            from:       env.GMAIL_USER,
            to:         email,
            subject:    subject,
            text:       text,
            html:       html,
        });

        return context.verifier;
    }
}