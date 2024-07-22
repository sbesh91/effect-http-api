import {
  HttpMiddleware,
  HttpRouter,
  HttpServer,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";

import { Layer } from "effect";
import { createServer } from "node:http";
import { AllRoutes } from "./router";

const ServerLive = NodeHttpServer.layer(() => createServer(), {port: 3000})

const HttpLive = HttpRouter.Default.unwrap(HttpServer.serve(HttpMiddleware.logger)).pipe(
  Layer.provide(AllRoutes),
  Layer.provide(ServerLive)
)

NodeRuntime.runMain(Layer.launch(HttpLive))