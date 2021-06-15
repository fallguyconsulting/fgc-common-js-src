import { StatusCodes }              from 'http-status-codes'

export const ERROR_STATUS = {
    ERROR:          StatusCodes.BAD_REQUEST,
    UNAUTHORIZED:   StatusCodes.UNAUTHORIZED,
    FORBIDDEN:      StatusCodes.FORBIDDEN,
    NODE_FOUND:     StatusCodes.NOT_FOUND,
};

//================================================================//
// ModelError
//================================================================//
export class ModelError extends Error {

    constructor ( status, message ) {
        super ( message );
        this.name       = 'ModelError';
        this.status     = status || ERROR_STATUS.ERROR;
    }
}
