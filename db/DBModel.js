// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.


//================================================================//
// DBModel
//================================================================//
export class DBModel {

    //----------------------------------------------------------------//
    static bindDM ( modelClazz, dmClazz ) {
        dmClazz.prototype.getModelType = () => modelClazz;
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
