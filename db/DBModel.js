// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.


//================================================================//
// DBModel
//================================================================//
export class DBModel {

    //----------------------------------------------------------------//
    didLoad () {
        this.virtual_didLoad ();
    }

    //----------------------------------------------------------------//
    async saveAsync () {
        await this.getDM ().saveAsync ( this );
    }

    //----------------------------------------------------------------//
    toJSON () {
        return this.getDM ().toJSON ( this );
    }

    //----------------------------------------------------------------//
    // eslint-disable-next-line unused-imports/no-unused-vars
    virtual_didLoad () {
    }
}
