// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as storage                         from './storage';
import * as util                            from './util';
import { extendObservable, runInAction }    from 'mobx';

//================================================================//
// StorageContext
//================================================================//
export class StorageContext {

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
        util.observeField ( owner, memberKey, persistField );

        this.storageResetters [ storageKey ] = () => {
            runInAction (() => {
                owner [ memberKey ] = init;
            });
        }

        if ( !hasStoredValue ) {
            persistField ();
        }
    }

    //----------------------------------------------------------------//
    constructor ( prefix ) {
        this.storageResetters   = {};
        this.prefix             = prefix || '';
    }

    //----------------------------------------------------------------//
    reset () {

        for ( let memberKey in this.storageResetters ) {
            this.storageResetters [ memberKey ]();
        }
    }
}
