import Elysia from "elysia";
import { ruleHandler } from "./rule-controller";

// export const ruleController = new Elysia({
//   name: "rule_controller",
//   prefix: "/rule",
//   tags: ["Rule"],
// }).use(ruleHandler);

export const rulesController = new Elysia({
  name: "rules_controller",
  prefix: "/rules",
  tags: ["Rules"],
}).use(ruleHandler);
