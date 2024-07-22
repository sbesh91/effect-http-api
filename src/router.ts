import { HttpRouter } from "@effect/platform";
import { Effect, Layer } from "effect";
import { AllUserRoutes, UserRouter } from "./controllers/user";
import { DatabaseLive } from "./db";

export const AllRoutes = HttpRouter.Default.use((router) =>
  Effect.gen(function* () {
    yield* router.mount("/users", yield* UserRouter.router);
  })
).pipe(Layer.provide(AllUserRoutes), Layer.provide(DatabaseLive))