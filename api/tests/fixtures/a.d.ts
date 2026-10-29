// Written by Claude Code 9.9.1.
// A small file in the shape the engine writes: a fixture, not the real API.
//      'ghost.event': Ghost;
declare module 'claude-code' {
  /**
   * One agent as `$.agent.list()` returns it; the doc may mention `secret: string`.
   */
  export type AgentInfo = {
      id: string;
  };
  export type EngineEventOf = {
      /**
       * Fires when the engine is about to run a tool.
       * @example
       * on("tool.call", { tool: "Read" }, ($, e, next) => next(e))
       */
      'tool.call': ToolCallInput;
      'turn.step': TurnStepInput;
  };
  export type EngineResultOf = {
      'tool.call': ToolCallResult;
  };
  export type OpValueOf = {
      'agent.list': AgentInfo[];
  };
  export interface CoreEngineInterface {
      tool: {
          /**
           * Lists the tools.
           */
          list: () => Promise<ToolInfo[]>;
          register: (tool: ToolSpec,
              extra?: number) => Promise<void>;
      };
      fs: {
          read: (path: string) => Promise<string>;
      };
  }
  export interface EngineInterface extends CoreEngineInterface {
  }
  export interface BuiltinToolInputs {
      Bash: { command: string };
  }
  export type TextProps = {
      color?: string;
      bold?: boolean;
  };
  export type Surfaces = {
      terminal: {
          Text: ElementConstructor<TextProps>;
      };
  };
  export const tier: number;
}
