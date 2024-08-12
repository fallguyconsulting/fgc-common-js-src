// Copyright (c) 2024 Fall Guy LLC All Rights Reserved.

// function now () {

//   var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;

//   if (( typeof performance !== "undefined" && performance !== null) && performance.now) {
//       return performance.now();
//   }
//   else if (( typeof process !== "undefined" && process !== null ) && process.hrtime ) {

//     module.exports = function() {
//       return (getNanoSeconds() - nodeLoadTime) / 1e6;
//     };

//     const hr = process.hrtime ();
//     const nanoSeconds = hr [ 0 ] * 1e9 + hr [ 1 ];
    
//     const moduleLoadTime = getNanoSeconds();
//     const upTime = process.uptime() * 1e9;
//     const nodeLoadTime = moduleLoadTime - upTime;

//     return ( nanoSeconds - nodeLoadTime) / 1e6;

//   }
//   else if (Date.now) {
  
//     module.exports = function() {
//       return Date.now() - loadTime;
//     };

//     loadTime = Date.now();
  
//   }
//   else {
//     module.exports = function() {
//       return new Date().getTime() - loadTime;
//     };
//     loadTime = new Date().getTime();
//   }
// }

//----------------------------------------------------------------//
function now () {
    const hr = process.hrtime ();
    const nanoSeconds = hr [ 0 ] * 1e9 + hr [ 1 ];
    return nanoSeconds / 1e6;
}

//================================================================//
// Stopwatch
//================================================================//
export class Stopwatch {

    t = 0;

    //----------------------------------------------------------------//
    start () {
        this.t = now ();
    }

    //----------------------------------------------------------------//
    stop ( message ) {
        const t = now () - this.t;
        if ( message ) {
            console.log ( message, t );
        }
        return t;
    }
}
