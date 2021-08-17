// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as storage             from './storage';
import { extendObservable, isObservable, observe, runInAction } from 'mobx';
import { deepObserve }          from 'mobx-utils';

//const debugLog = function () {}
const debugLog = function ( ...args ) { console.log ( '@OBSERVE FIELD:', ...args ); }

//----------------------------------------------------------------//
export function observeField ( owner, field, callback ) {

    let valueDisposer = false;

    const setValueObserver = () => {

        debugLog ( 'setting value observer', field );

        valueDisposer && valueDisposer (); // not strictly necessary, but why not?
        valueDisposer = false;

        if ( isObservable ( owner [ field ])) {
            valueDisposer = deepObserve ( owner [ field ], callback );
        }
    }

    setValueObserver ();

    let fieldDisposer = observe ( owner, field, ( change ) => {

        debugLog ( 'field did change', field );

        setValueObserver ();
        callback ( change );
    });

    return () => {

        debugLog ( 'disposing observed field', field );

        valueDisposer && valueDisposer ();
        fieldDisposer ();
    }
}
