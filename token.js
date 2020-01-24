import njwt                 from 'njwt';
import secureRandom         from 'secure-random';

//================================================================//
// token
//================================================================//

//----------------------------------------------------------------//
export function create ( username, issuer, scope, signingKeyBase64 ) {

    const signingKey = Buffer.from ( signingKeyBase64, 'base64' );

    try {
        let claims = {
            iss:        issuer, // https://pancakehermit.com
            sub:        username,
            scope:      scope, // 'self, admins'
        }
        const jwt = njwt.create ( claims, signingKey );

        // disable expiration (for now)
        delete ( jwt.body.exp );

        const jwt64 = jwt.compact ();
        return jwt64;
    }
    catch ( error ) {
        console.log ( error );
    }
}

//----------------------------------------------------------------//
export function makeMiddleware ( signingKey, fieldForTokenSub ) {

    return async ( request, result, next ) => {

        if ( request.method === 'OPTIONS' ) {
            next ();
            return;
        }

        const jwt64 = request.header ( 'X-Auth-Token' ) || false;

        try {
            const token = verify ( jwt64, signingKey );
            if ( token ) {
                request.token = token;
                if ( fieldForTokenSub ) {
                    request [ fieldForTokenSub ] = token.body.sub;
                }
                next ();
                return;
            }
        }
        catch ( error ) {
            next ( error );
        }
        result.status ( 401 ).send ({});
    }
}

//----------------------------------------------------------------//
export function makeSigningKeyBase64 () {

    return secureRandom ( 256, { type: 'Buffer' }).toString ( 'base64' );
}

//----------------------------------------------------------------//
export function verify ( jwt64, signingKeyBase64 ) {

    if ( typeof ( jwt64 ) != 'string' ) return false;
    if ( jwt64.length === 0 ) return false;

    const signingKey = Buffer.from ( signingKeyBase64, 'base64' );

    try {
        return njwt.verify ( jwt64, signingKey );
    }
    catch ( error ) {
        console.log ( error );
        return false;
    }
}
