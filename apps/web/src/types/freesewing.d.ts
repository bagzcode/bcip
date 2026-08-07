declare module '@freesewing/aaron' {
  export class Aaron {
    constructor(settings?: Record<string, unknown>);
    draft(): { render: () => string; parts?: Record<string, unknown> };
  }
}

declare module '@freesewing/core' {
  export class Design {
    constructor(config?: unknown);
  }
}
