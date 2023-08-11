const {
    isMainThread, parentPort, workerData,
} = require('node:worker_threads');

const minMs = 1000 * 60
const hourMs = 60 * minMs

const msTillNextRollReset = () => {
    const currentHourMs = Math.floor(Date.now() / hourMs) * hourMs
    const currentMin = Math.floor((Date.now() - currentHourMs) / minMs)

    if (currentMin > 35) return (currentHourMs + hourMs + (minMs * 35)) - Date.now()
    else return (currentHourMs + (minMs * 35)) - Date.now()
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