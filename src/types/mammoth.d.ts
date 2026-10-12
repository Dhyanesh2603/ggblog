declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface MammothInput {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
    path?: string;
  }

  export function convertToHtml(input: MammothInput, options?: Record<string, unknown>): Promise<MammothResult>;
  export function extractRawText(input: MammothInput): Promise<MammothResult>;
  export function convertToMarkdown(input: MammothInput, options?: Record<string, unknown>): Promise<MammothResult>;
}
