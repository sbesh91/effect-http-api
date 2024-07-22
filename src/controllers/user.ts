import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import { SqlClient } from "@effect/sql";
import { SqliteDrizzle } from "@effect/sql-drizzle/Sqlite";
import { Effect, Layer } from "effect";

import { eq } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export class UserRouter extends HttpRouter.Tag("UserRouter")<UserRouter>() {
}


const userSchema = sqliteTable("users", {
  id: integer("id").primaryKey({autoIncrement: true}),
  name: text("name")
});

const effect = Effect.gen(function* () {
  const req = yield* HttpServerRequest.HttpServerRequest;
  console.log("I'm an effect", req.originalUrl);
  return req;
});

const map = Effect.map(HttpRouter.params, (params) => {
  console.log(params)
  return params;
});

const dbMap = Effect.map(
  SqliteDrizzle, 
  (db) => db.select().from(userSchema),
);

const dbEffect = Effect.gen(function* () {
  const db = yield* SqliteDrizzle;
  const users = yield* db.select().from(userSchema);
  // console.log('got the users', users);
  return users;
});

const migrate = Effect.gen(function* () {
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
             )`;
});

const UsersRoutes = UserRouter.use((router) =>
  Effect.gen(function* () {
    const db = yield* SqliteDrizzle;
    yield* migrate;
    yield* dbEffect;
    Effect.runPromise(yield* dbMap).then(console.log);

    const getReq = Effect.gen(function* () {
      const req = yield* effect;
      console.log(req);
      const users = yield* db.select().from(userSchema);
      console.log('got the users');
      
      return HttpServerResponse.text(JSON.stringify(users));
    });

    yield* router.get("/", getReq);

    yield* router.get(
      "/:id",
      Effect.gen(function* () {
        yield* map;
        yield* effect;
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
);

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
