import { t } from "elysia";

export const aliasField = t.Lowercase(
  t.String({
    title: "Alias Email",
    description: "The actual unique email",
    error: "Alias must be a valid email",
    examples: ["hello@1as.in"],
  }),
);

export const destinationField = t.Lowercase(
  t.String({
    format: "email",
    title: "Destination Email",
    description: "The destination is associated with user",
    error: "Destination must be a valid email",
    examples: ["c@gmail.com"],
  }),
);

export const usernameField = t.Lowercase(
  t.String({
    title: "User Name",
    description: "the main username of the person it has to be unique",
    minLength: 4,
    pattern: "^[a-z][a-z0-9\_\-\.]{3,15}$",
    examples: ["sivm99"],
    error:
      "Starts with Alphbet, can have Alphanumerics,dots,underscores and hyphens",
  }),
);

export const domainField = t.Lowercase(
  t.String({
    title: "Domain",
    description: "The Domain on which the alias to be made",
    // format: "hostname",
    error: "Invalid domain",
    examples: ["1as.in"],
  }),
);
export const commentField = t.String({
  title: "Comment",
  examples: ["A simple comment"],
  maxLength: 200,
});
export const activeField = t.Boolean({
  title: "Active",
  description: "the mail will be forwarded only when rule is",
});
export const countField = t.Integer({
  title: "count",
  description: "The number of mails Forwarded",
  examples: [12],
});

export const toggleActionField = t.Union(
  [
    t.Literal("enable", {
      title: "Enable Rule",
      description: "Enables the email forwarding to main destination",
    }),
    t.Literal("disable", {
      title: "Disable Rule",
      description: "Diasables the email forwarding to main destination",
    }),

    t.Literal("toggle", {
      title: "Toggle Rule",
      description:
        "Toggles the email forwarding if on turns it off and vice versa",
    }),
    t.Literal("switch", {
      title: "Switch Rule",
      description: "same as toggle rule",
    }),
    t.Literal("flip", {
      title: "Flip Rule",
      description: "Same as toggle rule and switch rule",
    }),
  ],
  {
    examples: ["switch", "enable", "disable", "flip", "toggle"],
  },
);
export type ToggleAction = typeof toggleActionField.static;
