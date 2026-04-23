import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import * as service from "../api/service.js";

const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
const OPEN_AI_URL = "https://api.openai.com/v1/embeddings";
const OPEN_AI_MODEL = "text-embedding-3-small";

async function retrieveReadEmails(){
    const emails = await service.getRead();
    return emails;
}

async function chunkText(text, maxTokens = 4000) {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: maxTokens, chunkOverlap: 0 })
    const chunks = await splitter.splitText(text);

    return chunks;
}

async function embedText(text) {
    const response = await fetch(OPEN_AI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPEN_AI_KEY}`
        },
        body: JSON.stringify({
            model: OPEN_AI_MODEL,
            input: text
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`OpenAI error ${response.status}: ${err.error?.message}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

async function storeEmbeddings(embedding, metadata, source) {
    service.storeEmbedding(embedding, metadata, source);
}

async function findMostSimilarEmbedding(query){
    const queryEmbedding = await embedText(query);
    const embeddings = await mysql.getEmbeddings();
    const similarities = embeddings.map(embedding => {
        return {
            source: embedding.source,
            similarity: cosineSimilarity(queryEmbedding, embedding.vector)
        }
    });
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, 5);
}

function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

export async function createEmeddings() {
    const previousEmails = await retrieveEmails();
    for (const email of previousEmails) {
        const chunks = await chunkText(email.text);
        for (const chunk of chunks) {
            try {
                const embedding = await embedText(chunk);
                await storeEmbeddings(embedding, { source: email.id }, chunk);
            } catch (err) {
                console.error(`Failed to embed chunk: ${err.message}`);
            }
        }
    }
}

export async function getContext(query){
    const similarEmbeddings = await findMostSimilarEmbedding(query);
    
    const context = similarEmbeddings.map(embedding => embedding.source).join("\n");
    
    return context;
}