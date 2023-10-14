// Copyright (c) 2023 Fall Guy LLC All Rights Reserved.


//================================================================//
// DBModel
//================================================================//
export class DBModel {

    //----------------------------------------------------------------//
    async saveAsync () {
        await this.getDM ().saveAsync ( this );
    }

    //----------------------------------------------------------------//
    toJSON () {
        return this.getDM ().toJSON ( this );
    }
}
