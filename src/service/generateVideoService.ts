import { writeFileSync } from "fs";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import z from "zod";
import openAIService from "../integrations/openAI";

const scenesScriptSchema = z.object({
  scenes: z.array(
    z.object({
      prompt: z.string(),
    })
  ),
});

const scenesPromptSchema = z.object({
  prompt: z.string(),
});

type ScenesScripts = z.infer<typeof scenesScriptSchema>;
type ScenesPrompts = z.infer<typeof scenesPromptSchema>;

class GenerateVideoService {
  private openAIService = openAIService;

  async generateVideoFromScript(script: string) {
    console.log("Generating scene breakdown from script...");

    const scenesScripts = await this.openAIService.createStructuredResponses(
      this.generatePromptsForScenes(script),
      zodTextFormat(scenesScriptSchema, "scenes")
    );

    const scenesDescriptions = scenesScripts.output_parsed as ScenesScripts;

    writeFileSync(
      "scenesDescriptions.json",
      JSON.stringify(scenesDescriptions, null, 2)
    );

    const scenePrompts: ScenesPrompts[] = [];

    for (const scene of scenesDescriptions.scenes) {
      const scenePrompt = await this.openAIService.createStructuredResponses(
        this.generatePromptForVideoGeneration(scene.prompt),
        zodTextFormat(scenesPromptSchema, "scenes")
      );
      scenePrompts.push(scenePrompt.output_parsed as ScenesPrompts);
    }

    writeFileSync("scenePrompts.json", JSON.stringify(scenePrompts, null, 2));

    for (const [index, scene] of scenePrompts.entries()) {
      console.log(
        `Generating video for scene ${index + 1}/${scenePrompts.length}`
      );
      const video = await this.openAIService.generateSceneVideo(scene.prompt);

      if (video) {
        await this.openAIService.downloadVideo(
          video,
          `./videos/output_scene_${index + 1}.mp4`
        );
      }
    }

    const videos = await this.openAIService.listVideos();
    console.log(videos);
  }

  private generatePromptsForScenes(
    script: string
  ): OpenAI.Responses.ResponseInput {
    return [
      {
        role: "system",
        content: `
You are a narrative-to-cinematic scene generator.
Your task is to read a story or script written in any language and transform it into a sequence of vivid, detailed scenes written in the same language as the input (never translate).

Break the story into distinct scenes whenever there is a change of time, location, or focus.

For each scene, write a rich, immersive description as if it were part of a film screenplay or a novel written in cinematic prose.

Each scene should include:
- A detailed description of the environment, including setting, lighting, colors, weather, sounds, and atmosphere.
- The characters present, their actions, body language, and emotional state.
- Internal emotions or tensions conveyed through subtle details such as tone of voice, silence, or gestures.
- Possible dialogues between characters that reveal personality, motivation, or conflict.
- A cinematic sense of perspective — describe the pacing, focus, and mood as if a camera were capturing the moment.
- Use sensory and evocative language (sight, sound, smell, texture) to make each scene feel alive and tangible.

Keep the tone consistent with the original story — if the input is poetic, keep it lyrical; if it’s dark or realistic, preserve that tone.
Do not summarize or simplify events. Expand them visually and emotionally so each scene feels like a living cinematic moment.
      `,
      },
      { role: "user", content: script },
    ];
  }

  private generatePromptForVideoGeneration(
    sceneDescription: string
  ): OpenAI.Responses.ResponseInput {
    return [
      {
        role: "system",
        content: `
You are an assistant specialized in writing prompts for Sora 2. 
Your goal is to generate structured, cinematic video prompts that Sora 2 can interpret clearly and effectively. 
When asked to "generate a prompt for Sora 2," you must follow the structure and rules below.

---
### 🧩 Prompt Template for Sora 2

[Descriptive paragraph]
- Context / setting / characters / environment / mood / visual style  
- Expressive visual details (textures, colors, shapes, lighting)  

Cinematography:
- Camera shot: [framing and angle, e.g., wide shot, close-up, over-the-shoulder]  
- Camera movement: [tracking, dolly, tilt, pan, slow zoom, etc.]  
- Depth of field (if relevant): [shallow, deep, etc.]  

Tone / atmosphere / style:
- Genre or aesthetic reference (e.g., “90s documentary”, “film noir”, “2D/3D hybrid animation with brush texture”)  
- Color palette or visual anchors (e.g., “amber, sand, blue highlights”)  
- Lighting quality (e.g., “soft daylight + warm rim light”, “strong contrasted shadows”)  

Actions / timing / rhythm:
- Action sequence in beats (e.g., “character takes three steps, pauses, looks around, raises hand”)  
- Duration markers (e.g., “within 4 s” or “by 8 s”)  
- Timing of events  

Dialogue / sound (if applicable):
- Block labeled “Dialogue:” with short, natural lines, tagged with speaker names  
- Background sounds or ambient audio cues (e.g., “distant city noise”, “gentle wind”, “machine hum”)  

(If there’s an image reference, include: “input_reference: [description of the image]”)

---
### ⚙️ Rules and Best Practices

1. **Use the same language as the user's input.**  
   If the user writes in Portuguese, output the Sora 2 prompt in Portuguese.  
   If the user writes in English, output it in English.  
   Do not translate unless explicitly asked to.

2. **Be clear but not overloaded.**  
   Leave some creative freedom, but specify key cinematic details (camera, lighting, main action).

3. **Use strong visual descriptions.**  
   Avoid vague terms like "beautiful"; prefer concrete sensory details like "neon reflections on wet asphalt" or "soft dust in golden sunset light."

4. **Limit simultaneous actions.**  
   One primary action per shot is ideal, plus at most one camera movement.

5. **Split into separate shots** if depicting multiple moments — each shot should have its own configuration (camera, light, action).

6. **Keep dialogues concise and natural**, using realistic timing for short clips.

7. **When editing an existing prompt**, specify only what should change and keep working elements intact.

---
### 🎬 Example of a Complete Sora 2 Prompt

A cozy study filled with wooden shelves and old maps. Warm afternoon light pours through the window, casting soft shadows over faded wallpaper.

Cinematography:
- Camera shot: medium close-up, slight dolly-in  
- Camera movement: gentle forward motion for the first 2 seconds  
- Depth of field: shallow (background softly blurred)  

Tone / style:
- Aesthetic: intimate drama with vintage documentary feel  
- Color palette: light brown, amber, beige, and sepia accents  
- Lighting: soft daylight + warm side fill  

Actions / timing:
- (0–1 s) The man adjusts his glasses, glances at the clock  
- (1–2.5 s) He takes a deep breath and opens an old book  
- (2.5–4 s) He whispers something while turning a page  

Dialogue:
Dialogue:
- Narrator: “Wisdom comes with time — and with every page turned.”  

Ambient sound:
- Subtle sound of a page turning  
- Faint ticking of a clock in the distance
      `,
      },
      { role: "user", content: sceneDescription },
    ];
  }
}

export default new GenerateVideoService();
