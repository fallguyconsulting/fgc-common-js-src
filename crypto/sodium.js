// Copyright (c) 2022 Fall Guy LLC All Rights Reserved.

import { assert }           from '../assert';
import * as util            from '../util';
import sodium               from 'libsodium-wrappers';

// https://sodium-friends.github.io/docs/docs/api

export const HEX_REGEX  = /^[0-9a-fA-F]+$/i;
export const KEY_SIZE   = 32;

//----------------------------------------------------------------//
export function convert ( value, from, to ) {

    from    = from || to;
    to      = to || from;

    return ( to === from ) ? value : fromBuffer ( toBuffer ( value, from ), to );
}

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
export function encryptionKeyPair ( seed ) {

    const keyPair       = seed ? sodium.crypto_box_seed_keypair ( toBuffer ( seed )) : sodium.crypto_box_keypair ();

    return {
        publicKey:      fromBuffer ( keyPair.publicKey ),
        secretKey:      fromBuffer ( keyPair.privateKey ),
    };
}

//----------------------------------------------------------------//
export function encryptionKeyPairSeed () {

    return this.randomBytes ( sodium.crypto_box_SEEDBYTES );
}

//----------------------------------------------------------------//
export function encryptionKeyTuple ( seed ) {

    const keyPair = encryptionKeyPair ( seed );
    return [ keyPair.publicKey, keyPair.secretKey ];
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

    assert ( value.constructor === Uint8Array, 'Value must be of type Uint8Array.' );

    encoding = encoding || 'hex';

    switch ( encoding ) {
        case 'bytes':       return value;
        case 'base64':      return sodium.to_base64 ( value, sodium.base64_variants.ORIGINAL_NO_PADDING );
        case 'utf8':        return sodium.to_string ( value );
        case 'json':        return JSON.parse ( sodium.to_string ( value ));
        case 'hex':         return sodium.to_hex ( value );
    }

    assert ( false, 'Unknown encoding.' );
    return false;
}

//----------------------------------------------------------------//
export function hash ( plaintext, key, size, encoding = 'utf8', out = 'hex' ) {

    plaintext           = toBuffer ( plaintext, encoding );
    key                 = key ? toBuffer ( key ) : undefined;

    return fromBuffer ( sodium.crypto_generichash ( size || sodium.crypto_generichash_BYTES_MAX, plaintext, key ), out );
}

//----------------------------------------------------------------//
export function hashPassword ( password, salt, size ) {

    if ( salt ) {
        return sodium.to_hex ( sodium.crypto_pwhash (
            size || sodium.crypto_box_SEEDBYTES,
            password,
            toBuffer ( salt ),
            sodium.crypto_pwhash_OPSLIMIT_MODERATE,
            sodium.crypto_pwhash_MEMLIMIT_MODERATE,
            sodium.crypto_pwhash_ALG_DEFAULT
        ));
    }
    return sodium.crypto_pwhash_str ( password, sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE, sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE );
}

//----------------------------------------------------------------//
export async function initAsync () {

    await sodium.ready;

    assert ( sodium.crypto_pwhash_SALTBYTES, `This libsodium version missing 'crypto_pwhash_SALTBYTES'; trouble ahead.` );

    const buffer = sodium.randombytes_buf ( sodium.crypto_pwhash_SALTBYTES );
    assert ( buffer.constructor === Uint8Array, 'This libsodium did not return a buffer of type Uint8Array; trouble ahead.' );
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
export function saltDummy ( seed ) {

    // sodium.randombytes_SEEDBYTES is undefined for some reason
    const paddedArray = new Uint8Array ( 32 );
    paddedArray.fill ( 0 );
    paddedArray.set ( toBuffer ( seed ).slice ( 0, 32 ));

    return fromBuffer ( sodium.randombytes_buf_deterministic ( sodium.crypto_pwhash_SALTBYTES, paddedArray ), 'hex' );
}

//----------------------------------------------------------------//
export function sign ( plaintext, secretKey, encoding ) {

    plaintext = toBuffer ( plaintext, encoding || 'utf8' );
    return sodium.to_hex ( sodium.crypto_sign ( plaintext, toBuffer ( secretKey )));
}

//----------------------------------------------------------------//
export function signDetached ( message, secretKey, encoding ) {

    message = toBuffer ( message, encoding || 'utf8' );
    return sodium.to_hex ( sodium.crypto_sign_detached ( message, toBuffer ( secretKey )));
}

//----------------------------------------------------------------//
export function signingKeyPair () {

    const keyPair = sodium.crypto_sign_keypair ();

    return {
        publicKey:      fromBuffer ( keyPair.publicKey ),
        secretKey:      fromBuffer ( keyPair.privateKey ),
    };
}

//----------------------------------------------------------------//
export function symmetricKey () {

    return randomBytes ( KEY_SIZE, 'hex' );
}

//----------------------------------------------------------------//
export function toBuffer ( value, encoding ) {

    if ( value.constructor === Uint8Array ) return value;

    encoding = encoding || 'hex';

    switch ( encoding ) {
        case 'base64':      return sodium.from_base64 ( value, sodium.base64_variants.ORIGINAL_NO_PADDING );
        case 'utf8':        return sodium.from_string ( value );
        case 'json':        return sodium.from_string ( JSON.stringify ( value ));
        case 'hex': {

            if ( value ) {
                assert (( util.isString ( value ) && HEX_REGEX.test ( value )), 'Value must be a hex-encoded string.' );
                assert ((( value.length % 2 ) === 0 ), 'Hex-encoded string must have an even number of characters.' );
            }
            return sodium.from_hex ( value );
        }
    }

    assert ( false, 'Unknown encoding.' );
    return false;
}

//----------------------------------------------------------------//
export function unpackMessage ( messageSG, encoding ) {

    return convert ( messageSG.slice ( sodium.crypto_sign_BYTES * 2 ), 'hex', encoding );    
}

//----------------------------------------------------------------//
export function unpackSignature ( messageSG ) {

    return messageSG.slice ( 0, sodium.crypto_sign_BYTES * 2 );
}

//----------------------------------------------------------------//
export function verify ( ciphertext, publicKey, encoding ) {

    const plaintext = sodium.crypto_sign_open (
        toBuffer ( ciphertext ),
        toBuffer ( publicKey)
    );

    return plaintext ? fromBuffer ( plaintext, encoding || 'utf8' ) : false;
}

//----------------------------------------------------------------//
export function verifyDetached ( signature, message, publicKey, encoding ) {

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
