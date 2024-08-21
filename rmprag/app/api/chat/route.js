
import { NextResponse } from "next/server"
import {Pinecone} from  '@pinecone-database/pinecone'
import OpenAI from 'openai'

const systemPrompt="An AI-powered customer support tool for AI ratemyprof, a platform that provides AI-driven summaries of proffesor reviews.";

export async function POST(req){
    const data = await req.json()
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const index = pc.index('rag').namespace('ns1')
    const openai = new OpenAI()

    const text = data[data.length-1].content
    const embedding = await OpenAI.Embeddings.create({
        model:'text-embedding-3-small',
        input:'text',
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

    const lastMessage = data[data.length-1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)
    const completion = await openai.chat.completions.create({
        messages:[
            {role: 'system', content: systemPrompt},
            ...lastDataWithoutLastMessage,
            {role: 'user', content: lastMessageContent},
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = ReadableStream
}