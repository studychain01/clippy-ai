/**
 * COMMAND ROUTER (pure logic)
 * - Parses user input and decides action:
 *    1) "open website <url|query>" -> window.os.openExternal(...)
 *    2) "summarize clipboard"      -> text = window.os.readClipboard() -> LLM summarize
 *    3) "calc <expr>"               -> evaluate via math lib (safe)
 *    4) otherwise                   -> LLM chat (general Q&A)
 *
 * Exports:
 *   runCommandOrChat(input: string, ctx: {
 *     system: string,                    // prompt style text
 *     history: {role, content}[]         // recent messages (for context)
 *   }) => Promise<string>                // returns assistant reply/plain string
 *
 * NOTE: This module should not import React/Electron.
 * It is UI-agnostic and easy to unit test.
 */

import { chat, LLMMessage } from './llm';

export interface CommandResult {
  isCommand: boolean;
  response?: string;
  error?: string;
  shouldContinueToLLM?: boolean;
  clipboardContent?: string;
}

export interface ChatContext {
  system: string;
  history: LLMMessage[];
}

export class CommandProcessor {
  
  /**
   * Main entry point - process user input and return response
   */
  async runCommandOrChat(input: string, ctx: ChatContext): Promise<string> {
    const commandResult = await this.processInput(input);
    
    if (!commandResult.isCommand) {
      // Normal chat - pass to LLM
      return await chat(ctx.system, [...ctx.history, { role: "user", content: input }]);
    }

    if (commandResult.error) {
      return `❌ ${commandResult.error}`;
    }

    if (commandResult.shouldContinueToLLM && commandResult.clipboardContent) {
      // Special case: clipboard summarization
      const prompt = `Please provide a concise summary of this clipboard content:\n\n${commandResult.clipboardContent}`;
      const summary = await chat(ctx.system, [{ role: "user", content: prompt }]);
      return `${commandResult.response}\n\n${summary}`;
    }

    return commandResult.response || "Command executed successfully.";
  }

  /**
   * Process user input to check if it's a command
   */
  private async processInput(input: string): Promise<CommandResult> {
    const trimmed = input.trim();
    
    // Check if it starts with command prefix
    if (!trimmed.startsWith('/')) {
      return { isCommand: false };
    }

    // Parse command and arguments
    const parts = trimmed.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 'help':
          return this.showHelp();
        
        case 'open':
          return await this.openWebsite(args);
        
        case 'calc':
        case 'calculate':
          return this.calculate(args);
        
        case 'clipboard':
          return await this.summarizeClipboard();
        
        default:
          return {
            isCommand: true,
            error: `Unknown command: /${command}. Type /help for available commands.`
          };
      }
    } catch (error: any) {
      return {
        isCommand: true,
        error: `Command error: ${error.message}`
      };
    }
  }

  /**
   * Show available commands
   */
  private showHelp(): CommandResult {
    const helpText = `**🤖 Clippy AI Commands:**

🌐 \`/open <url>\` - Open a website
   Example: \`/open https://google.com\`

📋 \`/clipboard\` - Summarize clipboard content
   Example: \`/clipboard\`

🧮 \`/calc <expression>\` - Calculate math
   Example: \`/calc 2 + 2 * 3\`

❓ \`/help\` - Show this help

💬 **Just type normally for AI chat!**`;

    return {
      isCommand: true,
      response: helpText
    };
  }

  /**
   * Open website command
   */
  private async openWebsite(args: string[]): Promise<CommandResult> {
    if (args.length === 0) {
      return {
        isCommand: true,
        error: "Please provide a URL. Example: /open https://google.com"
      };
    }

    let url = args.join(' ');
    
    // Add https:// if no protocol specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      // In browser environment, open in new tab
      window.open(url, '_blank');
      return {
        isCommand: true,
        response: `✅ Opened: ${url}`
      };
    } catch (error: any) {
      return {
        isCommand: true,
        error: `Failed to open URL: ${error.message}`
      };
    }
  }

  /**
   * Simple calculator
   */
  private calculate(args: string[]): CommandResult {
    if (args.length === 0) {
      return {
        isCommand: true,
        error: "Please provide a math expression. Example: /calc 2 + 2"
      };
    }

    const expression = args.join(' ');
    
    try {
      // Basic safety check - only allow numbers, operators, parentheses, and spaces
      if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        throw new Error("Invalid characters in expression");
      }

      // Use Function constructor for safe evaluation
      const result = Function(`"use strict"; return (${expression})`)();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error("Invalid calculation result");
      }

      return {
        isCommand: true,
        response: `🧮 **${expression}** = **${result}**`
      };
    } catch (error: any) {
      return {
        isCommand: true,
        error: `Invalid math expression: "${expression}"`
      };
    }
  }

  /**
   * Summarize clipboard content (browser version)
   */
  private async summarizeClipboard(): Promise<CommandResult> {
    try {
      // Try to read clipboard using modern API
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        
        if (!clipboardText || clipboardText.trim().length === 0) {
          return {
            isCommand: true,
            error: "Clipboard is empty or contains no text"
          };
        }

        return {
          isCommand: true,
          response: `📋 **Summarizing clipboard content...**`,
          shouldContinueToLLM: true,
          clipboardContent: clipboardText
        };
      } else {
        return {
          isCommand: true,
          error: "Clipboard access not available. Try copying text and asking me to summarize it directly."
        };
      }
    } catch (error: any) {
      return {
        isCommand: true,
        error: `Clipboard access denied. Try copying text and asking me to summarize it directly.`
      };
    }
  }
}
