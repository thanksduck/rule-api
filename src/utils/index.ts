import { Rule } from "@/db/schema";

export const updateRuleCount = async (domain: string, alias: string) => {
  try {
    await Rule.findOneAndUpdate(
      { domain, alias, active: true },
      { $inc: { count: 1 } },
      { new: true },
    );
  } catch (error) {
    console.error("Failed to update rule count:", error);
  }
};
