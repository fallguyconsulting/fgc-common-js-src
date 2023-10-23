// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { isObservable, observe } from 'mobx';
import { deepObserve }          from 'mobx-utils';

//----------------------------------------------------------------//
export function observeField ( owner, field, callback ) {

    let valueDisposer = false;

    const setValueObserver = () => {

        valueDisposer && valueDisposer (); // not strictly necessary, but why not?
        valueDisposer = false;

        if ( isObservable ( owner [ field ])) {
            valueDisposer = deepObserve ( owner [ field ], callback );
        }
    }

    setValueObserver ();

    let fieldDisposer = observe ( owner, field, ( change ) => {

        setValueObserver ();
        callback ( change );
    });

    return () => {

        valueDisposer && valueDisposer ();
        fieldDisposer ();
    }
}
