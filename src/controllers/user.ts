import {
  HttpRouter,
  HttpServerResponse,
} from "@effect/platform";
import {SqlClient} from "@effect/sql";
import {SqliteDrizzle} from "@effect/sql-drizzle/Sqlite"
import {Effect, Layer} from "effect";

import {DatabaseLive} from "../db";
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {eq} from "drizzle-orm";

export class UserRouter extends HttpRouter.Tag("UserRouter")<UserRouter>() {
}

const userSchema = sqliteTable("users", {
  id: integer("id").primaryKey({autoIncrement: true}),
  name: text("name")
});

const UsersRoutes = UserRouter.use((router) =>
  Effect.gen(function* () {
    const db = yield* SqliteDrizzle;
    const sql = yield* SqlClient.SqlClient
    yield* sql`CREATE TABLE IF NOT EXISTS users
               (
                 id
                 INTEGER
                 PRIMARY
                 KEY
                 AUTOINCREMENT,
                 name
                 TEXT
               )`

    yield* router.get("/", Effect.gen(function* () {
      const users = yield* db.select().from(userSchema);
      return HttpServerResponse.text(JSON.stringify(users));
    }));

    yield* router.get(
      "/:id",
      Effect.gen(function* () {
        const params = yield* HttpRouter.params;
        const id = Number(params['id']);
        const result = yield* db.select().from(userSchema).where(eq(userSchema.id, id));
        const user = result[0];

        if (!user) {
          return HttpServerResponse.empty({status: 404});
        }

        return HttpServerResponse.text(
          JSON.stringify(user)
        );
      })
    );

    yield* router.post("/", Effect.gen(function* () {
      const newUser = {
        name: 'new user',
      };

      const result = yield* db.insert(userSchema).values(newUser).returning();

      return HttpServerResponse.text(JSON.stringify(result));
    }));
  })
).pipe(Layer.provide(DatabaseLive));

export const AllUserRoutes = UsersRoutes.pipe(
  Layer.provideMerge(UserRouter.Live)
);

//  HttpRouter.post(
//    "/upload",
//    Effect.gen(function* () {
//      const data = yield* HttpServerRequest.schemaBodyForm(Schema.Struct({
//        files: Multipart.FilesSchema
//      }))
//      console.log("got files", data.files)
//      return yield* HttpServerResponse.json(data.files.toString())
//    })
//  ),
