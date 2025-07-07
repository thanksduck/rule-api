import { Rule } from "@/db/schema";

interface CachedRule {
  destination: string;
  active: boolean;
}

class RuleCache {
  private cache: Map<string, Map<string, CachedRule>> = new Map();

  async initialize() {
    const rules = await Rule.find({}, "domain alias destination active");
    for (const rule of rules) {
      this.addRule(rule);
    }
    console.log(`Initialized cache with ${rules.length} rules`);
  }

  addRule(rule: {
    domain: string;
    alias: string;
    destination: string;
    active: boolean;
  }) {
    if (!this.cache.has(rule.domain)) {
      this.cache.set(rule.domain, new Map());
    }
    this.cache
      .get(rule.domain)!
      .set(rule.alias, { destination: rule.destination, active: rule.active });
  }

  getRule(domain: string, alias: string): CachedRule | undefined {
    return this.cache.get(domain)?.get(alias);
  }

  removeRule(domain: string, alias: string) {
    this.cache.get(domain)?.delete(alias);
  }

  updateRule(
    domain: string,
    alias: string,
    destination: string,
    active: boolean,
  ) {
    const domainMap = this.cache.get(domain);
    if (domainMap) {
      domainMap.set(alias, { destination, active });
    }
  }

  async syncWithDatabase() {
    const rules = await Rule.find({}, "domain alias destination active");
    this.cache.clear();
    for (const rule of rules) {
      this.addRule(rule);
    }
    console.log(`Synced cache with ${rules.length} rules`);
  }
}

export const ruleCache = new RuleCache();
