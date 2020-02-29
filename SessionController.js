/* eslint-disable no-whitespace-before-property */

import { assert }               from './assert';
import { StorageContext }       from './StorageContext';
import * as util                from 'fgc';
import { action, computed, extendObservable, observable, runInAction } from "mobx";

const STORE_SESSION = 'session';

//================================================================//
// SessionController
//================================================================//
export class SessionController {

    @observable isLoggingIn = false;

    //----------------------------------------------------------------//
    constructor () {
        this.storage = new StorageContext ();
        this.storage.persist ( this, 'session', STORE_SESSION, {});
    }

    //----------------------------------------------------------------//
    finalize () {
    }

    //----------------------------------------------------------------//
    @computed get
    gravatar () {
        return `https://www.gravatar.com/avatar/${ this.session.emailMD5 }?d=retro&s=128`;
    }

    //----------------------------------------------------------------//
    @computed get
    isLoggedIn () {
        return ( this.session.token && ( this.session.token.length > 0 ));
    }

    //----------------------------------------------------------------//
    @action
    login ( session ) {
        if ( session ) {
            this.session = session;
            this.isLoggingIn = false;
        }
        else {
            this.isLoggingIn = true;
        }
    }

    //----------------------------------------------------------------//
    @action
    logout () {
        this.session = {}
        this.isLoggingIn = false;
    }

    //----------------------------------------------------------------//
    @computed get
    publicName () {
        return this.session.publicName || '';
    }

    //----------------------------------------------------------------//
    @computed get
    token () {
        return this.session.token || '';
    }

    //----------------------------------------------------------------//
    @computed get
    userID () {
        return this.session.userID || '';
    }
}
