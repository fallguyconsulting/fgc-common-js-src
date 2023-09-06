// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import asn                      from 'asn1.js';
import keyutils                 from 'js-crypto-key-utils';
import jseu                     from 'js-encoding-utils';

const RSAPrivateKey = asn.define ( 'RSAPrivateKey', function () {
    this.seq ().obj (
        this.key ( 'version' ).use ( Version ),
        this.key ( 'modulus' ).int (),
        this.key ( 'publicExponent' ).int (),
        this.key ( 'privateExponent' ).int (),
        this.key ( 'prime1' ).int (),
        this.key ( 'prime2' ).int (),
        this.key ( 'exponent1' ).int (),
        this.key ( 'exponent2' ).int (),
        this.key ( 'coefficient' ).int (),
        this.key ( 'otherPrimeInfos' ).optional ().use ( OtherPrimeInfos )
    );
});

const RSAPublicKey = asn.define ( 'RSAPublicKey', function () {
    this.seq ().obj (
        this.key ( 'modulus' ).int (),
        this.key ( 'publicExponent' ).int ()
    );
});

const SubjectPublicKeyInfo = asn.define ( 'SubjectPublicKeyInfo', function () {
    this.seq ().obj (
        this.key ( 'algorithm' ).use ( AlgorithmIdentifier ),
        this.key ( 'subjectPublicKey' ).bitstr ()
    );
});

const OneAsymmetricKey = asn.define ( 'OneAsymmetricKey', function () {
    this.seq ().obj (
        this.key ( 'version' ).use ( Version ),
        this.key ( 'privateKeyAlgorithm').use ( AlgorithmIdentifier ),
        this.key ( 'privateKey' ).octstr (),
        this.key ( 'attributes' ).implicit ( 0 ).optional ().any (),
        this.key ( 'publicKey' ).implicit ( 1 ).optional ().bitstr ()
    );
});

const OtherPrimeInfos = asn.define ( 'OtherPrimeInfos', function (){
    this.seqof ( OtherPrimeInfo );
});

const OtherPrimeInfo = asn.define ( 'OtherPrimeInfo', function () {
    this.seq ().obj (
        this.key ( 'prime' ).int (),
        this.key ( 'exponent' ).int (),
        this.key ( 'coefficient' ).int (),
    );
});

const PrivateKeyInfo = asn.define ( 'PrivateKeyInfo', function () {
    this.seq ().obj (
        this.key ( 'version' ).use ( Version ),
        this.key ( 'privateKeyAlgorithm').use ( AlgorithmIdentifier ),
        this.key ( 'privateKey' ).octstr (),
        this.key ( 'attributes' ).implicit ( 0 ).optional ().any (),
    );
});

const EncryptedPrivateKeyInfo = asn.define('EncryptedPrivateKeyInfo', function () {
    this.seq ().obj (
        this.key ( 'encryptionAlgorithm' ).use ( AlgorithmIdentifier ),
        this.key ( 'encryptedData' ).octstr ()
    );
});

const AlgorithmIdentifier = asn.define ( 'AlgorithmIdentifier', function () {
    this.seq ().obj (
        this.key ( 'algorithm' ).objid (),
        this.key ( 'parameters' ).optional ().any ()
    );
});

const Version = asn.define ( 'Version', function () {
    this.int ();
});

const KeyStructure = asn.define ( 'KeyStructure', function () {
    this.choice ({

        // PKCS#1
        rsaPrivateKey:                  this.use ( RSAPrivateKey ),
        rsaPublicKey:                   this.use ( RSAPublicKey ),

        // PKCS#8
        subjectPublicKeyInfo:           this.use ( SubjectPublicKeyInfo ),
        oneAsymmetricKey:               this.use ( OneAsymmetricKey ),
        encryptedPrivateKeyInfo:        this.use ( EncryptedPrivateKeyInfo ),
        privateKeyInfo:                 this.use ( PrivateKeyInfo ),
    });
});

//================================================================//
// PEMPasswordError
//================================================================//
export class PEMPasswordError extends Error {

    //----------------------------------------------------------------//
    constructor ( message ) {
        super ( message );
    }
}

//----------------------------------------------------------------//
export function appendLeadingZeros ( array, len ) {
    if ( array.length > len ) throw new Error ( 'InvalidLength' );
    const returnArray = new Uint8Array ( len ); // initialized with zeros
    returnArray.set ( array, len - array.length );
    return returnArray;
};

//----------------------------------------------------------------//
export function jwkEncodeRSAComponent ( array ) {

    // prune leading zeros JWW RSA private key: https://tools.ietf.org/html/rfc7517
    return jseu.encoder.encodeBase64Url ( pruneLeadingZeros ( array ));
};

//----------------------------------------------------------------//
export async function jwkToPEMAsync ( jwk ) {

    const keyObj = new keyutils.Key ( 'jwk', jwk );
    return await keyObj.export ( 'pem' );
}

//----------------------------------------------------------------//
export async function pemToJWKAsync ( pem, passphrase ) {

    const binKey = jseu.formatter.pemToBin ( pem );
    const decoded = KeyStructure.decode ( Buffer.from ( binKey ), 'der' );

    switch ( decoded.type ) {

        // PKCS#1 - hand-create the JWT
        case 'rsaPrivateKey':
        case 'rsaPublicKey': {

            console.log ( 'PKCS#1' );

            const key                   = decoded.value;

            const nLen                  = key.modulus.byteLength ();
            const len                   = ( nLen % 128 === 0 ) ? nLen : nLen + ( 128 - ( nLen % 128 ));
            const hLen                  = nLen >> 1;

            const modulus               = new Uint8Array ( key.modulus.toArray ( 'be', len ));
            const publicExponent        = new Uint8Array ( key.publicExponent.toArray ( 'be', key.publicExponent.byteLength ()));

            const jwk = {
                kty:    'RSA',
                n:      jwkEncodeRSAComponent ( modulus ),
                e:      jwkEncodeRSAComponent ( publicExponent ),
            };

            if ( decoded.type === 'rsaPrivateKey' ) {

                const privateExponent   = new Uint8Array ( key.privateExponent.toArray ( 'be', len ));
                const prime1            = new Uint8Array ( key.prime1.toArray ( 'be', hLen ));
                const prime2            = new Uint8Array ( key.prime2.toArray ( 'be', hLen ));
                const exponent1         = new Uint8Array ( key.exponent1.toArray ( 'be', hLen ));
                const exponent2         = new Uint8Array ( key.exponent2.toArray ( 'be', hLen ));
                const coefficient       = new Uint8Array ( key.coefficient.toArray ( 'be', hLen ));

                jwk.d       = jwkEncodeRSAComponent ( privateExponent );
                jwk.p       = jwkEncodeRSAComponent ( prime1 );
                jwk.q       = jwkEncodeRSAComponent ( prime2 );
                jwk.dp      = jwkEncodeRSAComponent ( exponent1 );
                jwk.dq      = jwkEncodeRSAComponent ( exponent2 );
                jwk.qi      = jwkEncodeRSAComponent ( coefficient );
            }

            return jwk;
        }

        // PKCS#8 -- fall back on js-crypto-key-utils
        case 'subjectPublicKeyInfo':
        case 'oneAsymmetricKey':
        case 'encryptedPrivateKeyInfo': {

            console.log ( 'PKCS#8' );

            const keyObj = new keyutils.Key ( 'pem', pem );
            if ( keyObj.isEncrypted ) {
                try {
                    await keyObj.decrypt ( passphrase );
                }
                catch ( error ) {
                    throw new PEMPasswordError ( 'Bad password' );
                }
            }
            return await keyObj.export ( 'jwk' );
        }
    };
}

//----------------------------------------------------------------//
export function pruneLeadingZeros ( array ) {

    let offset = 0;
    for ( let i = 0; i < array.length; i++ ) {
    if ( array [ i ] !== 0x00 ) break;
        offset++;
    }

    const returnArray = new Uint8Array ( array.length - offset );
    returnArray.set ( array.slice ( offset, array.length ));
    return returnArray;
};
