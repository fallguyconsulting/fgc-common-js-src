// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }               from './assert';
import * as storage             from './storage';
import { extendObservable, isObservable, observe } from 'mobx';
import { deepObserve }          from 'mobx-utils';
import React                    from 'react';
import { Redirect }             from 'react-router';

//----------------------------------------------------------------//
export function useFinalizable ( factory ) {

    const serviceRef = React.useRef ();
    serviceRef.current = serviceRef.current || factory ();

    assert ( serviceRef.current, 'Did not create finalizable.' );
    assert ( typeof ( serviceRef.current.finalize ) === 'function', 'Missing finalize () method.' );

    React.useEffect (
        () => {

            const current = serviceRef.current;

            return () => {
                current.finalize ();
            };
        },
        []
    );
    return serviceRef.current;
}

//----------------------------------------------------------------//
export function useFinalizer ( finalizer ) {

    React.useEffect (
        () => {
            return finalizer;
        },
        []
    );
}

