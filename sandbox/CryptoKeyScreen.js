/* eslint-disable no-whitespace-before-property */
/* eslint-disable no-loop-func */

import { RevocableContext }             from '../site/RevocableContext'
import { SingleColumnContainerView }    from '../semantic-ui/SingleColumnContainerView'
import * as crypto                      from '../crypto/crypto';
import * as hooks                       from '../site/hooks';
import * as util                        from '../util';
import { action, computed, extendObservable, observable, observe, runInAction } from 'mobx';
import { observer }                     from 'mobx-react';
import React, { useState }              from 'react';
import * as UI                          from 'semantic-ui-react';

const DEFAULT_PASSWORD = 'password';

const DEFAULT_KEY_PKCS1_RSA = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQDWAGMCbfbocXawNOncmQb389ueUEJhAgw1FmS6Xl0PnxDwe5Kc
7qQ+cj2pj8qZU8EPj7zmjjAsXZP/MZTrfczr9wRpsnKYJxp6NUOqnMpYw9q/nynS
kVXAwjEpv13StszLswvm41lCGHNrzoqrCZLC1Zcdx/99GpU+BxMlyL5H2QIDAQAB
AoGBALq5BarWBg0VC2l+EdvgTftFdIfzIagBIGOl0Wfn9C0wLpiWSfvSIc824OS1
SSJ1uMt6MGm/APuE/yA4w+aiEozsH7HEgoXj2XciQ0EHsqqsbLLWgiJ5LeMGtrdO
N6ZblzYsoP+qMfRALEkT5nrsWzHqPw98GggTaz4WHpwHYfwxAkEA9zSceq6fGEyo
hhA4QasCKsFPbsrZt+Ev1b+chUi7DW8ajXAOREmjUX9VAui4jjOWmvsTby/NW3vs
sMa1BI3z3QJBAN2dX/RthwokWQnwy0HuuPH3vodMVugg/J27jvf7WRJj9MZmEsd/
Z8GMKYaY1UaRFYHGEyb0Z6YxVpiFh1faci0CQGgfTNmPu4ssnr75Dfj64orHqYFt
B48f1lodvvuUytS5u2FflWLF8XhePZxgEXwz1neo0WK/q6ug4u0ChTRJ5jECQAVx
uku87RZYsj9GRRgHj0+ScIHOZEwrk0kktGxvJk8HWZoOI+P2w0vD77k4w/SJ1+dq
QEoysuEoUSJKFXsZCLkCQHwPFrqMkNHrF3C4RzZOe74IRXDQjNLvets+DCsMHL+P
VVNj2Di+Y6b9tgXSaVyLY4jzPMAVdRZDqzb1dtCvMjk=
-----END RSA PRIVATE KEY-----`;

const DEFAULT_KEY_PKCS8_RSA = `-----BEGIN PRIVATE KEY-----
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAMdslrZ3uShddxgj
SVprH39/Gv73DjVw4kIOs8j8PZpXdeCwu470S8Z8FCEnsUV+WkJ7HcF/0w/9ZBon
LYLYzPan9Iwa9sNhfRxosDZXX1x3lH4qqdKnQ4o7ZNa8ruYTUZEqRuJXsshb2wCs
nb0JFfv7tOWoK4hILbCk64gdjJqDAgMBAAECgYAY8JeYkjhxt96hAii2ShdSVo8F
u9fnDwr8v+H0DLeXicCQLQoHwr2HQRUzYEdnLXoUPllmTZoTsdjG/IdQidR3+9Li
JSVJ/raIBszdBRKlzkWKkEpZXOZ92H1RmNVQZoaUD+5JpPpj/yxRD4py2P5SyzpO
whU9lMNVkmm4U9z0AQJBAOrBjVN0/9uG7sDn4kucJwH62WmlzYB7GLHj+46244wU
WmIOnNCxvpJ20SPTZYSw5cxHVO2CO24tmKoV2NEe/oECQQDZeIZWVHAQYKptiH13
GHPGdMKunwSM3NkEuCOTtAEosTOUi+53wqnI4b34IFmolzGflruyKl9npxBtzPp2
Xh8DAkAkcZO9BwbJT7M040qwLjeoCQdDbWfvsCxvQVNGHoJItsgpPNd/VnidSDDD
fQffh47FHbXDgVo0ioOOtAGKxWMBAkBDzJ+VKp4FfR2lKHh1ONpfdOd9KXZxtCi0
n/P3iJcT6Kr8FOQz0iy8xCRFx1Asj3aZGpVJ5ov39M3abZ1oac+hAkEAw9PWZEAH
cb8p3kdGnvEpxHKgLkOUkqw4YTYRxGnG3DTHsGKWVppstG4ad07/1AkJKRSR+FgC
eIZfA+ufuTAt7A==
-----END PRIVATE KEY-----`;

const DEFAULT_KEY_PKCS8_RSA_ENCRYPTED = `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIICoTAbBgkqhkiG9w0BBQMwDgQIpBEFeAZygeECAggABIICgAJVly3BfLgnDYiV
fXUeGsriwFe3UhPPVS4YBLKETj4H53UcUJUbftkDPhTU9jMw8PRmbON1LxQQJd+h
yuAHOuXMFxhAPTSCQ4wJwNemTgJifWn3m3jZ+UN43YL5MHitigtBWe65RHCDwN56
5wtwJfvYbm6PjXy3vO7eU1zwgBtSXpPvw1lsBbHPlYGd1Mmvw2tqZ3B97B5TG7lw
JCHk1bnJTpryJn5Dkxhi99KpVkWRr4YM4F0WH38SDNFFPc4ETYbv2AD5HZPOUHOS
Wr4sXBdlcOYlLXKwi+mpTL25krRVMt4PDizs3Gi+ItyodqWnAZgX8kZ/8kh/S/lr
gfZ+RVeebNDR/LQ2lpMMRZrIHuLpluNSa/QJ1jFWLffpwmYlFihjhaslhB6pETWK
NkqFwuMSc/WIUwVJUFLMlOrMc74sf2+qACa6hzmn2QuNNXmZpbmpIXIQ7JM+5oea
oM8uBncgWcILU1iR0BDZtbltQT6opQwQ4shWN1dQvsvVb5AhKZlHWhuYNeXkDIL1
G7x3175pyd0CbsUgpJRvJywAMzrMldJZbZ1wkiJ61lPh3FoxVsIMbbWJs+iD5Nlr
c/WeXLQT8dqJqBGMC+qJywki8GHH62MxXc0JvmNy25Az3ApLjrDm+pcddwiWhbov
iWYE956ieiaAjUizQnTAevPLus6N1+qt9lufiKU4WcIFv1Nsu7zED1SuQ1nH5KkT
X8DELHs1VVu+0Bv/XUibu5C7JgEizmvhdFIAplrz+5UMmrUw8biWfuVf9I9zpqV0
oAV4jZKdbIcE7kgtiR+0UkUj57cZyOVZomR0PzK4wQ3lRfPpIGAotEVwo3YFmdEs
t3XXeeY=
-----END ENCRYPTED PRIVATE KEY-----`;

const DEFAULT_KEY_PKCS8_EC = `-----BEGIN PRIVATE KEY-----
MIGEAgEAMBAGByqGSM49AgEGBSuBBAAKBG0wawIBAQQgQSIHzFPeIeMbccn+h4Xg
599P5rDk1PAwz2qePJMDB52hRANCAARoNkj7iu0Zsf2jJQmNiT0ieovMREnUou4v
bzy2z0LNp0Q2EI9f17QoHlwsUnokXRCo/3xMWkYSGPR3fJn29rjQ
-----END PRIVATE KEY-----`;

const DEFAULT_KEY_PKCS8_EC_ENCRYPTED = `-----BEGIN ENCRYPTED PRIVATE KEY-----
MIGoMBsGCSqGSIb3DQEFAzAOBAiEvM62zcfvpAICCAAEgYjl6tXhdySlzBdTRAL6
TPgDTPTT4ejMXAl2IoG3UX1+8UfpGt7memf0yfIxgxDfPRtCyVkn1/tieIU0FQ3t
9o0O1XRmaATQ4/e5GYb/PWz4CrdzOV5EqFLsPrYo7PcBCH1fFz2Y1zhC72wcQoM1
jMwcG2o4+KPbvgMq3aIrKl3L+rXfRlBtQ/X4
-----END ENCRYPTED PRIVATE KEY-----`;

const DEFAULT_MNEMONIC = 'ticket basket addict level barrel hobby release ivory luxury sausage modify zero';

/*
openssl genrsa                                                                              -out private.tmp 1024
openssl rsa     -in private.tmp -pubout                                                     -out key0.rsa.public.pem
openssl rsa     -in private.tmp                                                             -out key0.rsa.private.pem
rm private.tmp

openssl genrsa                                                                              -out private.tmp 1024
openssl rsa     -in private.tmp -pubout                                                     -out key1.rsa.public.pem
openssl pkcs8   -in private.tmp -topk8 -nocrypt                                             -out key1.rsa.private.pem
rm private.tmp

openssl genrsa                                                                              -out private.tmp 1024
openssl rsa     -in private.tmp -pubout                                                     -out key2.rsa.public.pem
openssl rsa     -in private.tmp -aes256 -passout pass:password                              -out private.tmp
openssl pkcs8   -in private.tmp -topk8 -passin pass:password -passout pass:password         -out key2.rsa.private.pem
rm private.tmp

openssl ecparam -genkey -name secp256k1 -conv_form compressed -noout                        -out private.tmp
openssl ec      -in private.tmp -outform PEM -pubout                                        -out key3.ec.public.pem
openssl pkcs8   -in private.tmp -topk8 -nocrypt                                             -out key3.ec.private.pem
rm private.tmp

openssl ecparam -genkey -name secp256k1 -conv_form compressed -noout                        -out private.tmp
openssl ec      -in private.tmp -outform PEM -pubout                                        -out key4.ec.public.pem
openssl ec      -in private.tmp -aes256 -passout pass:password                              -out private.tmp
openssl pkcs8   -in private.tmp -topk8 -passin pass:password -passout pass:password         -out key4.ec.private.pem
rm private.tmp
*/

//================================================================//
// CryptoKeyScreenController
//================================================================//
class CryptoKeyScreenController {

    @observable password        = '';
    @observable phraseOrKey     = '';
    @observable message         = '';
    @observable signature       = '';

    @observable keyError        = false;
    @observable sigError        = false;

    //----------------------------------------------------------------//
    constructor ( appState ) {
    }

    //----------------------------------------------------------------//
    @action
    async loadKey () {

        this.signature = '';
        this.keyError = false;
        this.sigError = false;

        this.key = false;

        if ( !this.phraseOrKey ) return;

        try {
            const key = await crypto.loadKeyAsync ( this.phraseOrKey, this.password );
            runInAction (() => { this.key = key });
        }
        catch ( error ) {
            runInAction (() => { this.keyError = true });
        }
    }

    //----------------------------------------------------------------//
    @action
    setMessage ( message ) {
        this.message = message;
        this.verify ();
    }

    //----------------------------------------------------------------//
    @action
    async setPassword ( password ) {
        this.password = password;
        await this.loadKey ();
    }

    //----------------------------------------------------------------//
    @action
    async setPhraseOrKey ( phraseOrKey ) {
        this.phraseOrKey = phraseOrKey;
        await this.loadKey ();
    }

    //----------------------------------------------------------------//
    @action
    async setPhraseOrKeyAndPassword ( phraseOrKey, password ) {
        this.phraseOrKey = phraseOrKey;
        this.password = password || '';
        await this.loadKey ();
    }

    //----------------------------------------------------------------//
    @action
    setSignature ( signature ) {
        this.signature = signature;
        this.postOK = false;
        this.verify ();
    }

    //----------------------------------------------------------------//
    @action
    sign () {

        this.signature = '';
        this.sigError = false;

        if ( this.key ) {
            this.signature = this.key.sign ( this.message );

            // const check = Buffer.from ( this.signature, 'hex' );
            // console.log ( 'SIG STR:', sigString, encoding );
            // console.log ( 'CHECK:', signature );
        }
    }

    //----------------------------------------------------------------//
    @action
    async verify () {

        this.sigError = false;

        if ( this.signature.length === 0 ) return;

        if ( this.key ) {
            try {
                console.log ( 'VERIFY:', this.message );
                this.sigError = !this.key.verify ( this.message, this.signature );
            }
            catch ( error ) {
                console.log ( error );
                this.sigError = true;
            }
        }
    }
}

//================================================================//
// CryptoKeyScreen
//================================================================//
export const CryptoKeyScreen = observer (( props ) => {

    const controller    = hooks.useFinalizable (() => new CryptoKeyScreenController ());

    return (
        <SingleColumnContainerView title = 'Test Mnemonic Phrase or Private Key'>

            <UI.Form size = "large">
                <UI.Segment stacked>

                    <UI.Form.Input>
                        <UI.Dropdown
                            fluid
                            text            = 'Sample Keys'
                        >
                            <UI.Dropdown.Menu>
                                <UI.Dropdown.Item text = 'PKCS#1 RSA'                   onClick = {() => { controller.setPhraseOrKeyAndPassword ( DEFAULT_KEY_PKCS1_RSA ); }}/>
                                <UI.Dropdown.Item text = 'PKCS#8 RSA'                   onClick = {() => { controller.setPhraseOrKeyAndPassword ( DEFAULT_KEY_PKCS8_RSA ); }}/>
                                <UI.Dropdown.Item text = 'PKCS#8 RSA w/ passphrase'     onClick = {() => { controller.setPhraseOrKeyAndPassword ( DEFAULT_KEY_PKCS8_RSA_ENCRYPTED, DEFAULT_PASSWORD ); }}/>
                                <UI.Dropdown.Item text = 'PKCS#8 EC'                    onClick = {() => { controller.setPhraseOrKeyAndPassword ( DEFAULT_KEY_PKCS8_EC ); }}/>
                                <UI.Dropdown.Item text = 'PKCS#8 EC w/ passphrase'      onClick = {() => { controller.setPhraseOrKeyAndPassword ( DEFAULT_KEY_PKCS8_EC_ENCRYPTED, DEFAULT_PASSWORD ); }}/>
                                <UI.Dropdown.Item text = 'BIP39 mnemonic'               onClick = {() => { controller.setPhraseOrKeyAndPassword ( DEFAULT_MNEMONIC ); }}/>
                            </UI.Dropdown.Menu>
                        </UI.Dropdown>
                    </UI.Form.Input>

                    <UI.Form.Input
                        rows = { 8 }
                        placeholder = "Password"
                        type = 'password'
                        value = { controller.password }
                        onChange = {( event ) => { controller.setPassword ( event.target.value )}}
                    />
                    <UI.Form.TextArea
                        rows = { 8 }
                        placeholder = "Mnemonic Phrase or Private Key"
                        value = { controller.phraseOrKey }
                        onChange = {( event ) => { controller.setPhraseOrKey ( event.target.value )}}
                        error = { controller.keyError }
                    />
                    <UI.Form.TextArea
                        placeholder = "Message to Sign"
                        value = { controller.message }
                        onChange = {( event ) => { controller.setMessage ( event.target.value )}}
                    />
                    <UI.Form.TextArea
                        rows = { 4 }
                        placeholder = "Signature"
                        value = { controller.signature }
                        onChange = {( event ) => { controller.setSignature ( event.target.value )}}
                        error = { controller.sigError }
                    />
                    <UI.Button
                        color = "teal"
                        disabled = { controller.keyError }
                        fluid size = "large"
                        onClick = {() => { controller.sign ()}}
                    >
                        Sign
                    </UI.Button>
                </UI.Segment>
            </UI.Form>
            
        </SingleColumnContainerView>
    );
});
