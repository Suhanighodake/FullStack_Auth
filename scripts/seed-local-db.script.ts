import { db,pool} from '../server/db/db'
import * as schema from '../server/db/schema'
import { seed } from 'drizzle-seed'

const seedDb = async () => {
    await seed(db,schema)
}

seedDb().then(() => {
    console.log('seeded databse successfully ')
    return pool.end()
})
.catch((err) => {
    console.error(`failed to seed database:\n ${err}`)
    return pool.end()
})
