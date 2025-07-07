import { t } from "elysia";
import { ALLOWED_DOMAINS } from "@/env";
import {
  activeField,
  aliasField,
  commentField,
  countField,
  destinationField,
  domainField,
  usernameField,
} from "./_common";
import {
  dateStringField,
  limitField,
  orderDirectionField,
  pageField,
} from "./_list";

export const allowedDomains = new Set<string>(
  ALLOWED_DOMAINS.split(" ").map((domain) => domain.toLowerCase()),
);

export const RuleSchema = t.Object({
  alias: aliasField,
  destination: destinationField,
  username: usernameField,
  domain: domainField,
  comment: t.Optional(commentField),
  active: activeField,
  count: countField,
  createdAt: dateStringField,
  updatedAt: dateStringField,
});

export type RuleSchema = typeof RuleSchema.static;

export const RuleListSchema = t.Partial(
  t.Composite([
    t.Object({
      page: pageField,
      limit: limitField(),
      sortBy: t.KeyOf(RuleSchema),
      sortOrder: orderDirectionField,
    }),
    t.Pick(RuleSchema, ["domain", "active"]),
  ]),
);

export const GetRuleSchema = t.Pick(RuleSchema, ["domain", "alias"]);

export const CreateRuleSchema = t.Pick(RuleSchema, [
  "alias",
  "destination",
  "domain",
  "username",
  "comment",
]);
