import OpenAI from "openai";
import { AutoParseableTextFormat } from "openai/lib/parser";

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPEN_AI_KEY,
      project: process.env.OPEN_AI_PROJECT_ID,
    });
  }

  async createStructuredResponses(
    messages: OpenAI.Responses.ResponseInput,
    responseSchema: AutoParseableTextFormat<any>
  ) {
    return await this.openai.responses.parse({
      model: "gpt-5",
      input: messages,
      text: {
        format: responseSchema,
      },
    });
  }
}

export default new OpenAIService();
