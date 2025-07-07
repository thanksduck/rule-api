import { t } from "elysia";

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 15,
} as const;

export const pageField = t.Optional(
  t.Integer({
    minimum: 1,
    default: PAGINATION.DEFAULT_PAGE,
    title: "Page Number",
    error: "Page and Size should always be positive",
    examples: ["1", "3"],
  }),
  true,
);

export const sizeField = t.Optional(
  t.Integer({
    minimum: 1,
    default: PAGINATION.DEFAULT_PAGE_SIZE,
    title: "Page Size",
    error: "Size must be greater than 0",
  }),
  true,
);

export const limitField = (n = 50) =>
  t.Number({
    maximum: n,
    default: 30,
    title: "Limit Field",
    error: `Max limit is set to ${n}`,
  });

export const offsetField = t.Number({
  minimum: 0,
  default: 0,
  title: "Offset Field",
  error: "Offset must be zero or greater",
});

export const orderDirectionField = t.Optional(
  t.Union([
    t.Literal("asc", {
      title: "Ascending order",
      description: "Smaller first",
    }),
    t.Literal("desc", {
      title: "Descending order",
      description: "Larger first",
    }),
  ]),
);
export const dateStringField = t.String({
  format: "date",
  title: "Date Field",
  error: "Please provide a valid date",
  examples: ["2020-01-01"],
});
