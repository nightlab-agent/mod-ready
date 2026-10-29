// Written by Claude Code 9.9.2.
// The fixture one version on: an event added, a signature changed, a component added, a type dropped.
declare module 'claude-code' {
  export type AgentInfo = {
      id: string;
  };
  export type EngineEventOf = {
      'tool.call': ToolCallInput;
      'turn.step': TurnStepInput;
      'ui.toast': UiToastInput;
  };
  export type EngineResultOf = {
      'tool.call': ToolCallResult;
  };
  export type OpValueOf = {
      'agent.list': AgentInfo[];
  };
  export interface CoreEngineInterface {
      tool: {
          list: () => Promise<ToolInfo[]>;
          register: (tool: ToolSpec,
              extra?: number) => Promise<void>;
      };
      fs: {
          read: (path: string, options?: { as: "bytes" }) => Promise<string>;
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
  export type BoxProps = {
      width?: number;
  };
  export type Surfaces = {
      terminal: {
          Text: ElementConstructor<TextProps>;
          Box: ElementConstructor<BoxProps>;
      };
      desktop: {
          Text: ElementConstructor<TextProps>;
      };
  };
  export type UiToastInput = {
      text: string;
  };
}
