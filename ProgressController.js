// Copyright (c) 2019 Cryptogogue, Inc. All Rights Reserved.

import { action, computed, observable }         from 'mobx';

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
    constructor () {
    }

    //----------------------------------------------------------------//
    finalize () {
    }

    //----------------------------------------------------------------//
    @action
    onProgress ( message ) {
        this.message = message;
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
}
