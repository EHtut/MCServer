// _probe_attr.js - THROWAWAY, kept only for the cross-file check.
// C1 publishes onto VELDORA and C2/C3/C7 read it from other files. If that ever
// stops working the symptom is silent: consumers read undefined, treat it as
// notoriety 0, and everything looks healthy at 8% drops forever. So it says so.
(function () {
  ServerEvents.loaded(function () {
    var seen = (typeof VELDORA !== 'undefined')
    var parts = []
    parts.push('notoriety=' + ((seen && typeof VELDORA.notoriety === 'function') ? 'OK' : 'MISSING'))
    parts.push('recordHarvest=' + ((seen && typeof VELDORA.recordHarvest === 'function') ? 'OK' : 'MISSING'))
    parts.push('paths=' + ((seen && VELDORA.paths && typeof VELDORA.paths.escrowFor === 'function') ? 'OK' : 'MISSING'))
    console.info('[xfile] cross-file seams: ' + parts.join('  '))
  })
})()
