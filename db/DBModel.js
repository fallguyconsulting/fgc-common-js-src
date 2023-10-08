// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.

import { assert }                           from '../assert';
import * as util                            from '../util';
import _                                    from 'lodash';

//================================================================//
// DBModel
//================================================================//
export class DBModel {

    //----------------------------------------------------------------//
    static bindDM ( modelClazz, dmClazz ) {

        dmClazz.prototype.getModelType = () => modelClazz;
    }

    //----------------------------------------------------------------//
    constructor () {
    }

    //----------------------------------------------------------------//
    async saveAsync () {
        await this.getDM ().saveAsync ( this );
    }

    //----------------------------------------------------------------//
    toJSON () {
        return this.getDM ().toJSON ( this );
    }
}
