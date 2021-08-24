// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }                           from './assert';
import * as storage                         from './storage';
import { observeField }                     from './observeField';
import * as util                            from './util';
import _                                    from 'lodash';
import { extendObservable, runInAction }    from 'mobx';

//const debugLog = function () {}
const debugLog = function ( ...args ) { console.log ( '@STORAGE CONTEXT:', ...args ); }

//================================================================//
// StorageContext
//================================================================//
export class StorageContext {

    //----------------------------------------------------------------//
    clear () {
        storage.clear ();
        this.reset ();
    }

    //----------------------------------------------------------------//
    constructor ( prefix ) {

        this.storageReloaders   = {}; // indexed by storage key
        this.storageResetters   = {};
        this.observerDisposers  = {};
        this.prefix             = prefix || '';

        this.onStorageEvent = ( event ) => {

            const storageKey    = event.key;
            const memberKey     = _.findKey ( this.storageKeysByMemberKey, storageKey );

            console.log ( '##### STORAGE EVENT #####' );
            console.log ( event.key );

            if ( event.newValue === null ) {
                delete this.storageKeysByMemberKey [ memberKey ];
                delete this.storageReloaders [ storageKey ];
            }
            else if ( _.has ( this.storageReloaders, storageKey )) {
                this.storageReloaders [ storageKey ]( event.newValue );
            }
        };

        window.addEventListener ( 'storage', this.onStorageEvent );   
    }

    //----------------------------------------------------------------//
    finalize () {

        for ( let memberKey in this.observerDisposers ) {
            debugLog ( 'disposing observer', memberKey );
            this.observerDisposers [ memberKey ]();
        }
        window.removeEventListener ( 'storage', this.onStorageEvent );
    }

    //----------------------------------------------------------------//
    persist ( owner, memberKey, storageKey, init, load, store ) {

        storageKey = this.prefix + storageKey;

        if ( _.has ( this.storageResetters, storageKey )) return owner [ memberKey ];

        let storedValue = storage.getItem ( storageKey );
        storedValue = ( load && ( storedValue !== null )) ? load ( storedValue ) : storedValue;
        const hasStoredValue = storedValue !== null;

        const member = hasStoredValue ? storedValue : init;
        assert ( member != null );

        extendObservable ( owner, {[ memberKey ]: member });

        const persistField = () => {
            const newVal = owner [ memberKey ];
            storage.setItem ( storageKey, store ? store ( newVal ) : newVal );
        }
        this.observerDisposers [ memberKey ] = observeField ( owner, memberKey, persistField );

        this.storageResetters [ memberKey ] = () => {
            runInAction (() => {
                owner [ memberKey ] = ( typeof ( init ) === 'function' ) ? init () : init;
            });
        }

        this.storageReloaders [ storageKey ] = ( newVal ) => {
            console.log ( '##### STORAGE RELOAD: #####' );
            console.log ( memberKey, storageKey );

            runInAction (() => {
                if ( newVal === null ) {
                    delete owner [ memberKey ];
                    delete this.storageResetters [ memberKey ];
                    delete this.storageReloaders [ storageKey ];
                }
                else {
                    newVal = JSON.parse ( newVal );
                    owner [ memberKey ] = ( load && ( newVal !== null )) ? load ( newVal ) : newVal;
                }
            });
        }

        const storageKeysByMemberKey = this.storageKeysByMemberKey || {};
        storageKeysByMemberKey [ memberKey ] = storageKey;
        this.storageKeysByMemberKey = storageKeysByMemberKey;

        if ( !hasStoredValue ) {
            persistField ();
        }
        return owner [ memberKey ]; 
    }

    //----------------------------------------------------------------//
    remove ( owner, memberKey ) {

        const storageKey = this.storageKeysByMemberKey [ memberKey ];

        if ( storageKey && memberKey && owner [ memberKey ]) {

            storage.removeItem ( storageKey );

            this.observerDisposers [ memberKey ]();
            delete this.observerDisposers [ memberKey ];

            delete owner [ memberKey ];
            delete this.storageResetters [ memberKey ];
            delete this.storageReloaders [ storageKey ];
        }
    }

    //----------------------------------------------------------------//
    reset ( mk ) {

        if ( mk ) {
            this.storageResetters [ mk ]();
        }
        else {
            for ( let memberKey in this.storageResetters ) {
                this.storageResetters [ memberKey ]();
            }
        }
    }
}
