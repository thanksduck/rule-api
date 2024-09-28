import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, index: true, lowercase: true },
    alias: { type: String, required: true, lowercase: true },
    destination: { type: String, required: true, lowercase: true },
    username: { type: String, required: true, lowercase: true },
    comment: String,
    active: { type: Boolean, default: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ruleSchema.index({ domain: 1, alias: 1 }, { unique: true });

const Rule = mongoose.model("Rule", ruleSchema);

export { Rule };
