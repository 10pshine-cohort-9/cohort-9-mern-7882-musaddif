import { parentPort } from 'node:worker_threads';
import { pipeline } from '@huggingface/transformers';

/**
 * Runs grammar-correction inference inside a dedicated worker thread so the
 * expensive ONNX forward pass never blocks the main process event loop.
 * The model is loaded once per worker and reused across jobs.
 */

const MODEL_NAME = process.env.GRAMMAR_MODEL || 'Xenova/t5-base-grammar-correction';
const MAX_NEW_TOKENS = parseInt(process.env.GRAMMAR_MAX_NEW_TOKENS || '256', 10);

let generatorPromise = null;

const getGenerator = () => {
  if (!generatorPromise) {
    generatorPromise = pipeline('text2text-generation', MODEL_NAME).catch((error) => {
      // Allow a retry on the next request instead of wedging the worker.
      generatorPromise = null;
      throw error;
    });
  }
  return generatorPromise;
};

parentPort.on('message', async ({ id, text }) => {
  try {
    const generator = await getGenerator();
    const result = await generator(text, { max_new_tokens: MAX_NEW_TOKENS });
    parentPort.postMessage({ id, ok: true, correctedText: result[0].generated_text });
  } catch (error) {
    parentPort.postMessage({ id, ok: false, error: error.message || 'Grammar correction failed.' });
  }
});