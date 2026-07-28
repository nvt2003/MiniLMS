import { InferenceClient } from '@huggingface/inference';

// Nhớ cấu hình HF_TOKEN trong file .env
const hf = new InferenceClient(process.env.HF_TOKEN);

export async function getEmbedding(text) {
  if (!text) return null;
  try {
    const response = await hf.featureExtraction({
      // model: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
      model: 'BAAI/bge-m3',
      inputs: text,
    });
    return response;
  } catch (error) {
    console.error('Lỗi lấy embedding từ HuggingFace:', error);
    return null;
  }
}