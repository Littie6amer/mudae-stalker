const { QuickDB } = require("quick.db");

module.exports.DBManager = class DBManager {
    constructor () {
        this.init_fin = false
        this.db = new QuickDB()
        this.subs = {}
        this.claimReset = {
            lastMessage: null,
            users: []
        }
        this.init()
    }

    async init () {
        let subs = await this.db.get("subs")
        if (subs == null) subs = await this.db.set("subs", {})
        this.subs = subs
        let claimReset = await this.db.get("claimReset")
        if (claimReset != null) this.claimReset = claimReset
        this.init_fin = true
    }

    async reset () {
        this.active = []
        await this.db.set("active", [])
        this.subs = {}
        return await this.db.set("subs", {})
    }

    async resetSubscriptions () {
        this.subs = {}
        return await this.db.set("subs", {})
    }

    async addSubscription (userId, series) {
        if (!this.init_fin) return false

        if (this.subs[series]?.push) this.subs[series].push(userId)
        else this.subs[series] = [userId]

        await this.db.set("subs", this.subs)
        return true
    }

    async removeSubscription (userId, series) {
        if (!this.init_fin) return false

        if (this.subs[series]?.push) {
            const index = this.subs[series].findIndex(u => u == userId)
            if (index != -1) this.subs[series].splice(index, 1)
        } 

        await this.db.set("subs", this.subs)
        return true
    }

    listSubscriptions (userId) {
        if (!this.init_fin) return null
        const serieskeys = Object.keys(this.subs)

        return serieskeys.filter(s => this.subs[s].includes(userId))
    }

    listSubscribers (series) {
        if (!this.init_fin) return null
        return this.subs[series]
    }

    addActive (userId) {
        if (!this.init_fin) return null

        this.claimReset.users.push(userId)
        this.db.set("claimReset", this.claimReset)

        return this.claimReset
    }

    async resetActive () {
        this.claimReset.users = []
        return await this.db.set("claimReset", this.claimReset)
    }
    
    async resetClaimReset () {
        this.claimReset = {
            users: [],
            lastMessage: null
        }
        return await this.db.set("claimReset", this.claimReset)
    }

    get claimResetMessage () {
        return this.claimReset.lastMessage
    }

    set claimResetMessage (messageId) {
        this.claimResetMessage = messageId
        this.db.set("claimReset")
    }
}