const {
    isMainThread, parentPort, workerData,
} = require('node:worker_threads');

const minMs = 1000 * 60
const hourMs = 60 * minMs

const msTillNextRollReset = () => {
    const currentHourMs = Math.floor(Date.now() / hourMs) * hourMs
    const currentMin = Math.floor((Date.now() - currentHourMs) / minMs)

    const ofset = 35
    if (currentMin > ofset) return (currentHourMs + hourMs + (minMs * ofset)) - Date.now()
    else return (currentHourMs + (minMs * ofset)) - Date.now()
}

const isClaimReset = () => {
    return (Math.floor(Date.now() / hourMs) + 1) % 3 == 0
}

console.log(`Waiting ${msTillNextRollReset()}ms`)

setTimeout(() => {
    parentPort.postMessage({
        message: "rolls-reset",
        claimReset: isClaimReset()
    })

    setInterval(() => {
        parentPort.postMessage({
            message: "rolls-reset",
            claimReset: isClaimReset()
        })
    }, hourMs)
}, msTillNextRollReset())