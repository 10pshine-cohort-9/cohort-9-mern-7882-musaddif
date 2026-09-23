import { pipeline } from "@huggingface/transformers";

const MODEL_NAME = "Xenova/t5-base-grammar-correction";

let grammarPipeline = null;

const getGrammarPipeline = async () => {
  if (!grammarPipeline) {
    console.log("Loading grammar correction model...");

    grammarPipeline = await pipeline(
      "text2text-generation",
      MODEL_NAME
    );

    console.log("Grammar correction model loaded.");
  }

  return grammarPipeline;
};

export const correctGrammar = async (text) => {
  const generator = await getGrammarPipeline();

  const result = await generator(text, {
    max_new_tokens: 256,
  });

  return result[0].generated_text;
};