// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }               from './assert';
import * as storage             from './storage';
import { extendObservable, isObservable, observe } from 'mobx';
import { deepObserve }          from 'mobx-utils';
import React                    from 'react';
import { Redirect }             from 'react-router';

//----------------------------------------------------------------//
export function finalize ( object ) {

    if ( object ) {
        if ( object.finalize ) {
            object.finalize ();
        }
        finalize ( object.revocable );
        finalize ( object.storage );
    }
}

//----------------------------------------------------------------//
export function useFinalizable ( factory ) {

    const serviceRef = React.useRef ();
    serviceRef.current = serviceRef.current || factory ();

    assert ( serviceRef.current, 'Failed to create finalizable.' );

    React.useEffect (
        () => {

            const current = serviceRef.current;

            return () => {
                finalize ( current );
            };
        },
        []
    );
    return serviceRef.current;
}

//----------------------------------------------------------------//
export function useFinalizer ( finalizer, defaultTarget ) {

    const targetRef = React.useRef ({ target: defaultTarget });

    React.useEffect (
        () => {

            const current = targetRef.current;

            return () => {
                finalizer ( current.target )
            };
        },
        []
    );
    return ( target ) => {
        targetRef.current.target = target
    };
}

