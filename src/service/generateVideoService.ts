import veo3Service from "../integrations/veo3";
import openAIService from "../integrations/openAI";
import { zodTextFormat } from "openai/helpers/zod";
import z from "zod";
import OpenAI from "openai";
import { writeFileSync } from "fs";
import { Video } from "@google/genai";

const scenesSchema = z.object({
  scenes: z.array(
    z.object({
      prompt: z.string(),
      negative_prompt: z.string(),
    })
  ),
});

type Scenes = z.infer<typeof scenesSchema>;

class GenerateVideoService {
  private vo3Service = veo3Service;
  private openAIService = openAIService;

  async generateVideoFromScript(script: string) {
    // Step 1: Use OpenAI to break the script into scenes
    const scenePrompts = this.generatePromptsForScenes(script);

    console.log("Generating scene breakdown from script...");
    const sceneBreakdownResponse =
      await this.openAIService.createStructuredResponses(
        scenePrompts,
        zodTextFormat(scenesSchema, "scenes")
      );
    console.log("Scene breakdown response:", sceneBreakdownResponse);

    writeFileSync(
      "sceneBreakdownResponse.json",
      JSON.stringify(sceneBreakdownResponse.output_parsed, null, 2)
    );

    const scenesDescriptions = sceneBreakdownResponse.output_parsed as Scenes;

    const videos: Video[] = [];

    for (const [index, scene] of scenesDescriptions.scenes.entries()) {
      console.log(
        `Generating video for scene ${index + 1}/${
          scenesDescriptions.scenes.length
        }`
      );
      const prevVideo = index > 0 ? videos[index - 1] : undefined;

      const video = await this.vo3Service.generateVideo(
        scene.prompt,
        scene.negative_prompt,
        prevVideo
      );

      if (video) {
        videos.push(video);
        await this.vo3Service.downloadVideo(
          video,
          `./videos/output_scene_${index + 1}.mp4`
        );
      }
    }
  }

  private generatePromptsForScenes(
    script: string
  ): OpenAI.Responses.ResponseInput {
    return [
      {
        role: "system",
        content: `
You are a helpful assistant that receives a full video script and breaks it down into distinct scenes for text-to-video generation using Veo 3.

Each scene you produce must include:
- A **prompt** (following Veo 3 prompt guidelines below)
- An optional **negative_prompt**

---
## LANGUAGE RULE (Critical)
Generate all prompts **in the same language as the input script**.  
If the user’s script is in Portuguese, write prompts in Portuguese;  
if it is in English, write in English; and so on.

---
## VEO 3 PROMPT STRUCTURE (follow strictly)

Each prompt must describe, in 35–120 words, the following elements in clear cinematic language:

1. **Subject** (required): the main person, object, animal, or setting.  
2. **Action** (required): what the subject is doing (e.g., walking, running, turning head).  
3. **Style** (required): film direction or creative tone (e.g., sci-fi, horror, film noir, cartoon).  
4. **Camera positioning & movement** (optional): e.g., aerial view, eye-level, top-down, dolly-in, low angle.  
5. **Composition** (optional): e.g., wide shot, close-up, single shot, two-shot.  
6. **Focus & lens effects** (optional): e.g., shallow depth, macro, soft focus, wide-angle lens.  
7. **Environment / color / lighting** (optional): e.g., blue tones, night, warm hues, golden hour.

Provide an **audio** description inside the prompt for each scene containing:
- **dialogue**: direct speech in quotes (e.g., "This must be the key," she murmured.)
- **sfx**: explicit sound effect descriptions (e.g., "engine roaring," "footsteps on gravel")
- **ambience**: continuous environmental sound (e.g., "soft wind and distant birds")

Use **clear, descriptive, visual language**, avoiding vague adjectives or clichés.

---
## NEGATIVE PROMPT
List visual elements to avoid (e.g., "no crowds, no cars, no text overlay").
---

Keep descriptions cinematic, coherent, and visually rich. Maintain continuity across scenes and avoid any unsafe or restricted content.
`,
      },
      { role: "user", content: script },
    ];
  }
}

export default new GenerateVideoService();
