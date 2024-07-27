// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import { assert }               from '../assert';
import React                    from 'react';

//----------------------------------------------------------------//
async function clearBrowserCacheAsync ( version ) {

    const keys = await caches.keys ();
    for ( let name in keys ) {
        await caches.delete ( name );
    }
    window.location.reload ( true );
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
export function useManagedObject ( init, external, setExternal ) {

    const [ val, setVal ] = useObject ( init );
    return ( external !== undefined ) ? [ _.cloneDeep ( external ), setExternal || (() => {})] : [ val, setVal ];
}

//----------------------------------------------------------------//
export function useObject ( init ) {

    const [ val, setVal ] = React.useState ( init || {});
    return [
        _.cloneDeep ( val ),
        setVal,
    ];
}

//----------------------------------------------------------------//
export function useOnce ( func ) {

    React.useEffect (() => {
        func ();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

//----------------------------------------------------------------//
export function useOnceAsync ( func ) {

    React.useEffect (() => {
        ( async () => {
            await func ();
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

//----------------------------------------------------------------//
export function useRandomID ( version ) {

    return React.useState ( parseInt ( Date.now () * Math.random ()).toString ())[ 0 ];
}

//----------------------------------------------------------------//
export function useVersionedBrowserCache ( endpoint ) {

    React.useEffect (() => {
        ( async function () {

            const meta = await ( await fetch ( endpoint || '/', { cache: 'no-cache' })).json ();
            const localBuildID = localStorage.getItem ( 'build' );

            if ( !( meta && meta.buildID )) return;
            
            if ( localBuildID !== meta.buildID ) {
                await clearBrowserCacheAsync ();
                localStorage.setItem ( 'build', meta.buildID );
            }
        })();
    });
}
