import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite"
import {SqliteClient} from "@effect/sql-sqlite-node"
import {Config, Layer} from "effect"

const SqlLive = SqliteClient.layer({
  filename: Config.succeed("test.db")
})
const DrizzleLive = SqliteDrizzle.layer.pipe(
  Layer.provide(SqlLive)
)
export const DatabaseLive = Layer.mergeAll(SqlLive, DrizzleLive)
