// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

//================================================================//
// RevocableContext
//================================================================//
export class RevocableContext {

    //----------------------------------------------------------------//
    constructor () {

        this.revocables = new Map (); // need to use a proper set to hold objects as keys
        this.finalized = false;
    }

    //----------------------------------------------------------------//
    finalize () {

        this.finalized = true;
        this.revokeAll ();
    }

    //----------------------------------------------------------------//
    all ( promises ) {
        return this.promise ( Promise.all ( promises ));
    }

    //----------------------------------------------------------------//
    fetch ( input, init, timeout ) {
        return this.promise ( fetch ( input, init ), timeout );
    }

    //----------------------------------------------------------------//
    fetchJSON ( input, init, timeout ) {
        return this.fetch ( input, init, timeout )
            .then ( response => this.promise ( response.json ()));
    }

    //----------------------------------------------------------------//
    promise ( promise, timeout ) {

        let isCancelled = false;
        let timer;

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
                this.revocables.delete ( wrappedPromise );
            }

            if ( timeout ) {
                timer = setTimeout (() => {
                    onRejected ( 'TIMED OUT' );
                }, timeout );
            }

            promise.then ( onFulfilled, onRejected )
            .finally ( onFinally );
        });

        this.revocables.set ( wrappedPromise, () => {
            isCancelled = true
            clearTimeout ( timer );
        });
        
        return wrappedPromise;
    };

    //----------------------------------------------------------------//
    promiseWithBackoff ( makePromise, wait, asService, step, max, retries ) {

        step = step || 2;
        retries = retries || 0;
        max = typeof ( max ) == 'number' ? ( max > 0 ? max : false ) : wait * 10;

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
    timeout ( callback, delay ) {
        
        if ( this.finalized ) return;

        let timeout = setTimeout (() => {
            this.revocables.delete ( timeout );
            callback ();
        }, delay );

        this.revocables.set ( timeout, () => {
            clearTimeout ( timeout );
        });
        return timeout;
    }

    //----------------------------------------------------------------//
    revoke ( revocable ) {

        if ( this.revocables.has ( revocable )) {
            this.revocables.get ( revocable )();
            this.revocables.delete ( revocable );
        }
    }

    //----------------------------------------------------------------//
    revokeAll () {

        this.revocables.forEach (( revoke ) => {
            revoke ();
        });
        this.revocables.clear ();
    }

    //----------------------------------------------------------------//
    sleep ( millis ) {
        return this.promise ( new Promise ( r => setTimeout ( r, millis )));
    }
}
