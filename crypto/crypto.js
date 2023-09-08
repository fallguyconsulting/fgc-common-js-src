// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as base64              from './base64';
import * as pem                 from './pem';
import { randomBytes }          from './randomBytes';
import * as bip32               from 'bip32';
import * as bip39               from 'bip39';
import * as bitcoin             from 'bitcoinjs-lib';
import * as crypto              from 'crypto';
import CryptoJS                 from 'crypto-js';
import JSEncrypt                from 'jsencrypt';
import { computed } from 'mobx';
import * as secp256k1           from 'secp256k1'

// TODO: need to input/ouput PEM, HEX, BASE64, etc. from all key types
// TODO: would like to go all *synchronous* if possible

// https://8gwifi.org/ecsignverify.jsp

export const CRYPTO_FORMAT = {
    BASE64:     'base64',
    HEX:        'hex',
    JSON:       'json',
    PEM:        'pem',
};

export const CRYPTO_KEY_TYPE = {
    EC:         'EC',
    RSA:        'RSA',
};

//================================================================//
// Key
//================================================================//
class Key {

    @computed get       privateHEX      () { return this.getPublic ( 'hex' ); }
    @computed get       privatePEM      () { return this.getPublic ( 'pem' ); }
    @computed get       publicHEX       () { return this.getPublic ( 'hex' ); }
    @computed get       publicPEM       () { return this.getPublic ( 'pem' ); }

    //----------------------------------------------------------------//
    getKeyID () {

        return this._getKeyID ();
    }

    //----------------------------------------------------------------//
    getPrivate ( format ) {

        return this._getPrivate ( format );
    }

    //----------------------------------------------------------------//
    getPrivateHex () {

        return this._getPrivate ( CRYPTO_FORMAT.HEX );
    }

    //----------------------------------------------------------------//
    getPublic ( format ) {

        return this._getPublic ( format );
    }

    //----------------------------------------------------------------//
    getPublicHex () {

        return this._getPublic ( CRYPTO_FORMAT.HEX );
    }

    //----------------------------------------------------------------//
    hash ( message ) {

        return bitcoin.crypto.sha256 ( message ).toString ( CRYPTO_FORMAT.HEX ).toUpperCase ();
    }

    //----------------------------------------------------------------//
    publicIsMatch ( other ) {

        return this._publicIsMatch ( other );
    }

    //----------------------------------------------------------------//
    sign ( message, encoding ) {

        return this._sign ( message, encoding || CRYPTO_FORMAT.HEX );
    }

    //----------------------------------------------------------------//
    verify ( message, sigString, encoding ) {

        return this._verify ( message, sigString, encoding || CRYPTO_FORMAT.HEX );
    }
}

//================================================================//
// ECKey
//================================================================//
export class ECKey extends Key {

    //----------------------------------------------------------------//
    computeECDHSecret ( publicHex ) {

        const ecdh = crypto.createECDH ( 'secp256k1' );
        ecdh.generateKeys ( 'hex', 'compressed' );
        ecdh.setPrivateKey ( this.ecpair.privateKey.toString ( 'hex' ), 'hex' );
        return ecdh.computeSecret ( new Buffer ( publicHex, 'hex' ), 'hex' ).toString ( 'hex' );
    }

    //----------------------------------------------------------------//
    constructor ( ecpair ) {
        super ();

        this.ecpair     = ecpair;
        this.type       = CRYPTO_KEY_TYPE.EC;
    }

    //----------------------------------------------------------------//
    decrypt ( ciphertext, fromPublicHex ) {

        try {
            return aesCipherToPlain ( ciphertext, this.computeECDHSecret ( fromPublicHex ));
        }
        catch ( error ) {
            console.log ( error );
        }
        return false;
    }

    //----------------------------------------------------------------//
    encrypt ( plaintext, toPublicHex ) {

        return aesPlainToCipher ( plaintext, this.computeECDHSecret ( toPublicHex ));
    }

    //----------------------------------------------------------------//
    _getKeyID () {

        // TODO: make this shiz case insensitive!
        return bitcoin.crypto.sha256 ( this.getPublicHex ()).toString ( 'hex' ).toLowerCase ();
    }

    //----------------------------------------------------------------//
    _getPrivate ( format ) {

        switch ( format ) {

            case CRYPTO_FORMAT.HEX: {
                return this.getPrivate ().toString ( 'hex' ).toUpperCase ();
            }

            case CRYPTO_FORMAT.JSON: {
                return {
                    type:           'EC_HEX',
                    groupName:      'secp256k1',
                    privateKey:     this.getPrivate ( CRYPTO_FORMAT.HEX ),
                };
            }
        }
        return this.ecpair.privateKey;
    }

    //----------------------------------------------------------------//
    _getPublic ( format ) {

        switch ( format ) {

            case CRYPTO_FORMAT.HEX: {
                return this.getPublic ().toString ( 'hex' ).toUpperCase ();
            }

            case CRYPTO_FORMAT.JSON: {
                return {
                    type:           'EC_HEX',
                    groupName:      'secp256k1',
                    publicKey:      this.getPublic ( CRYPTO_FORMAT.HEX ),
                };
            }
        }
        return this.ecpair.publicKey;
    }

    //----------------------------------------------------------------//
    _publicIsMatch ( other ) {

        return ( this.ecpair.publicKey.compare ( other.ecpair.publicKey ) === 0 );
    }

    //----------------------------------------------------------------//
    _sign ( message, encoding ) {

        const signature = this.ecpair.sign ( bitcoin.crypto.sha256 ( message ))

        const sigString = secp256k1.signatureExport ( signature ).toString ( encoding );
        return encoding === CRYPTO_FORMAT.HEX ? sigString.toUpperCase () : sigString;
    }

    //----------------------------------------------------------------//
    _verify ( message, sigString, encoding ) {

        const signature = secp256k1.signatureImport ( Buffer.from ( sigString, encoding ));
        return this.ecpair.verify ( bitcoin.crypto.sha256 ( message ), signature );
    }
}

//================================================================//
// RSAKey
//================================================================//
export class RSAKey extends Key {

    //----------------------------------------------------------------//
    constructor ( pem ) {
        super ();

        const rsapair = new JSEncrypt ();
        rsapair.setKey ( pem );
        if ( !rsapair.key.e ) throw 'Not an RSA PEM.'
        
        this.rsapair = rsapair;
        this.type = CRYPTO_KEY_TYPE.RSA;
    }

    //----------------------------------------------------------------//
    _getKeyID () {

        // TODO:
        return '';
    }

    //----------------------------------------------------------------//
    _getPrivate ( format ) {

        switch ( format ) {

            case CRYPTO_FORMAT.HEX: {
                throw 'Unsupported format';
            }

            case CRYPTO_FORMAT.JSON: {
                return {
                    type:           'RSA_PEM',
                    privateKey:     this.getPrivate ( 'pem' ),
                };
            }

            case CRYPTO_FORMAT.PEM: {
                return this.rsapair.getPrivateKey ();
            }
        }
        return this.rsapair;
    }

    //----------------------------------------------------------------//
    _getPublic ( format ) {

        switch ( format ) {

            case CRYPTO_FORMAT.HEX: {
                throw 'Unsupported format';
            }

            case CRYPTO_FORMAT.JSON: {
                return {
                    type:           'RSA_PEM',
                    publicKey:      this.getPublic ( 'pem' ),
                };
            }

            case CRYPTO_FORMAT.PEM: {
                return this.rsapair.getPublicKey ();
            }
        }
        return this.rsapair;
    }

    //----------------------------------------------------------------//
    get
    hasPrivate () {
        return Boolean ( this.rsapair.key.d );
    }

    //----------------------------------------------------------------//
    _publicIsMatch ( other ) {

        const k0 = this.rsapair.key;
        const k1 = other.rsapair.key;

        return ( k0.n.equals ( k1.n ) && ( k0.e === k1.e ));
    }

    //----------------------------------------------------------------//
    _sign ( message, encoding ) {

        const sig = this.rsapair.sign ( message, CryptoJS.SHA256, 'sha256' ); // sig is base64 by default
        return encoding === CRYPTO_FORMAT.HEX ? base64.toHex ( sig ).toLowerCase () : sig;
    }

    //----------------------------------------------------------------//
    _verify ( message, sigString, encoding ) {
        
        const sig = encoding === CRYPTO_FORMAT.HEX ? base64.fromHex ( sigString ) : sigString; // need to go back to base64
        return this.rsapair.verify ( message, sig, CryptoJS.SHA256 );
    }
}

//================================================================//
// api
//================================================================//

//----------------------------------------------------------------//
export function aesCipherToPlain ( ciphertext, password ) {

    return CryptoJS.AES.decrypt ( ciphertext, password ).toString ( CryptoJS.enc.Utf8 );
}

//----------------------------------------------------------------//
export function aesPlainToCipher ( plaintext, password ) {

    return CryptoJS.AES.encrypt ( plaintext, password ).toString ();
}

//----------------------------------------------------------------//
export function generateMnemonic ( bytes ) {

    let mnemonic;

    do {
        // Use browser's crypto to get CSPRNG bytes to create mnemonic phrase
        // Broswers before IE 11 and really old Chrome/FF are screwed
        let rb = randomBytes ( bytes || 16 );
        mnemonic = bip39.entropyToMnemonic ( rb.toString ( 'hex' ));
    }
    while ( !bip39.validateMnemonic ( mnemonic ));

    return mnemonic;
}

//----------------------------------------------------------------//
export function keyFromPrivateHex ( privateKeyHex ) {

    return new ECKey ( bitcoin.ECPair.fromPrivateKey ( Buffer.from ( privateKeyHex, 'hex' )));
}

//----------------------------------------------------------------//
export async function loadKeyAsync ( phraseOrPEM, password ) {

    console.log ( 'LOAD KEY ASYNC' );

    // try to load from mnemonic
    try {
        if ( bip39.validateMnemonic ( phraseOrPEM )) {
            return mnemonicToKey ( phraseOrPEM );
        }
        console.log ( 'NOT A VALID MNEMONIC' );
    }
    catch ( error ) {
        console.log ( error );
    }

    // try to load from JSON
    try {
        const json = JSON.parse ( phraseOrPEM );
        if ( json && json.type ) {

            switch ( json.type ) {

                case 'EC_PEM':
                case 'RSA_PEM':
                    phraseOrPEM = json.privateKey;
                    break;

                case 'EC_HEX':
                    return keyFromPrivateHex ( json.privateKey );
            }
        }
    }
    catch ( error ) {
        console.log ( 'NOT A JSON KEY' );
    }

    // try to load from PEM
    try {

        const jwk = await pem.pemToJWKAsync ( phraseOrPEM, password );

        switch ( jwk.kty ) {
            case 'EC': {
                return new ECKey ( bitcoin.ECPair.fromPrivateKey ( new Buffer ( jwk.d, 'base64' )));
            }
            case 'RSA': {
                return new RSAKey ( await pem.jwkToPEMAsync ( jwk ));
            }
        }
    }
    catch ( error ) {
        if ( error instanceof pem.PEMPasswordError ) throw error;
        console.log ( 'NOT A VALID PEM' );
    }

    throw new Error ( 'Unknown key type' );
}

//----------------------------------------------------------------//
export function mnemonicToKey ( mnemonic, path ) {
    
    // ticket basket addict level barrel hobby release ivory luxury sausage modify zero
    // pub: 02E7886533261C4D8201F65C5944DA9FE7940E6B499E590665EA8E21DDB109C7BD
    // priv: B464336E5EA3FC9A322F420E782E352162262831AAEBC7CEEF8BA467CBCA7413
    // addr: 12r9DzsFe13UFTmrafukYqRKSsawgnFPUX

    // https://iancoleman.io/bip39/?#english

    // path = "m/44'/0'/0'/0"
    // path = "m/44'/0'/0'/0/0"

    if ( !bip39.validateMnemonic ( mnemonic )) {
        throw new Error ( 'invalid mnemonic phrase' );
    }

    // Generate seed from mnemonic
    const seed = bip39.mnemonicToSeed ( mnemonic );
    console.log ( 'seed:', seed.toString ( 'hex' ));

    let key = bip32.fromSeed ( seed )

    if ( path ) {
        // Derive BIP32 Extended Keys
        key = key.derivePath ( path );
    }

    // console.log ( 'BIP32 xpriv:', key.toBase58 ());
    // console.log ( 'BIP32 xpub:', key.neutered ().toBase58 ());

    // const address = key.getAddress ();
    // const address = bitcoin.payments.p2pkh ({ pubkey: key.publicKey }).address;
    // console.log ( 'address:', address );

    return new ECKey ( key );
}

//----------------------------------------------------------------//
export function sha256 ( message ) {

    return bitcoin.crypto.sha256 ( message ).toString ( 'hex' ).toUpperCase ();
}
