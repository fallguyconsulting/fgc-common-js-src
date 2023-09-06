import { StatusCodes }              from 'http-status-codes'

//================================================================//
// ModelError
//================================================================//
export class ModelError extends Error {

    static ERROR_STATUS = {
        ERROR:          StatusCodes.BAD_REQUEST,
        UNAUTHORIZED:   StatusCodes.UNAUTHORIZED,
        FORBIDDEN:      StatusCodes.FORBIDDEN,
        NODE_FOUND:     StatusCodes.NOT_FOUND,
    };

    //----------------------------------------------------------------//
    constructor ( status, message ) {
        super ( message );
        this.name       = 'ModelError';
        this.status     = status || ModelError.ERROR_STATUS.ERROR;
    }
}
