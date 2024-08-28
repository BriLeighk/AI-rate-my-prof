'use client'
import { useState } from "react"; // Add this import
import { Box, Stack, TextField, Button } from "@mui/material";

export default function Home() {
    const [messages, setMessages] = useState([
      {
      "role": "assistant",
      content: "Hello, I'm the Rate My Professor support assistant. How can I help you today?"
      }
    ])

    const [message, setMessage] = useState('');
    const sendMessage = async () => {
        setMessages((messages) => [
          ...messages,
          {role: "user", content: message},
          {role: "assistant", content: ''}
        ])
        setMessage('')
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ messages: [...messages, {role: "user", content: message}] })
        }).then(async (res) => {
          const reader = res.body.getReader()
          const decoder = new TextDecoder()

          let result = ''
          return reader.read().then(function processText({done, value}){
            if(done) {
              return result
            }
            const text = decoder.decode(value || new Uint8Array(), {stream: true})
            setMessages((messages) => {
              let lastMessage = messages[messages.length - 1]
              let otherMessages = messages.slice(0, messages.length - 1)
              return [
                ...otherMessages,
                {...lastMessage, content: lastMessage.content + text},
              ]
            })

            return reader.read().then(processText)
          })
        })
    }

    return (
        <Box 
        width="100%" 
        height="100vh" 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center">
          <Stack 
          direction="column" 
          spacing={2} 
          width="500px" 
          height="700px" 
          border="1px solid #ccc" 
          borderRadius="10px" 
          p={2}
          >
            <Stack 
            direction="column" 
            spacing={2} 
            flexGrow={1} 
            overflow={'auto'}
            >


            {
              messages.map((message, index) => (
                <Box key={index} display="flex" justifyContent={message.role === "assistant" ? "flex-start" : "flex-end"}>
                  <Box backgroundColor={message.role === "assistant" ? "primary.main" : "secondary.main"} color="white" p={2} borderRadius="10px">{message.content}</Box>
                </Box>
              ))
            }
            </Stack>
            <Stack direction="row" spacing={2}> 
              <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here"
              />
              <Button variant="contained" onClick={sendMessage}>Send</Button>
            </Stack>
          </Stack>
        </Box>
    );
}
