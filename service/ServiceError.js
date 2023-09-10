
//================================================================//
// ServiceError
//================================================================//
export class ServiceError extends Error {

    //----------------------------------------------------------------//
    constructor ( status, message ) {
        if (( typeof ( status ) === 'string' ) || !status ) {
            message = status || 'A service error occured.';
            status  = 400;
        }
        super ( message );
        this.status = status;
    }
}
