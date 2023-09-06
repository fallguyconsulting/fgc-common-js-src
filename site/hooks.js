// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }               from '../assert';
import * as storage             from './storage';
import { extendObservable, isObservable, observe } from 'mobx';
import { deepObserve }          from 'mobx-utils';
import React                    from 'react';
import { Redirect }             from 'react-router';

//----------------------------------------------------------------//
async function clearBrowserCacheAsync ( version ) {

    const storedVersion = localStorage.getItem ( 'version' );
    if ( storedVersion !== version ) {

        console.log ( 'NEW VERSION DETECTED; EMPTYING CACHE' );

        const keys = await caches.keys ();
        for ( let name in keys ) {
            await caches.delete ( name );
        }
        window.location.reload ( true );

        localStorage.setItem ( 'version', version );
    }
}

//----------------------------------------------------------------//
export function useAnimationFrame ( callback ) {

    const timeRef           = React.useRef ();
    const requestRef        = React.useRef ();

    const animate = time => {

        callback ( timeRef.current  ? ( time - timeRef.current ) : 0 );

        timeRef.current     = time;
        requestRef.current  = requestAnimationFrame ( animate );
    }

    React.useEffect (() => {
        requestRef.current  = requestAnimationFrame ( animate );
        return () => cancelAnimationFrame ( requestRef.current );
    }, []);
}

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

//----------------------------------------------------------------//
export function useVersionedBrowserCache ( version ) {

    React.useEffect (() => {
        clearBrowserCacheAsync ( version );
    });
}
