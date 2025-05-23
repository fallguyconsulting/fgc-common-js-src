// Copyright (c) 2022 Fall Guy LLC All Rights Reserved.

import fetch            from 'cross-fetch';
import _                from 'lodash';

//================================================================//
// RevocableContext
//================================================================//
export class RevocableContext {

    //----------------------------------------------------------------//
    constructor () {

        //this.revocables     = new Map (); // need to use a proper set to hold objects as keys
        this.revocables         = {};
        this.finalized          = false;

        this.revocableID        = 0;
        this.availableIDs       = [];
    }

    //----------------------------------------------------------------//
    all ( promises ) {

        return this.promise ( Promise.all ( promises ));
    }

    //----------------------------------------------------------------//
    async deleteJSON ( url, headers ) {

        return this.fetchJSON ( url, {
            method:     'DELETE',
            headers:    headers,
        });
    }

    //----------------------------------------------------------------//
    fetch ( input, options, timeout ) {

        return this.promise ( fetch ( input, options ), timeout );
    }

    //----------------------------------------------------------------//
    async fetchJSON ( input, options = {}, timeout ) {

        options = _.cloneDeep ( options );
        options.credentials = options.credentials || 'include';

        options.headers = _.assign ({
            'content-type':     'application/json',
            'pragma':           'no-cache',
            'cache-control':    'no-cache',
        }, this.virtual_getHeaders () || {}, options.headers || {});

        const response  = await this.fetch ( this.virtual_formatURL ( input ), options, timeout );
        const text = await response.text ();
        
        let body;
        try {
            body = JSON.parse ( text ); 
        }
        catch ( error ) { // eslint-disable-line no-empty
        }

        if ( response.status >= 400 ) {
            throw {
                status:         response.status,
                statusText:     response.statusText,
                message:        body ? body.message : text,
                body:           body,
            };
        }
        return body;
    }

    //----------------------------------------------------------------//
    finalize () {

        this.finalized = true;
        this.revokeAll ();
    }

    //----------------------------------------------------------------//
    formatJsonBody ( body ) {

        if ( !body ) return undefined;
        if ( typeof ( body ) === 'string' ) return body;
        return JSON.stringify ( body );
    }

    //----------------------------------------------------------------//
    getID () {

        if ( this.availableIDs.length > 0 ) {
            return this.availableIDs.pop ();
        }
        return this.revocableID++;
    }

    //----------------------------------------------------------------//
    async getJSON ( url, headers ) {

        return this.fetchJSON ( url, { headers: headers, credentials: 'include' });
    }

    //----------------------------------------------------------------//
    async postJSON ( url, body, headers ) {

        return this.fetchJSON ( url, {
            method:     'POST',
            headers:    headers,
            body:       this.formatJsonBody ( body ),
        });
    }

    //----------------------------------------------------------------//
    promise ( promise, timeout ) {

        let isCancelled = false;
        let timer;

        const revocableID = this.getID ();

        const wrappedPromise = new Promise (( resolve, reject ) => {

            let onFulfilled = ( value ) => {
                if ( isCancelled ) {
                    reject ({ isCanceled: true });
                }
                else {
                    resolve ( value );
                }
            }

            let onRejected = ( error ) => {
                if ( isCancelled ) {
                    reject ({ isCanceled: true });
                }
                else {
                    reject ( error );
                }
            }

            let onFinally = () => {
                clearTimeout ( timer );
                delete this.revocables [ revocableID ];
                this.releaseID ( revocableID );
            }

            if ( timeout ) {
                timer = setTimeout (() => {
                    onRejected ( `TIMED OUT: ${ timeout }ms` );
                }, timeout );
            }

            promise.then ( onFulfilled, onRejected )
            .finally ( onFinally );
        });

        this.revocables [ revocableID ] = () => {
            isCancelled = true
            clearTimeout ( timer );
            this.releaseID ( revocableID );
        }
        
        wrappedPromise.revocableID = revocableID;
        return wrappedPromise;
    }

    //----------------------------------------------------------------//
    promiseWithBackoff ( makePromise, wait, asService, step, max, retries ) {

        step = step || 2;
        retries = retries || 0;
        max = typeof ( max ) === 'number' ? ( max > 0 ? max : false ) : wait * 10;

        return this.promise ( makePromise ())

        .then (() => {
            if ( asService ) {
                this.timeout (() => { this.promiseWithBackoff ( makePromise, wait, asService, step, max )}, wait );
            }
        })
        
        .catch (( error ) => {
            
            console.log ( error );
            
            retries = retries + 1;
            let retryDelay = wait * Math.pow ( 2, retries );
            retryDelay = ( max && ( retryDelay < max )) ? retryDelay : max;

            this.timeout (() => { this.promiseWithBackoff ( makePromise, wait, asService, step, max, retries )}, retryDelay );
        },

        wait );
    }

    //----------------------------------------------------------------//
    async putJSON ( url, body, headers ) {

        return this.fetchJSON ( url, {
            method:     'PUT',
            headers:    headers,
            body:       this.formatJsonBody ( body ),
        });
    }

    //----------------------------------------------------------------//
    timeout ( callback, delay ) {
        
        if ( this.finalized ) return;

        const revocableID = this.getID ();

        let timeout = setTimeout (() => {
            delete this.revocables [ revocableID ];
            this.releaseID ( revocableID );
            callback ();
        }, delay );

        this.revocables [ revocableID ] = () => {
            clearTimeout ( timeout );
            this.releaseID ( revocableID );
        }

        return {
            timeout:        timeout,
            revocableID:    revocableID,
        };
    }

    //----------------------------------------------------------------//
    releaseID ( revocableID ) {

        return this.availableIDs.push ( revocableID );
    }

    //----------------------------------------------------------------//
    revoke ( revocable ) {

        const revocableID = typeof ( revocable ) === 'number' ? revocable : revocable.revocableID;

        if ( this.revocables [ revocableID ]) {
            const revoke = this.revocables [ revocableID ];
            delete this.revocables [ revocableID ];
            revoke ();
        }
    }

    //----------------------------------------------------------------//
    revokeAll () {

        for ( let revoke of Object.values ( this.revocables )) {
            revoke ();
        }
        this.revocables = {};
        this.virtual_revokeAll ();
    }

    //----------------------------------------------------------------//
    sleep ( millis ) {
        
        return this.promise ( new Promise ( resolve => setTimeout ( resolve, millis )));
    }

    //----------------------------------------------------------------//
    virtual_formatURL ( url ) {
        return url;
    }

    //----------------------------------------------------------------//
    virtual_getHeaders () {
    }

    //----------------------------------------------------------------//
    virtual_revokeAll () {
    }
}
