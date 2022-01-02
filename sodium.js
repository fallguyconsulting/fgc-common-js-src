// Copyright (c) 2021 Fall Guy LLC All Rights Reserved.

import * as fgc             from 'fgc';
import sodium               from 'libsodium-wrappers';

// https://sodium-friends.github.io/docs/docs/api

export const HEX_REGEX  = /^[0-9A-F]+$/i;
export const KEY_SIZE   = 32;

//----------------------------------------------------------------//
export function decryptPK ( ciphertext, publicKey, secretKey, encoding ) {

    publicKey           = toBuffer ( publicKey );
    secretKey           = toBuffer ( secretKey );
    ciphertext          = toBuffer ( ciphertext );

    return fromBuffer ( sodium.crypto_box_seal_open ( ciphertext, publicKey, secretKey ), encoding || 'utf8' );
}

//----------------------------------------------------------------//
export function decryptSymmetric ( nonceAndCiphertext, key, encoding ) {

    const [ nonceHex, ciphertextHex ] = nonceAndCiphertext.split ( '-' );

    key                 = toBuffer ( key );
    const nonce         = toBuffer ( nonceHex );
    const ciphertext    = toBuffer ( ciphertextHex );

    return fromBuffer ( sodium.crypto_secretbox_open_easy ( ciphertext, nonce, key ), encoding || 'utf8' );
}

//----------------------------------------------------------------//
export function deriveKey ( password, salt, size ) {

    const key = sodium.crypto_pwhash (
        size || KEY_SIZE,
        password,
        toBuffer ( salt ),
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_DEFAULT
    );

    return sodium.to_hex ( key );
}

//----------------------------------------------------------------//
export function encryptPK ( plaintext, publicKey, encoding ) {

    plaintext           = toBuffer ( plaintext, encoding || 'utf8' );
    publicKey           = toBuffer ( publicKey );
    const ciphertext    = sodium.crypto_box_seal ( plaintext, publicKey );

    return sodium.to_hex ( ciphertext );
}

//----------------------------------------------------------------//
export function encryptionKeyPair () {

    const keyPair       = sodium.crypto_box_keypair ();

    return {
        publicKey:      fromBuffer ( keyPair.publicKey ),
        secretKey:      fromBuffer ( keyPair.privateKey ),
    };
}

//----------------------------------------------------------------//
export function encryptSymmetric ( plaintext, key, encoding, nonce ) {

    plaintext           = toBuffer ( plaintext, encoding || 'utf8' );
    key                 = toBuffer ( key );
    nonce               = nonce ? toBuffer ( nonce ) : randomBytes ( sodium.crypto_secretbox_NONCEBYTES );
    const ciphertext    = sodium.crypto_secretbox_easy ( plaintext, nonce, key );

    return [ sodium.to_hex ( nonce ), sodium.to_hex ( ciphertext )].join ( '-' );
}

//----------------------------------------------------------------//
export function fromBuffer ( value, encoding ) {

    fgc.assert ( Uint8Array.prototype.isPrototypeOf ( value ), 'Value must be of type Uint8Array.' );

    encoding = encoding || 'hex';

    switch ( encoding ) {
        case 'bytes':       return value;
        case 'base64':      return sodium.to_base64 ( value );
        case 'utf8':        return sodium.to_string ( value );
        case 'json':        return JSON.parse ( sodium.to_string ( value ));
        case 'hex':         return sodium.to_hex ( value );
    }

    fgc.assert ( false, 'Unknown encoding.' );
    return false;
}

//----------------------------------------------------------------//
export function hash ( plaintext, key, size, encoding ) {

    plaintext           = toBuffer ( plaintext, encoding || 'utf8' );
    key                 = key ? toBuffer ( key ) : undefined;

    return sodium.to_hex ( sodium.crypto_generichash ( size || sodium.crypto_generichash_BYTES_MAX, plaintext, key ));
}

//----------------------------------------------------------------//
export function hashPassword ( password, salt ) {

    if ( salt ) {
        return sodium.crypto_pwhash ( password, salt, sodium.crypto_pwhash_OPSLIMIT_SENSITIVE, sodium.crypto_pwhash_MEMLIMIT_SENSITIVE, sodium.crypto_pwhash_ALG_DEFAULT );
    }
    return sodium.crypto_pwhash_str ( password, sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE, sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE );
}

//----------------------------------------------------------------//
export async function initAsync () {

    await sodium.ready;
}

//----------------------------------------------------------------//
export function key ( size ) {

    return randomBytes ( size || KEY_SIZE, 'hex' );
}

//----------------------------------------------------------------//
export function keyForHash ( size ) {

    return randomBytes ( size || sodium.crypto_generichash_KEYBYTES_MAX, 'hex' );
}

//----------------------------------------------------------------//
export function nonce () {

    return randomBytes ( sodium.crypto_secretbox_NONCEBYTES, 'hex' );
}

//----------------------------------------------------------------//
export function randomBytes ( size, encoding ) {

    return fromBuffer ( sodium.randombytes_buf ( size ), encoding || 'bytes' );
}

//----------------------------------------------------------------//
export function salt () {

    return randomBytes ( sodium.crypto_pwhash_SALTBYTES, 'hex' );
}

//----------------------------------------------------------------//
export function sign ( message, secretKey ) {

    // note: message must be a utf8 string OR a byte buffer

    return sodium.to_hex ( sodium.crypto_sign_detached ( message, toBuffer ( secretKey )));
}

//----------------------------------------------------------------//
export function signingKeyPair ( size ) {

    const keyPair = sodium.crypto_sign_keypair ();

    return {
        publicKey:      fromBuffer ( keyPair.publicKey ),
        secretKey:      fromBuffer ( keyPair.privateKey ),
    };
}

//----------------------------------------------------------------//
export function toBuffer ( value, encoding ) {

    if ( Uint8Array.prototype.isPrototypeOf ( value )) return value;

    encoding = encoding || 'hex';

    switch ( encoding ) {
        case 'base64':      return sodium.from_base64 ( value );
        case 'utf8':        return sodium.from_string ( value );
        case 'json':        return sodium.from_string ( JSON.stringify ( value ));
        case 'hex': {

            if ( value ) {
                fgc.assert (( fgc.util.isString ( value ) && HEX_REGEX.test ( value )), 'Value must be a hex-encoded string.' );
                fgc.assert ((( value.length % 2 ) === 0 ), 'Hex-encoded string must have an even number of characters.' );
            }
            return sodium.from_hex ( value );
        }
    }

    fgc.assert ( false, 'Unknown encoding.' );
    return false;
}

//----------------------------------------------------------------//
export function verify ( signature, message, publicKey, encoding ) {

    return sodium.crypto_sign_verify_detached (
        toBuffer ( signature ),
        toBuffer ( message, encoding || 'utf8' ),
        toBuffer ( publicKey )
    );
}

//----------------------------------------------------------------//
export function verifyPassword ( hashedPassword, password ) {

    return sodium.crypto_pwhash_str_verify ( hashedPassword, password );
}
