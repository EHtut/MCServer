// _probe_attr.js - THROWAWAY. Now the cross-file visibility check for C1.
//
// C1 must hand a value to C2 and C3, which live in other files. `global` is
// rejected outright in server scripts, so it publishes onto a top-level VELDORA
// namespace instead. Server scripts are said to share one scope - this file
// proves it rather than trusting it, because the failure mode is silent: C2
// would read undefined, treat it as notoriety 0, and every drop chance would sit
// at 8% forever while looking perfectly healthy.
//
// This file loads BEFORE notoriety.js (underscore sorts first), so the check
// runs inside ServerEvents.loaded, after every script is in.
(function () {
  ServerEvents.loaded(function (event) {
    var seen = (typeof VELDORA !== 'undefined')
    var fn = seen && typeof VELDORA.notoriety === 'function'
    console.info('[xfile] VELDORA visible from a sibling script: ' + (seen ? 'YES' : 'NO'))
    console.info('[xfile] VELDORA.notoriety callable: ' + (fn ? 'YES' : 'NO'))
    if (!fn) {
      console.info('[xfile] !! C2/C3 CANNOT read C1 across files. Fallback: fold the')
      console.info('[xfile] !! consumer into notoriety.js, or read the NBT store directly.')
    }
  })
})()
