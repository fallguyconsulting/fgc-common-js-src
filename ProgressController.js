// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { RevocableContext }                             from './RevocableContext';
import { action, computed, observable, runInAction }    from 'mobx';

//================================================================//
// ProgressController
//================================================================//
export class ProgressController {

    @observable depth       = 0;
    @observable message     = '';
    @observable waiting     = true;

    //----------------------------------------------------------------//
    @computed get
    loading () {
        return Boolean ( this.waiting || ( this.depth > 0 ));
    }

    //----------------------------------------------------------------//
    constructor ( waiting ) {

        this.revocable = new RevocableContext ();

        runInAction (() => {
            this.waiting = waiting === undefined ? true : waiting;
        });
    }

    //----------------------------------------------------------------//
    @action
    onProgress ( message, millis ) {
        if ( message ) {
            this.message = message;
        }
        return this.sleep ( millis )
    }

    //----------------------------------------------------------------//
    @action
    setLoading ( loading ) {
        this.waiting = false;
        this.depth += loading ? 1 : -1;
        if ( this.depth <= 0 ) {
            this.message = '';
        }
    }

    //----------------------------------------------------------------//
    sleep ( millis ) {
        return this.revocable.sleep ( millis || 1 );
    }
}
