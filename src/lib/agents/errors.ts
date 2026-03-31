export class AgentParseError extends Error {
  pillar: string;
  constructor(message: string, pillar: string) {
    super(message);
    this.name = 'AgentParseError';
    this.pillar = pillar;
  }
}

export class AgentSchemaError extends Error {
  pillar: string;
  constructor(message: string, pillar: string) {
    super(message);
    this.name = 'AgentSchemaError';
    this.pillar = pillar;
  }
}
