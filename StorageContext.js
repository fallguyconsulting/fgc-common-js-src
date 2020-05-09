// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as storage                         from './storage';
import { observeField }                     from './observeField';
import * as util                            from './util';
import _                                    from 'lodash';
import { extendObservable, runInAction }    from 'mobx';

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
        this.prefix             = prefix || '';

        this.onStorageEvent = ( event ) => {
            console.log ( '##### STORAGE EVENT #####' );  
            console.log ( event.key );

            if ( _.has ( this.storageReloaders, event.key )) {
                this.storageReloaders [ event.key ]( event.newValue );
            }
        };

        window.addEventListener ( 'storage', this.onStorageEvent );   
    }

    //----------------------------------------------------------------//
    finalize () {
        window.removeEventListener ( 'storage', this.onStorageEvent );
    }

    //----------------------------------------------------------------//
    persist ( owner, memberKey, storageKey, init, load, store ) {

        storageKey = this.prefix + storageKey;

        let storedValue = storage.getItem ( storageKey );
        storedValue = ( load && ( storedValue !== null )) ? load ( storedValue ) : storedValue;

        const hasStoredValue = storedValue !== null;

        const member = hasStoredValue ? storedValue : init;
        extendObservable ( owner, {[ memberKey ]: member });

        const persistField = () => {
            const newVal = owner [ memberKey ];
            storage.setItem ( storageKey, store ? store ( newVal ) : newVal );
        }
        observeField ( owner, memberKey, persistField );

        this.storageResetters [ storageKey ] = () => {
            runInAction (() => {
                owner [ memberKey ] = ( typeof ( init ) === 'function' ) ? init () : init;
            });
        }

        this.storageReloaders [ storageKey ] = ( newVal ) => {
            console.log ( '##### STORAGE RELOAD: #####' );
            console.log ( memberKey, storageKey );
            runInAction (() => {
                newVal = JSON.parse ( newVal );
                owner [ memberKey ] = ( load && ( newVal !== null )) ? load ( newVal ) : newVal;
            });
        }

        if ( !hasStoredValue ) {
            persistField ();
        }
    }

    //----------------------------------------------------------------//
    reset () {

        for ( let memberKey in this.storageResetters ) {
            this.storageResetters [ memberKey ]();
        }
    }
}
