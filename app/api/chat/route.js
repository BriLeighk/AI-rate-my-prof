import {Pinecone} from  '@pinecone-database/pinecone'
import OpenAI from 'openai'

const systemPrompt="An AI-powered customer support tool for AI ratemyprof, a platform that provides AI-driven summaries of proffesor reviews.";

export async function POST(req){
    try {
        const { messages } = await req.json();
        console.log('Received messages:', messages); // Add logging

        if (!messages || messages.length === 0) {
            return new Response('Invalid input data', { status: 400 });
        }

        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        })
        const index = pc.index('rag').namespace('ns1')
        const openai = new OpenAI()

        const text = messages[messages.length-1]?.content;
        if (!text) {
            return new Response('Invalid message content', { status: 400 });
        }

        const embedding = await openai.embeddings.create({
            model:'text-embedding-3-small',
            input:text,
            encoding_format: 'float',
        })
        const results = await index.query({
            topK: 3,
            includeMetadata: true,
            vector: embedding.data[0].embedding
        })
        
        let resultString = 'Returned results from vector db (done automatically):'
        results.matches.forEach((match)=>{
            resultString+= '\n Professor :${match.id}  Review:${match.metadata.stars} Subject:${match.metadata.subject} Stars: ${match.metadata.stars}  \n\n'

        })

        const lastMessage = messages[messages.length-1]
        const lastMessageContent = lastMessage.content + resultString
        const lastDataWithoutLastMessage = messages.slice(0, messages.length - 1)
        const completion = await openai.chat.completions.create({
            messages:[
                {role: 'system', content: systemPrompt},
                ...lastDataWithoutLastMessage,
                {role: 'user', content: lastMessageContent},
            ],
            model: 'llama-3.1',
            stream: true,
        })

        const stream = new ReadableStream({
            start(controller) {
                completion.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });
                completion.on('end', () => {
                    controller.close();
                });
            },
        });

        return new Response(stream);
    } catch (error) {
        console.error('Error in POST /api/chat:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}