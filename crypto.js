// Copyright (c) 2019 Fall Guy LLC All Rights Reserved.

import * as base64              from './base64';
import { randomBytes }          from './randomBytes';
import * as bip32               from 'bip32';
import * as bip39               from 'bip39';
import * as bitcoin             from 'bitcoinjs-lib';
import CryptoJS                 from 'crypto-js';
// import JSEncrypt                from 'jsencrypt';
import JSEncrypt                from 'node-jsencrypt';
import keyutils                 from 'js-crypto-key-utils';
import * as secp256k1           from 'secp256k1'

// https://8gwifi.org/ecsignverify.jsp

//================================================================//
// Key
//================================================================//
class Key {

    //----------------------------------------------------------------//
    constructor () {
    }

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

        return this._getPrivate ( 'hex' );
    }

    //----------------------------------------------------------------//
    getPublic ( format ) {

        return this._getPublic ( format );
    }

    //----------------------------------------------------------------//
    getPublicHex () {

        return this._getPublic ( 'hex' );
    }

    //----------------------------------------------------------------//
    hash ( message ) {

        return bitcoin.crypto.sha256 ( message ).toString ( 'hex' ).toUpperCase ();
    }

    //----------------------------------------------------------------//
    sign ( message ) {

        return this._sign ( message );
    }

    //----------------------------------------------------------------//
    verify ( message, sigHex ) {

        return this._verify ( message );
    }
}

//================================================================//
// ECKey
//================================================================//
class ECKey extends Key {

    //----------------------------------------------------------------//
    constructor ( ecpair ) {
        super ();

        this.ecpair     = ecpair;
        this.type       = 'EC';
    }

    //----------------------------------------------------------------//
    _getKeyID () {

        // TODO: make this shiz case insensitive!
        return bitcoin.crypto.sha256 ( this.getPublicHex ()).toString ( 'hex' ).toLowerCase ();
    }

    //----------------------------------------------------------------//
    _getPrivate ( format ) {

        switch ( format ) {

            case 'hex': {
                return this.getPrivate ().toString ( 'hex' ).toUpperCase ();
            }

            case 'json': {
                return {
                    type:           'EC_HEX',
                    groupName:      'secp256k1',
                    privateKey:     this.getPrivate ( 'hex' ),
                };
            }
        }
        return this.ecpair.privateKey;
    }

    //----------------------------------------------------------------//
    _getPublic ( format ) {

        switch ( format ) {

            case 'hex': {
                return this.getPublic ().toString ( 'hex' ).toUpperCase ();
            }

            case 'json': {
                return {
                    type:           'EC_HEX',
                    groupName:      'secp256k1',
                    publicKey:      this.getPublic ( 'hex' ),
                };
            }
        }
        return this.ecpair.publicKey;
    }

    //----------------------------------------------------------------//
    _sign ( message ) {

        const signature = this.ecpair.sign ( bitcoin.crypto.sha256 ( message ))
        return secp256k1.signatureExport ( signature ).toString ( 'hex' ).toUpperCase ();
    }

    //----------------------------------------------------------------//
    _verify ( message, sigHex ) {

        const signature = Buffer.from ( sigHex, 'hex' );
        return this.ecpair.verify ( bitcoin.crypto.sha256 ( message ), signature );
    }
}

//================================================================//
// RSAKey
//================================================================//
class RSAKey extends Key {

    //----------------------------------------------------------------//
    constructor ( pem ) {
        super ();

        const rsapair = new JSEncrypt ();
        rsapair.setPrivateKey ( pem );

        if ( !rsapair.key.d ) throw 'Not an RSA PEM.'

        this.rsapair = rsapair;
        this.type = 'RSA';
    }

    //----------------------------------------------------------------//
    _getKeyID () {

        // TODO:
        return '';
    }

    //----------------------------------------------------------------//
    _getPrivate ( format ) {

        switch ( format ) {

            case 'hex': {
                throw 'Unsupported format';
            }

            case 'json': {
                return {
                    type:           'RSA_PEM',
                    privateKey:     this.rsapair.getPrivateKey (),
                };
            }
        }
        return this.rsapair;
    }

    //----------------------------------------------------------------//
    _getPublic ( format ) {

        switch ( format ) {

            case 'hex': {
                throw 'Unsupported format';
            }

            case 'json': {
                return {
                    type:           'RSA_PEM',
                    publicKey:      this.rsapair.getPublicKey (),
                };
            }
        }
        return this.rsapair;
    }

    //----------------------------------------------------------------//
    _sign ( message ) {

        const sig = this.rsapair.sign ( message, CryptoJS.SHA256, 'sha256' );
        return base64.toHex ( sig ).toLowerCase ();
    }

    //----------------------------------------------------------------//
    _verify ( message, sigHex ) {

        const signature = Buffer.from ( sigHex, 'hex' );
        return this.rsapair.verify ( message, signature, CryptoJS.SHA256 );
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

    return new ECKey ( bitcoin.ECPair.fromPrivateKey ( new Buffer ( privateKeyHex, 'hex' )));
}

//----------------------------------------------------------------//
export async function loadKeyAsync ( phraseOrPEM ) {

    console.log ( 'LOAD KEY ASYNC' );
    console.log ( phraseOrPEM );

    try {
        if ( bip39.validateMnemonic ( phraseOrPEM )) {
            return mnemonicToKey ( phraseOrPEM );
        }
        console.log ( 'NOT A VALID MNEMONIC' );
    }
    catch ( error ) {
        console.log ( error );
    }
    
    try {
        const json = JSON.parse ( phraseOrPEM );
        if ( json && json.type ) {

            switch ( json.type ) {

                case 'EC_PEM':
                case 'RSA_PEM':
                    phraseOrPEM = json.privateKey;
                    console.log ( 'PEM:', phraseOrPEM );
                    break;

                case 'EC_HEX':
                    return keyFromPrivateHex ( json.privateKey );
            }
        }
    }
    catch ( error ) {
        console.log ( 'NOT A JSON KEY' );
    }

    try {

        try {
            return new RSAKey ( phraseOrPEM );
        }
        catch ( error ) {
            console.log ( 'NOT AN RSA PEM' );
        }

        const key = await pemToKeyAsync ( phraseOrPEM );

        // console.log ( key );

        // const publicKey = key.getPublicKeyBuffer ().toString ( 'hex' ).toUpperCase ();
        // console.log ( 'PUBLIC_KEY', publicKey );

        // const privateKey = key.d.toHex ().toUpperCase ();
        // console.log ( 'PRIVATE_KEY', privateKey );

        return key;
    }
    catch ( error ) {
        console.log ( error );
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

    console.log ( 'BIP32 xpriv:', key.toBase58 ());
    console.log ( 'BIP32 xpub:', key.neutered ().toBase58 ());

    // const address = key.getAddress ();
    const address = bitcoin.payments.p2pkh ({ pubkey: key.publicKey }).address;
    console.log ( 'address:', address );

    return new ECKey ( key );
}

//----------------------------------------------------------------//
export function privateHexToKey ( privateKeyHex ) {

    const privKey = new Buffer ( privateKeyHex, 'hex' );

    return new ECKey ( bitcoin.ECPair.fromPrivateKey ( privKey ));
}

//----------------------------------------------------------------//
export async function pemToKeyAsync ( pem ) {

    const keyObj    = new keyutils.Key ( 'pem', pem );
    const jwk       = await keyObj.export ( 'jwk', { outputPublic: false });
    const privKey   = new Buffer ( jwk.d, 'base64' );

    return new ECKey ( bitcoin.ECPair.fromPrivateKey ( privKey ));
}

//----------------------------------------------------------------//
export function sha256 ( message ) {

    return bitcoin.crypto.sha256 ( message ).toString ( 'hex' ).toUpperCase ();
}
