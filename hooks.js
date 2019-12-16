// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as storage             from './storage';
import { extendObservable, isObservable, observe } from 'mobx';
import { deepObserve }          from 'mobx-utils';
import React                    from 'react';
import { Redirect }             from 'react-router';

//----------------------------------------------------------------//
export function useFinalizable ( factory ) {

    const serviceRef = React.useRef ();
    serviceRef.current = serviceRef.current || factory ();

    React.useEffect (
        () => {

            const current = serviceRef.current;

            return () => {
                if ( current.finalize ) {
                    current.finalize ();
                }
            };
        },
        []
    );

    return serviceRef.current;
}
